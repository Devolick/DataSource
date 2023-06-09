export type RequestType<T = any, S = any> = (
  context: Request<T, S>
) => Promise<Result<T, S>>;

export interface Result<T = any, S = any> {
  readonly search?: S | null;
  readonly page: T[];
  readonly total?: number | null;
}

export interface Request<T = any, S = any> {
  readonly search?: S | null;
  readonly index: number;
  readonly size: number;
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
  readonly size?: number;
  readonly limit?: number;
  readonly buffer?: number;
  readonly request: RequestType<T, S>;
}
