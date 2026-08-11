"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationVerdict = exports.VERIFICATION_EVENT_TYPES = void 0;
exports.VERIFICATION_EVENT_TYPES = {
    REQUESTED: 'opsera.verification.requested',
    COMPLETED: 'opsera.verification.completed',
    FAILED: 'opsera.verification.failed',
};
var VerificationVerdict;
(function (VerificationVerdict) {
    VerificationVerdict["PASS"] = "PASS";
    VerificationVerdict["FAIL"] = "FAIL";
    VerificationVerdict["INCONCLUSIVE"] = "INCONCLUSIVE";
})(VerificationVerdict || (exports.VerificationVerdict = VerificationVerdict = {}));
//# sourceMappingURL=verification.events.js.map