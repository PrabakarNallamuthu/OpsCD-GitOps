import { ErrorCode } from './error-codes.enum.js';
import type { FieldError } from './error-response.type.js';
/** Base class for all Opsera domain exceptions. Framework-agnostic. */
export declare abstract class OpseraException extends Error {
    readonly code: ErrorCode;
    readonly correlationId: string;
    readonly details?: FieldError[] | undefined;
    abstract readonly statusCode: number;
    constructor(code: ErrorCode, message: string, correlationId: string, details?: FieldError[] | undefined);
}
export declare class OpseraNotFoundException extends OpseraException {
    readonly statusCode = 404;
    constructor(resource: string, id: string, correlationId: string);
}
export declare class OpseraForbiddenException extends OpseraException {
    readonly statusCode = 403;
    constructor(message: string, correlationId: string);
}
export declare class OpseraUnauthorizedException extends OpseraException {
    readonly statusCode = 401;
    constructor(correlationId: string);
}
export declare class OpseraValidationException extends OpseraException {
    readonly statusCode = 422;
    constructor(correlationId: string, details: FieldError[]);
}
export declare class OpseraConflictException extends OpseraException {
    readonly statusCode = 409;
    constructor(message: string, correlationId: string);
}
export declare class OpseraServiceUnavailableException extends OpseraException {
    readonly statusCode = 503;
    constructor(service: string, correlationId: string);
}
//# sourceMappingURL=exceptions.d.ts.map