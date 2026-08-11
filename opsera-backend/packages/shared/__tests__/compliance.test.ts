import { ComplianceFramework } from '../src/compliance/frameworks.enum.js';
import { DataClassification } from '../src/compliance/data-classification.enum.js';
import { AuditAction } from '../src/compliance/audit-action.enum.js';

describe('ComplianceFramework enum', () => {
  it('has all 5 frameworks', () => {
    const frameworks = Object.values(ComplianceFramework);
    expect(frameworks).toContain('SOX');
    expect(frameworks).toContain('SOC2');
    expect(frameworks).toContain('PCI_DSS');
    expect(frameworks).toContain('GDPR');
    expect(frameworks).toContain('DORA');
    expect(frameworks).toHaveLength(5);
  });
});

describe('DataClassification enum', () => {
  it('has Public, Internal, Confidential, Restricted', () => {
    expect(DataClassification.Public).toBe('PUBLIC');
    expect(DataClassification.Internal).toBe('INTERNAL');
    expect(DataClassification.Confidential).toBe('CONFIDENTIAL');
    expect(DataClassification.Restricted).toBe('RESTRICTED');
    expect(Object.values(DataClassification)).toHaveLength(4);
  });
});

describe('AuditAction enum', () => {
  it('covers release lifecycle actions', () => {
    expect(AuditAction.RELEASE_CREATED).toBe('RELEASE_CREATED');
    expect(AuditAction.RELEASE_APPROVED).toBe('RELEASE_APPROVED');
    expect(AuditAction.RELEASE_DEPLOYED).toBe('RELEASE_DEPLOYED');
    expect(AuditAction.RELEASE_ROLLED_BACK).toBe('RELEASE_ROLLED_BACK');
  });

  it('covers user auth actions', () => {
    expect(AuditAction.USER_LOGIN).toBe('USER_LOGIN');
    expect(AuditAction.USER_LOGOUT).toBe('USER_LOGOUT');
    expect(AuditAction.USER_ROLE_CHANGED).toBe('USER_ROLE_CHANGED');
  });

  it('all values are UPPER_SNAKE_CASE', () => {
    for (const action of Object.values(AuditAction)) {
      expect(action).toMatch(/^[A-Z_]+$/);
    }
  });
});
