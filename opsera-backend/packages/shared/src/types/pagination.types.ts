import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

/** Cursor-based pagination request. Limit defaults to 50, max 100. */
export class PaginationRequest {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? parseInt(value, 10) : value,
  )
  limit?: number = 50;
}

/** Cursor-based pagination response envelope. */
export interface PaginationResponse<T> {
  readonly items: T[];
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
  readonly total?: number | undefined;
}

export function buildPaginationResponse<T>(
  items: T[],
  nextCursor: string | null,
  total?: number,
): PaginationResponse<T> {
  const base = {
    items,
    nextCursor,
    hasMore: nextCursor !== null,
  };
  return total !== undefined ? { ...base, total } : base;
}
