/** Pagination query params applied to list endpoints. */
export interface PaginationQuery {
  readonly page: number;
  readonly limit: number;
}

/** Standard paginated response envelope. */
export interface PaginatedResponse<T> {
  readonly data: T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  query: PaginationQuery,
): PaginatedResponse<T> {
  return {
    data,
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.ceil(total / query.limit),
  };
}
