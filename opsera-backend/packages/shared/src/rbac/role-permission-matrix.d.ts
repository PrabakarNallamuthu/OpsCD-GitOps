import { Role } from './roles.enum.js';
import { Permission } from './permissions.enum.js';
/** Deny-by-default RBAC matrix — each role grants exactly these permissions. */
export declare const ROLE_PERMISSION_MATRIX: Record<Role, readonly Permission[]>;
export declare function hasPermission(role: Role, permission: Permission): boolean;
export declare function getPermissionsForRole(role: Role): readonly Permission[];
//# sourceMappingURL=role-permission-matrix.d.ts.map