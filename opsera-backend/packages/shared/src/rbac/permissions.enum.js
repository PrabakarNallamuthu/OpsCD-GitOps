"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permission = void 0;
var Permission;
(function (Permission) {
    // Release permissions
    Permission["RELEASE_CREATE"] = "RELEASE_CREATE";
    Permission["RELEASE_READ"] = "RELEASE_READ";
    Permission["RELEASE_UPDATE"] = "RELEASE_UPDATE";
    Permission["RELEASE_DELETE"] = "RELEASE_DELETE";
    Permission["RELEASE_APPROVE"] = "RELEASE_APPROVE";
    Permission["RELEASE_DEPLOY"] = "RELEASE_DEPLOY";
    Permission["RELEASE_ROLLBACK"] = "RELEASE_ROLLBACK";
    // Risk permissions
    Permission["RISK_TRIGGER"] = "RISK_TRIGGER";
    Permission["RISK_READ"] = "RISK_READ";
    Permission["RISK_OVERRIDE"] = "RISK_OVERRIDE";
    // Policy permissions
    Permission["POLICY_CREATE"] = "POLICY_CREATE";
    Permission["POLICY_READ"] = "POLICY_READ";
    Permission["POLICY_UPDATE"] = "POLICY_UPDATE";
    Permission["POLICY_DELETE"] = "POLICY_DELETE";
    // Audit permissions
    Permission["AUDIT_READ"] = "AUDIT_READ";
    Permission["AUDIT_EXPORT"] = "AUDIT_EXPORT";
    // Admin permissions
    Permission["USER_MANAGE"] = "USER_MANAGE";
    Permission["ROLE_ASSIGN"] = "ROLE_ASSIGN";
    Permission["SYSTEM_CONFIG"] = "SYSTEM_CONFIG";
})(Permission || (exports.Permission = Permission = {}));
//# sourceMappingURL=permissions.enum.js.map