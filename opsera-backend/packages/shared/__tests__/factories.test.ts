import { validate } from 'class-validator';
import {
  createMockRelease,
  createMockCreateReleaseDto,
  createMockRiskFinding,
  createMockRiskAssessment,
  createMockOpseraEvent,
  createMockReleaseCreatedEvent,
  createMockPolicyRule,
  createMockAuditRecord,
} from '../test/fixtures/factories.js';
import { ReleaseStatus } from '../src/dtos/release.dto.js';
import { RiskLevel, RiskRecommendation } from '../src/dtos/risk.dto.js';
import { AuditAction } from '../src/compliance/audit-action.enum.js';

describe('createMockCreateReleaseDto', () => {
  it('produces a DTO that passes class-validator', async () => {
    const dto = createMockCreateReleaseDto();
    const errors = await validate(dto, { whitelist: true });
    expect(errors).toHaveLength(0);
  });

  it('respects overrides', () => {
    const dto = createMockCreateReleaseDto({ name: 'Custom Release' });
    expect(dto.name).toBe('Custom Release');
  });
});

describe('createMockRelease', () => {
  it('produces a valid ReleaseResponseDto', () => {
    const r = createMockRelease();
    expect(r.id).toBeTruthy();
    expect(r.status).toBe(ReleaseStatus.PENDING);
    expect(r.changeRefs).toHaveLength(2);
  });

  it('respects status override', () => {
    const r = createMockRelease({ status: ReleaseStatus.DEPLOYED });
    expect(r.status).toBe(ReleaseStatus.DEPLOYED);
  });
});

describe('createMockRiskFinding', () => {
  it('produces a valid RiskFindingDto', async () => {
    const dto = createMockRiskFinding();
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});

describe('createMockRiskAssessment', () => {
  it('produces a complete assessment with findings', () => {
    const a = createMockRiskAssessment();
    expect(a.score).toBeGreaterThanOrEqual(0);
    expect(a.score).toBeLessThanOrEqual(100);
    expect([RiskLevel.CRITICAL, RiskLevel.HIGH, RiskLevel.MEDIUM, RiskLevel.LOW, RiskLevel.NONE]).toContain(a.riskLevel);
    expect([RiskRecommendation.GO, RiskRecommendation.NO_GO, RiskRecommendation.GO_WITH_CONDITIONS]).toContain(a.recommendation);
    expect(a.findings.length).toBeGreaterThanOrEqual(1);
  });
});

describe('createMockOpseraEvent', () => {
  it('builds a well-formed event envelope', () => {
    const event = createMockOpseraEvent('opsera.test.event', { foo: 'bar' });
    expect(event.id).toBeTruthy();
    expect(event.type).toBe('opsera.test.event');
    expect(event.version).toBe('1.0');
    expect(event.timestamp).toMatch(/Z$/);
    expect(event.correlationId).toBeTruthy();
    expect(event.actor.id).toBeTruthy();
    expect(event.payload).toEqual({ foo: 'bar' });
  });
});

describe('createMockReleaseCreatedEvent', () => {
  it('produces a ReleaseCreatedEvent with correct type', () => {
    const event = createMockReleaseCreatedEvent();
    expect(event.type).toBe('opsera.release.created');
    expect(event.payload.changeRefs).toHaveLength(1);
  });
});

describe('createMockPolicyRule', () => {
  it('produces a valid policy rule', () => {
    const rule = createMockPolicyRule();
    expect(rule.id).toBeTruthy();
    expect(rule.enabled).toBe(true);
    expect(typeof rule.expression).toBe('string');
  });
});

describe('createMockAuditRecord', () => {
  it('produces a valid audit record', () => {
    const record = createMockAuditRecord();
    expect(record.action).toBe(AuditAction.RELEASE_CREATED);
    expect(record.recordHash).toMatch(/^sha256:/);
  });
});
