import { v4 as uuidv4 } from 'uuid';
import { asUUID, asISO8601, type UUID, type ISO8601Timestamp } from '../../src/types/common.types.js';
import { CreateReleaseDto, ReleaseStatus, TargetEnvironment, type ReleaseResponseDto } from '../../src/dtos/release.dto.js';
import { RiskFindingDto, RiskLevel, RiskRecommendation, RiskDimension, type RiskAssessmentResponseDto } from '../../src/dtos/risk.dto.js';
import { Role } from '../../src/rbac/roles.enum.js';
import { AuditAction } from '../../src/compliance/audit-action.enum.js';
import type { OpseraEvent, EventActor } from '../../src/events/base-event.interface.js';
import type { ReleaseCreatedPayload } from '../../src/events/release.events.js';
import { RELEASE_EVENT_TYPES } from '../../src/events/release.events.js';

function genId(): UUID {
  return asUUID(uuidv4());
}

function genTimestamp(): ISO8601Timestamp {
  return asISO8601(new Date().toISOString());
}

// ─── Release factories ───────────────────────────────────────────────────────

export function createMockCreateReleaseDto(
  overrides?: Partial<CreateReleaseDto>,
): CreateReleaseDto {
  const dto = new CreateReleaseDto();
  dto.name = overrides?.name ?? 'Release v1.2.0';
  dto.description = overrides?.description ?? 'Quarterly feature release';
  dto.targetEnvironmentId = overrides?.targetEnvironmentId ?? genId();
  dto.changeRefs = overrides?.changeRefs ?? ['abc1234', 'def5678'];
  if (overrides?.jiraTicket !== undefined) {
    dto.jiraTicket = overrides.jiraTicket;
  }
  return dto;
}

export function createMockRelease(overrides?: Partial<ReleaseResponseDto>): ReleaseResponseDto {
  const now = genTimestamp();
  return {
    id: genId(),
    name: 'Release v1.2.0',
    description: 'Quarterly feature release',
    status: ReleaseStatus.PENDING,
    targetEnvironmentId: genId(),
    changeRefs: ['abc1234', 'def5678'],
    createdBy: genId(),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ─── Risk factories ──────────────────────────────────────────────────────────

export function createMockRiskFinding(overrides?: Partial<RiskFindingDto>): RiskFindingDto {
  const dto = new RiskFindingDto();
  dto.dimension = overrides?.dimension ?? RiskDimension.CODE_CHANGE;
  dto.severity = overrides?.severity ?? RiskLevel.MEDIUM;
  dto.description = overrides?.description ?? 'High churn rate detected in payment module';
  dto.evidence = overrides?.evidence ?? 'src/payments/: 847 lines changed (+312/-535)';
  return dto;
}

export function createMockRiskAssessment(
  overrides?: Partial<RiskAssessmentResponseDto>,
): RiskAssessmentResponseDto {
  return {
    id: genId(),
    releaseId: genId(),
    score: 42,
    riskLevel: RiskLevel.MEDIUM,
    recommendation: RiskRecommendation.GO_WITH_CONDITIONS,
    findings: [createMockRiskFinding()],
    summary: 'Moderate risk — 1 medium finding. Proceed with additional monitoring.',
    completedAt: genTimestamp(),
    durationMs: 1850,
    ...overrides,
  };
}

// ─── Event factories ─────────────────────────────────────────────────────────

export function createMockEventActor(overrides?: Partial<EventActor>): EventActor {
  return {
    id: genId(),
    role: Role.Developer,
    email: 'dev@opsera.io',
    ...overrides,
  };
}

export function createMockOpseraEvent<T>(
  type: string,
  payload: T,
  overrides?: Partial<OpseraEvent<T>>,
): OpseraEvent<T> {
  return {
    id: genId(),
    type,
    timestamp: genTimestamp(),
    correlationId: genId(),
    actor: createMockEventActor(),
    version: '1.0',
    payload,
    ...overrides,
  };
}

export function createMockReleaseCreatedEvent(): OpseraEvent<ReleaseCreatedPayload> {
  const releaseId = genId();
  return createMockOpseraEvent(RELEASE_EVENT_TYPES.CREATED, {
    releaseId,
    name: 'Release v1.2.0',
    targetEnvironmentId: genId(),
    changeRefs: ['abc1234'],
  });
}

// ─── Policy / Audit factories ────────────────────────────────────────────────

export interface MockPolicyRule {
  readonly id: UUID;
  readonly name: string;
  readonly expression: string;
  readonly enabled: boolean;
  readonly createdAt: ISO8601Timestamp;
}

export function createMockPolicyRule(overrides?: Partial<MockPolicyRule>): MockPolicyRule {
  return {
    id: genId(),
    name: 'require-risk-score-below-70',
    expression: 'release.riskScore < 70',
    enabled: true,
    createdAt: genTimestamp(),
    ...overrides,
  };
}

export interface MockAuditRecord {
  readonly id: UUID;
  readonly resourceType: string;
  readonly resourceId: UUID;
  readonly action: AuditAction;
  readonly actorId: UUID;
  readonly recordHash: string;
  readonly timestamp: ISO8601Timestamp;
}

export function createMockAuditRecord(overrides?: Partial<MockAuditRecord>): MockAuditRecord {
  return {
    id: genId(),
    resourceType: 'Release',
    resourceId: genId(),
    action: AuditAction.RELEASE_CREATED,
    actorId: genId(),
    recordHash: 'sha256:' + 'a'.repeat(64),
    timestamp: genTimestamp(),
    ...overrides,
  };
}
