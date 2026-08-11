import { asUUID, asISO8601, nowISO, ok, err, isOk, isErr } from '../src/types/common.types.js';
import { PaginationRequest, buildPaginationResponse } from '../src/types/pagination.types.js';
import { SortDirection, FilterOperator } from '../src/types/sort-filter.types.js';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

describe('common types', () => {
  it('asUUID casts a string to UUID brand', () => {
    const id = asUUID('550e8400-e29b-41d4-a716-446655440000');
    expect(typeof id).toBe('string');
    expect(id).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('nowISO returns a valid ISO 8601 UTC string', () => {
    const ts = nowISO();
    expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('asISO8601 casts a string to ISO8601Timestamp brand', () => {
    const ts = asISO8601('2026-08-11T08:00:00.000Z');
    expect(ts).toBe('2026-08-11T08:00:00.000Z');
  });

  it('ok() / isOk() / isErr() — success result', () => {
    const r = ok(42);
    expect(isOk(r)).toBe(true);
    expect(isErr(r)).toBe(false);
    if (isOk(r)) expect(r.value).toBe(42);
  });

  it('err() / isErr() — failure result', () => {
    const r = err(new Error('boom'));
    expect(isErr(r)).toBe(true);
    expect(isOk(r)).toBe(false);
    if (isErr(r)) expect(r.error.message).toBe('boom');
  });
});

describe('PaginationRequest DTO', () => {
  it('valid: cursor + limit within bounds passes validation', async () => {
    const dto = plainToInstance(PaginationRequest, { cursor: 'eyJpZCI6IjEifQ==', limit: 25 });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('valid: omitting cursor and limit is allowed (both optional)', async () => {
    const dto = plainToInstance(PaginationRequest, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('invalid: limit above 100 fails validation', async () => {
    const dto = plainToInstance(PaginationRequest, { limit: 101 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'limit')).toBe(true);
  });

  it('invalid: limit below 1 fails validation', async () => {
    const dto = plainToInstance(PaginationRequest, { limit: 0 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'limit')).toBe(true);
  });

  it('buildPaginationResponse correctly sets hasMore', () => {
    const res = buildPaginationResponse(['a', 'b'], 'next-cursor-token');
    expect(res.hasMore).toBe(true);
    expect(res.nextCursor).toBe('next-cursor-token');
    expect(res.items).toHaveLength(2);
  });

  it('buildPaginationResponse hasMore=false when nextCursor is null', () => {
    const res = buildPaginationResponse([], null);
    expect(res.hasMore).toBe(false);
  });
});

describe('SortDirection and FilterOperator enums', () => {
  it('SortDirection has ASC and DESC', () => {
    expect(SortDirection.ASC).toBe('ASC');
    expect(SortDirection.DESC).toBe('DESC');
    expect(Object.values(SortDirection)).toHaveLength(2);
  });

  it('FilterOperator has all 8 operators', () => {
    const ops = Object.values(FilterOperator);
    expect(ops).toContain('EQ');
    expect(ops).toContain('NEQ');
    expect(ops).toContain('GT');
    expect(ops).toContain('GTE');
    expect(ops).toContain('LT');
    expect(ops).toContain('LTE');
    expect(ops).toContain('IN');
    expect(ops).toContain('CONTAINS');
    expect(ops).toHaveLength(8);
  });
});
