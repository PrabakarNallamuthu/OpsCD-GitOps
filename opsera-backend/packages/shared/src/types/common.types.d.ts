/**
 * Branded UUID type — prevents accidental assignment of plain strings at compile time.
 * Use `uuid()` from the `uuid` package to generate valid values.
 */
declare const __brand: unique symbol;
export type UUID = string & {
    readonly [__brand]: 'UUID';
};
/** Cast a string to UUID — use only when the value is already validated as a UUID. */
export declare function asUUID(value: string): UUID;
/**
 * ISO 8601 timestamp string with UTC timezone (e.g. "2026-08-11T08:00:00.000Z").
 * All timestamps in Opsera must be UTC.
 */
export type ISO8601Timestamp = string & {
    readonly [__brand]: 'ISO8601Timestamp';
};
export declare function nowISO(): ISO8601Timestamp;
export declare function asISO8601(value: string): ISO8601Timestamp;
/**
 * Discriminated union for operation outcomes — avoids throwing for expected failure paths.
 * Already defined in the stub; re-exported here for full module compatibility.
 */
export type Result<T, E = Error> = {
    readonly ok: true;
    readonly value: T;
} | {
    readonly ok: false;
    readonly error: E;
};
export declare function ok<T>(value: T): Result<T, never>;
export declare function err<E>(error: E): Result<never, E>;
export declare function isOk<T, E>(r: Result<T, E>): r is {
    ok: true;
    value: T;
};
export declare function isErr<T, E>(r: Result<T, E>): r is {
    ok: false;
    error: E;
};
export {};
//# sourceMappingURL=common.types.d.ts.map