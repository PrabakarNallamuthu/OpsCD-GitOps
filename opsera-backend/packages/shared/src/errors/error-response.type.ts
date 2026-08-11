import type { ValidationError } from 'class-validator';
import { ErrorCode } from './error-codes.enum.js';

/** Per-field validation failure detail. */
export interface FieldError {
  readonly field: string;
  readonly constraint: string;
  readonly message: string;
}

/**
 * Structured error response envelope — used by every Opsera HTTP service.
 * correlation_id links to distributed traces and audit records.
 */
export interface ErrorResponse {
  readonly error: {
    readonly code: ErrorCode;
    readonly message: string;
    readonly correlation_id: string;
    readonly details?: FieldError[];
  };
}

/**
 * Converts class-validator ValidationError[] into the Opsera FieldError[] format.
 * Handles nested validation errors recursively.
 */
export function formatValidationErrors(errors: ValidationError[]): FieldError[] {
  const result: FieldError[] = [];

  function flatten(errs: ValidationError[], prefix = ''): void {
    for (const err of errs) {
      const field = prefix ? `${prefix}.${err.property}` : err.property;
      if (err.constraints) {
        for (const [constraint, message] of Object.entries(err.constraints)) {
          result.push({ field, constraint, message });
        }
      }
      if (err.children && err.children.length > 0) {
        flatten(err.children, field);
      }
    }
  }

  flatten(errors);
  return result;
}

/** Builds a complete ErrorResponse object. */
export function buildErrorResponse(
  code: ErrorCode,
  message: string,
  correlationId: string,
  details?: FieldError[],
): ErrorResponse {
  return {
    error: {
      code,
      message,
      correlation_id: correlationId,
      ...(details && details.length > 0 ? { details } : {}),
    },
  };
}
