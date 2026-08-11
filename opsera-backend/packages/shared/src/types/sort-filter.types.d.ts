export declare enum SortDirection {
    ASC = "ASC",
    DESC = "DESC"
}
export declare enum FilterOperator {
    EQ = "EQ",
    NEQ = "NEQ",
    GT = "GT",
    GTE = "GTE",
    LT = "LT",
    LTE = "LTE",
    IN = "IN",
    CONTAINS = "CONTAINS"
}
export declare class SortRequest {
    field: string;
    direction: SortDirection;
}
export declare class FilterRequest {
    field: string;
    operator: FilterOperator;
    value?: unknown;
}
//# sourceMappingURL=sort-filter.types.d.ts.map