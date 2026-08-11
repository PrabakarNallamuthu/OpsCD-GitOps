"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asUUID = asUUID;
exports.nowISO = nowISO;
exports.asISO8601 = asISO8601;
exports.ok = ok;
exports.err = err;
exports.isOk = isOk;
exports.isErr = isErr;
/** Cast a string to UUID — use only when the value is already validated as a UUID. */
function asUUID(value) {
    return value;
}
function nowISO() {
    return new Date().toISOString();
}
function asISO8601(value) {
    return value;
}
function ok(value) {
    return { ok: true, value };
}
function err(error) {
    return { ok: false, error };
}
function isOk(r) {
    return r.ok;
}
function isErr(r) {
    return !r.ok;
}
//# sourceMappingURL=common.types.js.map