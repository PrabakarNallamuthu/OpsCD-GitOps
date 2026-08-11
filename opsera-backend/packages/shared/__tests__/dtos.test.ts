import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateReleaseDto, ReleaseStatus } from '../src/dtos/release.dto.js';
import { RiskFindingDto, RiskLevel, RiskDimension, RiskRecommendation } from '../src/dtos/risk.dto.js';

describe('CreateReleaseDto', () => {
  function validPayload(): object {
    return {
      name: 'Release v2.0',
      targetEnvironmentId: '550e8400-e29b-41d4-a716-446655440000',
      changeRefs: ['abc1234'],
    };
  }

  it('valid payload passes all validation constraints', async () => {
    const dto = plainToInstance(CreateReleaseDto, validPayload());
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    expect(errors).toHaveLength(0);
  });

  it('unknown properties are stripped (whitelist:true)', async () => {
    const dto = plainToInstance(CreateReleaseDto, { ...validPayload(), hackerField: 'injected' });
    const errors = await validate(dto, { whitelist: true });
    expect(errors).toHaveLength(0);
    // @ts-expect-error — checking runtime stripping
    expect(dto.hackerField).toBeUndefined();
  });

  it('unknown properties cause error (forbidNonWhitelisted:true)', async () => {
    const dto = plainToInstance(CreateReleaseDto, { ...validPayload(), hackerField: 'injected' });
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    expect(errors.some((e) => e.property === 'hackerField')).toBe(true);
  });

  it('name shorter than 3 chars fails validation', async () => {
    const dto = plainToInstance(CreateReleaseDto, { ...validPayload(), name: 'AB' });
    const errors = await validate(dto, { whitelist: true });
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('name longer than 100 chars fails validation', async () => {
    const dto = plainToInstance(CreateReleaseDto, { ...validPayload(), name: 'A'.repeat(101) });
    const errors = await validate(dto, { whitelist: true });
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('empty changeRefs array fails validation (min 1)', async () => {
    const dto = plainToInstance(CreateReleaseDto, { ...validPayload(), changeRefs: [] });
    const errors = await validate(dto, { whitelist: true });
    expect(errors.some((e) => e.property === 'changeRefs')).toBe(true);
  });

  it('invalid UUID for targetEnvironmentId fails validation', async () => {
    const dto = plainToInstance(CreateReleaseDto, { ...validPayload(), targetEnvironmentId: 'not-a-uuid' });
    const errors = await validate(dto, { whitelist: true });
    expect(errors.some((e) => e.property === 'targetEnvironmentId')).toBe(true);
  });
});

describe('ReleaseStatus enum', () => {
  it('covers all expected lifecycle states', () => {
    const statuses = Object.values(ReleaseStatus);
    expect(statuses).toContain('PENDING');
    expect(statuses).toContain('APPROVED');
    expect(statuses).toContain('DEPLOYED');
    expect(statuses).toContain('ROLLED_BACK');
    expect(statuses).toContain('FAILED');
  });
});

describe('RiskFindingDto', () => {
  it('valid finding passes validation', async () => {
    const dto = plainToInstance(RiskFindingDto, {
      dimension: RiskDimension.CODE_CHANGE,
      severity: RiskLevel.HIGH,
      description: 'High churn in payments module',
      evidence: 'payments/: +500/-300 lines',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('invalid dimension enum fails validation', async () => {
    const dto = plainToInstance(RiskFindingDto, {
      dimension: 'INVALID_DIM',
      severity: RiskLevel.LOW,
      description: 'x',
      evidence: 'y',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'dimension')).toBe(true);
  });
});

describe('RiskLevel and RiskRecommendation enums', () => {
  it('RiskLevel has all 5 levels', () => {
    const levels = Object.values(RiskLevel);
    expect(levels).toContain('CRITICAL');
    expect(levels).toContain('HIGH');
    expect(levels).toContain('MEDIUM');
    expect(levels).toContain('LOW');
    expect(levels).toContain('NONE');
  });

  it('RiskRecommendation has GO, NO_GO, GO_WITH_CONDITIONS', () => {
    expect(RiskRecommendation.GO).toBe('GO');
    expect(RiskRecommendation.NO_GO).toBe('NO_GO');
    expect(RiskRecommendation.GO_WITH_CONDITIONS).toBe('GO_WITH_CONDITIONS');
  });
});
