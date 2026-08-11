import { ErrorCode } from '../src/errors/error-codes.enum.js';
import { formatValidationErrors, buildErrorResponse } from '../src/errors/error-response.type.js';
import {
  OpseraNotFoundException,
  OpseraForbiddenException,
  OpseraValidationException,
  OpseraConflictException,
} from '../src/errors/exceptions.js';
import type { ValidationError } from 'class-validator';

describe('ErrorCode enum', () => {
  it('contains all required error codes', () => {
    const codes = Object.values(ErrorCode);
    expect(codes).toContain('VALIDATION_ERROR');
    expect(codes).toContain('NOT_FOUND');
    expect(codes).toContain('UNAUTHORIZED');
    expect(codes).toContain('FORBIDDEN');
    expect(codes).toContain('CONFLICT');
    expect(codes).toContain('INTERNAL_ERROR');
    expect(codes).toContain('SERVICE_UNAVAILABLE');
    expect(codes).toContain('ANALYSIS_TIMEOUT');
    expect(codes).toContain('RELEASE_EMPTY_CHANGES');
    expect(codes).toContain('POLICY_VIOLATION');
    expect(codes).toContain('RISK_THRESHOLD_EXCEEDED');
  });

  it('all values are UPPER_SNAKE_CASE strings', () => {
    for (const code of Object.values(ErrorCode)) {
      expect(code).toMatch(/^[A-Z_]+$/);
    }
  });
});

describe('formatValidationErrors', () => {
  it('converts ValidationError[] to FieldError[] format', () => {
    const mockErrors: ValidationError[] = [
      {
        property: 'name',
        constraints: { minLength: 'name must be longer than 3 characters' },
        children: [],
      } as ValidationError,
    ];
    const result = formatValidationErrors(mockErrors);
    expect(result).toHaveLength(1);
    expect(result[0]?.field).toBe('name');
    expect(result[0]?.constraint).toBe('minLength');
    expect(result[0]?.message).toBe('name must be longer than 3 characters');
  });

  it('handles nested validation errors with dot-notation field paths', () => {
    const child = new (class extends Error {})() as unknown as ValidationError;
    Object.assign(child, { property: 'city', constraints: { isString: 'city must be a string' }, children: [] });
    const parent = new (class extends Error {})() as unknown as ValidationError;
    Object.assign(parent, { property: 'address', children: [child] });
    const mockErrors: ValidationError[] = [parent];
    const result = formatValidationErrors(mockErrors);
    expect(result[0]?.field).toBe('address.city');
  });

  it('returns empty array for no errors', () => {
    expect(formatValidationErrors([])).toHaveLength(0);
  });
});

describe('buildErrorResponse', () => {
  it('builds a complete error response envelope', () => {
    const res = buildErrorResponse(ErrorCode.NOT_FOUND, 'Release not found', 'corr-123');
    expect(res.error.code).toBe(ErrorCode.NOT_FOUND);
    expect(res.error.message).toBe('Release not found');
    expect(res.error.correlation_id).toBe('corr-123');
    expect(res.error.details).toBeUndefined();
  });

  it('includes details when provided', () => {
    const res = buildErrorResponse(ErrorCode.VALIDATION_ERROR, 'Invalid', 'corr-456', [
      { field: 'name', constraint: 'minLength', message: 'too short' },
    ]);
    expect(res.error.details).toHaveLength(1);
    expect(res.error.details?.[0]?.field).toBe('name');
  });
});

describe('Custom exception classes', () => {
  it('OpseraNotFoundException has status 404 and correct code', () => {
    const ex = new OpseraNotFoundException('Release', 'abc-123', 'corr-789');
    expect(ex.statusCode).toBe(404);
    expect(ex.code).toBe(ErrorCode.NOT_FOUND);
    expect(ex.message).toContain('abc-123');
  });

  it('OpseraForbiddenException has status 403', () => {
    const ex = new OpseraForbiddenException('Access denied to this resource', 'corr-1');
    expect(ex.statusCode).toBe(403);
    expect(ex.code).toBe(ErrorCode.FORBIDDEN);
  });

  it('OpseraValidationException has status 422 with details', () => {
    const ex = new OpseraValidationException('corr-2', [
      { field: 'name', constraint: 'isString', message: 'must be a string' },
    ]);
    expect(ex.statusCode).toBe(422);
    expect(ex.details).toHaveLength(1);
  });

  it('OpseraConflictException has status 409', () => {
    const ex = new OpseraConflictException('Release name already exists', 'corr-3');
    expect(ex.statusCode).toBe(409);
    expect(ex.code).toBe(ErrorCode.CONFLICT);
  });
});
