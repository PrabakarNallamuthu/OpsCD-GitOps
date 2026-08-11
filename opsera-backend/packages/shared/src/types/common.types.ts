/**
 * Branded UUID type — prevents accidental assignment of plain strings at compile time.
 * Use `uuid()` from the `uuid` package to generate valid values.
 */
declare const __brand: unique symbol;
export type UUID = string & { readonly [__brand]: 'UUID' };

/** Cast a string to UUID — use only when the value is already validated as a UUID. */
export function asUUID(value: string): UUID {
  return value as UUID;
}

/**
 * ISO 8601 timestamp string with UTC timezone (e.g. "2026-08-11T08:00:00.000Z").
 * All timestamps in Opsera must be UTC.
 */
export type ISO8601Timestamp = string & { readonly [__brand]: 'ISO8601Timestamp' };

export function nowISO(): ISO8601Timestamp {
  return new Date().toISOString() as ISO8601Timestamp;
}

export function asISO8601(value: string): ISO8601Timestamp {
  return value as ISO8601Timestamp;
}

/**
 * Discriminated union for operation outcomes — avoids throwing for expected failure paths.
 * Already defined in the stub; re-exported here for full module compatibility.
 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function isOk<T, E>(r: Result<T, E>): r is { ok: true; value: T } {
  return r.ok;
}

export function isErr<T, E>(r: Result<T, E>): r is { ok: false; error: E } {
  return !r.ok;
}
