"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpseraServiceUnavailableException = exports.OpseraConflictException = exports.OpseraValidationException = exports.OpseraUnauthorizedException = exports.OpseraForbiddenException = exports.OpseraNotFoundException = exports.OpseraException = void 0;
const error_codes_enum_js_1 = require("./error-codes.enum.js");
/** Base class for all Opsera domain exceptions. Framework-agnostic. */
class OpseraException extends Error {
    code;
    correlationId;
    details;
    constructor(code, message, correlationId, details) {
        super(message);
        this.code = code;
        this.correlationId = correlationId;
        this.details = details;
        this.name = this.constructor.name;
        // Maintains proper stack trace in V8
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
exports.OpseraException = OpseraException;
class OpseraNotFoundException extends OpseraException {
    statusCode = 404;
    constructor(resource, id, correlationId) {
        super(error_codes_enum_js_1.ErrorCode.NOT_FOUND, `${resource} with id '${id}' not found`, correlationId);
    }
}
exports.OpseraNotFoundException = OpseraNotFoundException;
class OpseraForbiddenException extends OpseraException {
    statusCode = 403;
    constructor(message, correlationId) {
        super(error_codes_enum_js_1.ErrorCode.FORBIDDEN, message, correlationId);
    }
}
exports.OpseraForbiddenException = OpseraForbiddenException;
class OpseraUnauthorizedException extends OpseraException {
    statusCode = 401;
    constructor(correlationId) {
        super(error_codes_enum_js_1.ErrorCode.UNAUTHORIZED, 'Authentication required', correlationId);
    }
}
exports.OpseraUnauthorizedException = OpseraUnauthorizedException;
class OpseraValidationException extends OpseraException {
    statusCode = 422;
    constructor(correlationId, details) {
        super(error_codes_enum_js_1.ErrorCode.VALIDATION_ERROR, 'Validation failed', correlationId, details);
    }
}
exports.OpseraValidationException = OpseraValidationException;
class OpseraConflictException extends OpseraException {
    statusCode = 409;
    constructor(message, correlationId) {
        super(error_codes_enum_js_1.ErrorCode.CONFLICT, message, correlationId);
    }
}
exports.OpseraConflictException = OpseraConflictException;
class OpseraServiceUnavailableException extends OpseraException {
    statusCode = 503;
    constructor(service, correlationId) {
        super(error_codes_enum_js_1.ErrorCode.SERVICE_UNAVAILABLE, `Service '${service}' is currently unavailable`, correlationId);
    }
}
exports.OpseraServiceUnavailableException = OpseraServiceUnavailableException;
//# sourceMappingURL=exceptions.js.map