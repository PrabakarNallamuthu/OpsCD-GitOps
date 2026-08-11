"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatValidationErrors = formatValidationErrors;
exports.buildErrorResponse = buildErrorResponse;
/**
 * Converts class-validator ValidationError[] into the Opsera FieldError[] format.
 * Handles nested validation errors recursively.
 */
function formatValidationErrors(errors) {
    const result = [];
    function flatten(errs, prefix = '') {
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
function buildErrorResponse(code, message, correlationId, details) {
    return {
        error: {
            code,
            message,
            correlation_id: correlationId,
            ...(details && details.length > 0 ? { details } : {}),
        },
    };
}
//# sourceMappingURL=error-response.type.js.map