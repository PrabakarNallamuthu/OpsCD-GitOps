"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditAction = void 0;
var AuditAction;
(function (AuditAction) {
    AuditAction["RELEASE_CREATED"] = "RELEASE_CREATED";
    AuditAction["RELEASE_APPROVED"] = "RELEASE_APPROVED";
    AuditAction["RELEASE_REJECTED"] = "RELEASE_REJECTED";
    AuditAction["RELEASE_DEPLOYED"] = "RELEASE_DEPLOYED";
    AuditAction["RELEASE_ROLLED_BACK"] = "RELEASE_ROLLED_BACK";
    AuditAction["RISK_ANALYSIS_TRIGGERED"] = "RISK_ANALYSIS_TRIGGERED";
    AuditAction["RISK_ANALYSIS_COMPLETED"] = "RISK_ANALYSIS_COMPLETED";
    AuditAction["RISK_OVERRIDDEN"] = "RISK_OVERRIDDEN";
    AuditAction["POLICY_CREATED"] = "POLICY_CREATED";
    AuditAction["POLICY_UPDATED"] = "POLICY_UPDATED";
    AuditAction["POLICY_DELETED"] = "POLICY_DELETED";
    AuditAction["USER_LOGIN"] = "USER_LOGIN";
    AuditAction["USER_LOGOUT"] = "USER_LOGOUT";
    AuditAction["USER_ROLE_CHANGED"] = "USER_ROLE_CHANGED";
    AuditAction["EVIDENCE_EXPORTED"] = "EVIDENCE_EXPORTED";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
//# sourceMappingURL=audit-action.enum.js.map