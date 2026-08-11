import { Role } from './roles.enum.js';
import { Permission } from './permissions.enum.js';

/** Deny-by-default RBAC matrix — each role grants exactly these permissions. */
export const ROLE_PERMISSION_MATRIX: Record<Role, readonly Permission[]> = {
  [Role.Developer]: [
    Permission.RELEASE_CREATE,
    Permission.RELEASE_READ,
    Permission.RELEASE_UPDATE,
    Permission.RISK_TRIGGER,
    Permission.RISK_READ,
    Permission.POLICY_READ,
  ],
  [Role.ReleaseManager]: [
    Permission.RELEASE_CREATE,
    Permission.RELEASE_READ,
    Permission.RELEASE_UPDATE,
    Permission.RELEASE_APPROVE,
    Permission.RELEASE_DEPLOY,
    Permission.RELEASE_ROLLBACK,
    Permission.RISK_TRIGGER,
    Permission.RISK_READ,
    Permission.RISK_OVERRIDE,
    Permission.POLICY_READ,
    Permission.AUDIT_READ,
  ],
  [Role.SRE]: [
    Permission.RELEASE_READ,
    Permission.RELEASE_DEPLOY,
    Permission.RELEASE_ROLLBACK,
    Permission.RISK_READ,
    Permission.POLICY_READ,
    Permission.AUDIT_READ,
  ],
  [Role.Leadership]: [
    Permission.RELEASE_READ,
    Permission.RISK_READ,
    Permission.POLICY_READ,
    Permission.AUDIT_READ,
    Permission.AUDIT_EXPORT,
  ],
  [Role.Auditor]: [
    Permission.RELEASE_READ,
    Permission.RISK_READ,
    Permission.POLICY_READ,
    Permission.AUDIT_READ,
    Permission.AUDIT_EXPORT,
  ],
  [Role.Admin]: Object.values(Permission),
} as const;

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSION_MATRIX[role].includes(permission);
}

export function getPermissionsForRole(role: Role): readonly Permission[] {
  return ROLE_PERMISSION_MATRIX[role];
}
