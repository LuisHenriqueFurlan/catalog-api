export interface PageQuery {
  page: number;
  limit: number;
}

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}
