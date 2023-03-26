import { DataSourceOptions, Result, Request } from "./default";

export class DataSource<T = any, S = any> {
  search?: S | null;
  page!: T[];
  index!: number;
  indexes!: number;
  size!: number;
  limit!: number;
  total?: number | null;

  loading!: boolean;
  more!: boolean;

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

  query(search?: S): Promise<Result<T, S>> {
    const promise = this.load(search, 0, this.size);

    return promise;
  }
  fetch(search?: S): Promise<Result<T, S>> {
    const clone = this.clone(false);
    const repeat = (index: number = 0): Promise<Result<T, S>> =>
      clone
        .load(search, ++index, this.limit)
        .then(() => (clone.more ? repeat(index) : clone.read(0)));
    const promise = repeat(-1).then((result) => {
      Object.assign(this, clone);
      return result;
    });

    return promise;
  }
  next(index?: number): Promise<Result<T, S>> {
    if (index === undefined || index > this.indexes) {
      index = Math.min(index ?? -1, this.indexes) + 1;
      const promise = this.load(this.search, index);

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
    this._predicate = predicate;
    this._filtered = this._predicate
      ? this._data.filter(this._predicate)
      : this._data;
    const result = this.read(0);

    return result;
  }

  upsert(predicate: (value: T, index: number) => boolean, item: T): void {
    const index = this.get().findIndex(predicate);
    if (index >= 0) {
      this.get().splice(index, 1, item);
    }
  }

  clear(): void {
    this.init(this._options);
  }

  [Symbol.iterator] = () => this.get()[Symbol.iterator]();

  private init(options: DataSourceOptions<T, S>): void {
    this.search = null;
    this._data = [];
    this._filtered = null;
    this.page = [];
    this.index = 0;
    this.indexes = 0;
    this.size = options.size ?? 100;
    this.limit = options.limit ?? 1000;
    this.total = null;

    this.loading = false;
    this.more = false;

    this._predicate = null;
    this._reject = null;
  }

  private load(
    search?: S | null,
    index?: number,
    size?: number
  ): Promise<Result<T, S>> {
    if (index === undefined) {
      this._data.splice(0);
    }
    index = index ?? 0;
    size = size ?? this.size;

    const context: Request<T, S> = {
      search,
      index,
      size,
      indexes: this.indexes,
      page: this.page,
      total: this.total,
    };

    const result = this._options.request(context).then((response) => {
      this.more = response.page.length >= size!;
      this.page = response.page;
      this._data.push(...response.page);
      this.index = index!;
      this.indexes = Math.ceil(this._data.length / this.size);
      this.search = response.search;
      this.total = response.total;

      return response;
    });

    return this.promise(result);
  }

  private read(index: number): Result<T, S> {
    this.index = index;
    this.indexes = Math.ceil(this.get().length / this.size);
    this.page = this.get().slice(this.index, this.size);
    const result: Result<T, S> = {
      page: this.page,
      search: this.search,
      total: this.total,
    };

    return result;
  }

  private async promise(result: Promise<Result<T, S>>): Promise<Result<T, S>> {
    this._reject?.();

    const cancelable = new Promise<Result<T, S>>(
      (resolve, reject) => (this._reject = reject)
    );

    return await Promise.race([cancelable, result]).then((result) => {
      this._reject = null;

      return result;
    });
  }
}
