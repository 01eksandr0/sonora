/** Canonical pagination contract returned by our API (never Deezer's `next` URL). */
export interface Pagination {
  total: number
  limit: number
  offset: number
  hasNext: boolean
}

export interface Paginated<T> {
  items: T[]
  pagination: Pagination
}

export interface PaginationQuery {
  limit?: number
  offset?: number
}
