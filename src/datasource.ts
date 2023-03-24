export interface Result<T = any, S = any> {
  readonly search?: S | null;
  readonly page: T[];
  readonly total?: number | null;
}

export interface Source<T = any, S = any> {
  readonly search?: S | null;
  readonly page: T[];
  readonly index: number;
  readonly indexes: number;
  readonly size: number;
  readonly limit: number;
  readonly total?: number | null;
}

export interface DataSourceOptions<T = any, S = any> {
  readonly size: number;
  readonly limit: number;
  readonly request: (context: Source<T, S>) => Promise<Result<T, S>>;
}

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
  private _predicate?: ((value: T, index: number, array: T[]) => T[]) | null;
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

  query(search?: S): Promise<Result<T, S>> {
    const result = this.load(search, 0, true);

    return this.promise(result);
  }
  fetch(search?: S): Promise<Result<T, S>> {
    const clone = this.clone(false);
    const result = clone
      .query(search)
      .then((result) => (this.more ? clone.query(search) : result));

    Object.assign(this, clone);

    return this.promise(result);
  }
  next(index?: number): Promise<Result<T, S>> {
    if (index === undefined && this.more) {
      index == this.index + 1;
    }

    const result = this.load(this.search, index, false);

    return this.promise(result);
  }
  cancel(): Promise<Result<T, S>> {
    const result = new Promise<Result<T, S>>((resolve) => {
      const result: Result<T, S> = {
        page: [],
        search: this.search,
        total: this.total,
      };

      resolve(result);
    });

    return this.promise(result);
  }

  filter(
    predicate: (value: T, index: number, array: T[]) => T[]
  ): Result<T, S> {
    this._predicate = predicate;
    this._filtered = this._data.filter(this._predicate);
    const result = this.step(0, false);

    return result;
  }

  upsert(predicate: (value: T, index: number) => T, item: T) {
    const index = this.get().findIndex(predicate);
    if (index >= 0) {
      this.get().splice(index, 1, item);
    }
  }

  clear(): void {
    this.init(this._options);
  }

  [Symbol.iterator] = () => this.get()[Symbol.iterator];

  private init(options: DataSourceOptions<T, S>): void {
    this.search = null;
    this._data = [];
    this._filtered = [];
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
    index: number = 0,
    reload: boolean = false
  ): Promise<Result<T, S>> {
    this.search = search;
    this.indexes = Math.ceil(this._data.length / this.size);
    const fromData =
      !this.more || (this.indexes >= index && !!this._data.length);

    if (fromData && !reload) {
      const result = new Promise<Result<T, S>>((resolve) => {
        const page = this._data.slice(this.index, this.size);
        const result: Result<T, S> = {
          page,
          search: this.search,
          total: this.total,
        };

        resolve(result);
      });

      return this.promise(result);
    } else if (this.more) {
      const context: Source<T, S> = {
        search: this.search,
        page: this.page,
        index: this.indexes + 1,
        indexes: this.indexes,
        size: this.size,
        limit: this.limit,
        total: this.total,
      };

      const result = this._options.request(context).then((result) => {
        this.more = result.page.length == this.size;
        this._data.push(...result.page);

        if (result?.search !== undefined) {
          this.search = result.search;
        }
        if (result.total !== undefined) {
          this.total = result.total;
        }

        return result;
      });

      return this.promise(result);
    } else {
      const result = new Promise<Result<T, S>>((resolve) => {
        const result: Result<T, S> = {
          page: [],
          search: this.search,
          total: this.total,
        };

        resolve(result);
      });

      return this.promise(result);
    }
  }

  private get(): T[] {
    return this._filtered || this._data;
  }

  private step(index: number = 0, reload: boolean = false): Result<T, S> {
    if (reload) {
      this._filtered = null;
      this._predicate = null;
    }
    const data = this._filtered || this._data;
    this.index = index;
    this.indexes = Math.ceil(data.length / this.size);

    const page = data.slice(this.index, this.size);
    const result: Result<T, S> = {
      page,
      search: this.search,
      total: this.total,
    };

    return result;
  }

  private promise(result: Promise<Result<T, S>>) {
    this._reject?.();

    const cancelable = new Promise<Result<T, S>>(
      (resolve, reject) => (this._reject = reject)
    );

    return Promise.race([cancelable, result]).then((result) => {
      this._reject = null;

      return result;
    });
  }
}
