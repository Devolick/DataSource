import { DataSourceOptions, Result, Request } from "./default";

export class DataSource<T = any, S = any> {
  get search(): T[] {
    return this.search;
  }
  get page(): T[] {
    return this._page;
  }
  get index(): number {
    return this._index;
  }
  get indexes(): number {
    return this._indexes;
  }
  get size(): number {
    return this._size;
  }
  get limit(): number {
    return this._limit;
  }
  get buffer(): number {
    return this._buffer;
  }
  get total(): number | null | undefined {
    return this._total;
  }
  get loading(): boolean {
    return this._loading;
  }
  get more(): boolean {
    return this._more;
  }
  get data(): T[] {
    return this.get();
  }

  private _search?: S | null;
  private _page!: T[];
  private _index!: number;
  private _indexes!: number;
  private _size!: number;
  private _limit!: number;
  private _buffer!: number;
  private _total?: number | null;
  private _loading!: boolean;
  private _more!: boolean;

  private _data!: T[];
  private _filtered!: T[] | null;
  private _predicate?:
    | ((value: T, index: number, array: T[]) => boolean)
    | null;
  private _reject?: ((reason?: any) => void) | null;

  constructor(private _options: DataSourceOptions<T, S>) {
    this.init(_options);
  }

  clone(full?: boolean): DataSource<T, S> {
    const clone = new DataSource<T, S>({
      size: this._options.size,
      limit: this._options.limit,
      request: this._options.request,
    });
    if (full) {
      Object.assign(clone, this);
    }

    return clone;
  }

  get(): T[] {
    return this._filtered || this._data;
  }

  set(data: T[]): void {
    this._data = data;
    this._filtered = this._predicate
      ? this._data.filter(this._predicate)
      : this._data;
  }

  query(search?: S): Promise<Result<T, S>> {
    const that = this._predicate ? this.clone(false) : this;
    const size = this._predicate ? this._limit : this._size;
    const repeat = async (index: number = 0): Promise<Result<T, S>> =>
      await that
        .load(size, ++index, search)
        .then(async (result) =>
          that._more && result.page.length < size
            ? await repeat(index)
            : that.read(0)
        );
    const promise = repeat(-1).then((result) => {
      Object.assign(this, that);
      return result;
    });

    return promise;
  }
  fetch(search?: S): Promise<Result<T, S>> {
    const that = this.clone(false);
    const repeat = async (index: number = 0): Promise<Result<T, S>> =>
      await that
        .load(this._limit, index + 1, search)
        .then(async () =>
          that._more ? await repeat(index + 1) : that.read(0)
        );
    const promise = repeat(-1).then((result) => {
      Object.assign(this, that);
      return result;
    });

    return promise;
  }
  next(index?: number): Promise<Result<T, S>> {
    if (index === undefined || index > this._indexes) {
      index = index ? this._indexes : index ?? -1;
      const that = this._predicate ? this.clone(false) : this;
      const size = this._predicate ? this._limit : this._size;
      const repeat = async (index: number = 0): Promise<Result<T, S>> =>
        await that
          .load(size, ++index, this._search)
          .then(async (result) =>
            that._more && result.page.length < size
              ? await repeat(index)
              : that.read(0)
          );
      const promise = repeat(index).then((result) => {
        Object.assign(this, that);
        return result;
      });

      return promise;
    } else {
      index = Math.min(Math.max(index ?? 0, 1), 20);
      const result = this.read(index);

      return this.promise(Promise.resolve(result));
    }
  }

  cancel(): void {
    this._reject?.();
  }

  filter(
    predicate: ((value: T, index: number, array: T[]) => boolean) | null
  ): Result<T, S> {
    this.cancel();

    this._predicate = predicate;
    this.set(this._data);
    const result = this.read(0);

    return result;
  }

  insert(
    predicate: (value: T, index: number) => boolean,
    ...items: T[]
  ): Result<T, S> {
    this.cancel();

    const index = this._data.findIndex(predicate);
    if (index > -1) {
      this._data.splice(index, 0, ...items);
    }
    const result = this.read(this._index);

    return result;
  }
  upsert(
    predicate: (value: T, index: number) => boolean,
    item: (value: T, index: number) => T
  ): Result<T, S> {
    this.cancel();

    const index = this.get().findIndex(predicate);
    if (index > -1) {
      const newItem = item(this.get()[index], index);
      this.get().splice(index, 1, newItem);
    }
    const result = this.read(0);

    return result;
  }
  remove(predicate: (value: T, index: number) => boolean): Result<T, S> {
    this.cancel();

    this._data = this._data.filter((value, index) => !predicate(value, index));
    const result = this.read(0);

    return result;
  }
  clear(): Result<T, S> {
    this.cancel();

    this.init(this._options);
    const result = this.read(0);

    return result;
  }

  [Symbol.iterator] = () => this.get()[Symbol.iterator]();

  // TODO Async iterator with render delay

  private init(options: DataSourceOptions<T, S>): void {
    this._search = null;
    this._data = [];
    this._filtered = null;
    this._page = [];
    this._index = 0;
    this._indexes = 0;
    this._size = options.size ?? 100;
    this._limit = options.limit ?? 1000;
    this._buffer = options.buffer ?? 10000;
    this._total = null;

    this._loading = false;
    this._more = false;

    this._predicate = null;
    this._reject = null;
  }

  private load(
    size: number,
    index: number | null = null,
    search: S | null = null
  ): Promise<Result<T, S>> {
    if (index === undefined) {
      this._data.splice(0);
    }
    index = index ?? 0;

    const context: Request<T, S> = {
      search,
      index,
      size,
    };

    const result = this._options.request(context).then((response) => {
      this._more = response.more;
      this._page = response.page;
      this._data.push(...response.page);
      this._index = index!;
      this._indexes = Math.ceil(this._data.length / size);
      this._search = response.search;
      this._total = response.total;

      this.set(this._data);

      return response;
    });

    return this.promise(result);
  }

  private read(index: number): Result<T, S> {
    this._index = index;
    this._indexes = Math.ceil(this.get().length / this._size);
    this._page = this.get().slice(this._index, this._size);
    const result: Result<T, S> = {
      page: this._page,
      more: this._more,
      search: this._search,
      total: this._total,
    };

    return result;
  }

  private async promise(result: Promise<Result<T, S>>): Promise<Result<T, S>> {
    this.cancel();

    const cancelable = new Promise<Result<T, S>>(
      (resolve, reject) => (this._reject = reject)
    );

    return await Promise.race([cancelable, result]).then((result) => {
      this._reject = null;

      return result;
    });
  }
}
