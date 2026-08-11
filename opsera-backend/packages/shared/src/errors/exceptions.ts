import { ErrorCode } from './error-codes.enum.js';
import type { FieldError } from './error-response.type.js';

/** Base class for all Opsera domain exceptions. Framework-agnostic. */
export abstract class OpseraException extends Error {
  abstract readonly statusCode: number;

  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly correlationId: string,
    readonly details?: FieldError[],
  ) {
    super(message);
    this.name = this.constructor.name;
    // Maintains proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class OpseraNotFoundException extends OpseraException {
  readonly statusCode = 404;

  constructor(resource: string, id: string, correlationId: string) {
    super(ErrorCode.NOT_FOUND, `${resource} with id '${id}' not found`, correlationId);
  }
}

export class OpseraForbiddenException extends OpseraException {
  readonly statusCode = 403;

  constructor(message: string, correlationId: string) {
    super(ErrorCode.FORBIDDEN, message, correlationId);
  }
}

export class OpseraUnauthorizedException extends OpseraException {
  readonly statusCode = 401;

  constructor(correlationId: string) {
    super(ErrorCode.UNAUTHORIZED, 'Authentication required', correlationId);
  }
}

export class OpseraValidationException extends OpseraException {
  readonly statusCode = 422;

  constructor(correlationId: string, details: FieldError[]) {
    super(ErrorCode.VALIDATION_ERROR, 'Validation failed', correlationId, details);
  }
}

export class OpseraConflictException extends OpseraException {
  readonly statusCode = 409;

  constructor(message: string, correlationId: string) {
    super(ErrorCode.CONFLICT, message, correlationId);
  }
}

export class OpseraServiceUnavailableException extends OpseraException {
  readonly statusCode = 503;

  constructor(service: string, correlationId: string) {
    super(ErrorCode.SERVICE_UNAVAILABLE, `Service '${service}' is currently unavailable`, correlationId);
  }
}
