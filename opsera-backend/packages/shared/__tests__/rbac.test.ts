import { Role } from '../src/rbac/roles.enum.js';
import { Permission } from '../src/rbac/permissions.enum.js';
import { ROLE_PERMISSION_MATRIX, hasPermission, getPermissionsForRole } from '../src/rbac/role-permission-matrix.js';

describe('Role enum', () => {
  it('has all 6 expected roles', () => {
    const roles = Object.values(Role);
    expect(roles).toContain('DEVELOPER');
    expect(roles).toContain('RELEASE_MANAGER');
    expect(roles).toContain('SRE');
    expect(roles).toContain('LEADERSHIP');
    expect(roles).toContain('AUDITOR');
    expect(roles).toContain('ADMIN');
    expect(roles).toHaveLength(6);
  });

  it('all role values are UPPER_SNAKE_CASE strings', () => {
    for (const r of Object.values(Role)) {
      expect(r).toMatch(/^[A-Z_]+$/);
    }
  });
});

describe('Permission enum', () => {
  it('has release management permissions', () => {
    expect(Permission.RELEASE_CREATE).toBe('RELEASE_CREATE');
    expect(Permission.RELEASE_APPROVE).toBe('RELEASE_APPROVE');
    expect(Permission.RELEASE_ROLLBACK).toBe('RELEASE_ROLLBACK');
  });

  it('has risk permissions', () => {
    expect(Permission.RISK_TRIGGER).toBe('RISK_TRIGGER');
    expect(Permission.RISK_OVERRIDE).toBe('RISK_OVERRIDE');
  });

  it('has audit permissions', () => {
    expect(Permission.AUDIT_READ).toBe('AUDIT_READ');
    expect(Permission.AUDIT_EXPORT).toBe('AUDIT_EXPORT');
  });

  it('has admin-only permissions', () => {
    expect(Permission.USER_MANAGE).toBe('USER_MANAGE');
    expect(Permission.SYSTEM_CONFIG).toBe('SYSTEM_CONFIG');
  });
});

describe('ROLE_PERMISSION_MATRIX', () => {
  it('Admin has all permissions', () => {
    const adminPerms = ROLE_PERMISSION_MATRIX[Role.Admin];
    const allPerms = Object.values(Permission);
    for (const perm of allPerms) {
      expect(adminPerms).toContain(perm);
    }
  });

  it('Developer cannot approve or deploy releases', () => {
    expect(hasPermission(Role.Developer, Permission.RELEASE_APPROVE)).toBe(false);
    expect(hasPermission(Role.Developer, Permission.RELEASE_DEPLOY)).toBe(false);
    expect(hasPermission(Role.Developer, Permission.RELEASE_ROLLBACK)).toBe(false);
  });

  it('Developer can create and read releases', () => {
    expect(hasPermission(Role.Developer, Permission.RELEASE_CREATE)).toBe(true);
    expect(hasPermission(Role.Developer, Permission.RELEASE_READ)).toBe(true);
  });

  it('Auditor has read + export but not create/deploy', () => {
    expect(hasPermission(Role.Auditor, Permission.AUDIT_READ)).toBe(true);
    expect(hasPermission(Role.Auditor, Permission.AUDIT_EXPORT)).toBe(true);
    expect(hasPermission(Role.Auditor, Permission.RELEASE_CREATE)).toBe(false);
    expect(hasPermission(Role.Auditor, Permission.RELEASE_DEPLOY)).toBe(false);
  });

  it('Leadership is read-only for releases and risk', () => {
    expect(hasPermission(Role.Leadership, Permission.RELEASE_READ)).toBe(true);
    expect(hasPermission(Role.Leadership, Permission.RISK_READ)).toBe(true);
    expect(hasPermission(Role.Leadership, Permission.RELEASE_CREATE)).toBe(false);
    expect(hasPermission(Role.Leadership, Permission.RISK_OVERRIDE)).toBe(false);
  });

  it('every role is represented in the matrix', () => {
    for (const role of Object.values(Role)) {
      expect(ROLE_PERMISSION_MATRIX[role]).toBeDefined();
      expect(Array.isArray(ROLE_PERMISSION_MATRIX[role])).toBe(true);
    }
  });

  it('getPermissionsForRole returns same array as matrix', () => {
    expect(getPermissionsForRole(Role.SRE)).toEqual(ROLE_PERMISSION_MATRIX[Role.SRE]);
  });
});
