"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSION_MATRIX = void 0;
exports.hasPermission = hasPermission;
exports.getPermissionsForRole = getPermissionsForRole;
const roles_enum_js_1 = require("./roles.enum.js");
const permissions_enum_js_1 = require("./permissions.enum.js");
/** Deny-by-default RBAC matrix — each role grants exactly these permissions. */
exports.ROLE_PERMISSION_MATRIX = {
    [roles_enum_js_1.Role.Developer]: [
        permissions_enum_js_1.Permission.RELEASE_CREATE,
        permissions_enum_js_1.Permission.RELEASE_READ,
        permissions_enum_js_1.Permission.RELEASE_UPDATE,
        permissions_enum_js_1.Permission.RISK_TRIGGER,
        permissions_enum_js_1.Permission.RISK_READ,
        permissions_enum_js_1.Permission.POLICY_READ,
    ],
    [roles_enum_js_1.Role.ReleaseManager]: [
        permissions_enum_js_1.Permission.RELEASE_CREATE,
        permissions_enum_js_1.Permission.RELEASE_READ,
        permissions_enum_js_1.Permission.RELEASE_UPDATE,
        permissions_enum_js_1.Permission.RELEASE_APPROVE,
        permissions_enum_js_1.Permission.RELEASE_DEPLOY,
        permissions_enum_js_1.Permission.RELEASE_ROLLBACK,
        permissions_enum_js_1.Permission.RISK_TRIGGER,
        permissions_enum_js_1.Permission.RISK_READ,
        permissions_enum_js_1.Permission.RISK_OVERRIDE,
        permissions_enum_js_1.Permission.POLICY_READ,
        permissions_enum_js_1.Permission.AUDIT_READ,
    ],
    [roles_enum_js_1.Role.SRE]: [
        permissions_enum_js_1.Permission.RELEASE_READ,
        permissions_enum_js_1.Permission.RELEASE_DEPLOY,
        permissions_enum_js_1.Permission.RELEASE_ROLLBACK,
        permissions_enum_js_1.Permission.RISK_READ,
        permissions_enum_js_1.Permission.POLICY_READ,
        permissions_enum_js_1.Permission.AUDIT_READ,
    ],
    [roles_enum_js_1.Role.Leadership]: [
        permissions_enum_js_1.Permission.RELEASE_READ,
        permissions_enum_js_1.Permission.RISK_READ,
        permissions_enum_js_1.Permission.POLICY_READ,
        permissions_enum_js_1.Permission.AUDIT_READ,
        permissions_enum_js_1.Permission.AUDIT_EXPORT,
    ],
    [roles_enum_js_1.Role.Auditor]: [
        permissions_enum_js_1.Permission.RELEASE_READ,
        permissions_enum_js_1.Permission.RISK_READ,
        permissions_enum_js_1.Permission.POLICY_READ,
        permissions_enum_js_1.Permission.AUDIT_READ,
        permissions_enum_js_1.Permission.AUDIT_EXPORT,
    ],
    [roles_enum_js_1.Role.Admin]: Object.values(permissions_enum_js_1.Permission),
};
function hasPermission(role, permission) {
    return exports.ROLE_PERMISSION_MATRIX[role].includes(permission);
}
function getPermissionsForRole(role) {
    return exports.ROLE_PERMISSION_MATRIX[role];
}
//# sourceMappingURL=role-permission-matrix.js.map