/** Cursor-based pagination request. Limit defaults to 50, max 100. */
export declare class PaginationRequest {
    cursor?: string;
    limit?: number;
}
/** Cursor-based pagination response envelope. */
export interface PaginationResponse<T> {
    readonly items: T[];
    readonly nextCursor: string | null;
    readonly hasMore: boolean;
    readonly total?: number | undefined;
}
export declare function buildPaginationResponse<T>(items: T[], nextCursor: string | null, total?: number): PaginationResponse<T>;
//# sourceMappingURL=pagination.types.d.ts.map