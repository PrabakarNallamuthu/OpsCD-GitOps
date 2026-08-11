import { computeChecksum, verifyChain, type AuditRecordForChain } from '../src/checksum.util.js';
import { createHash } from 'crypto';

const GENESIS_HASH = '0'.repeat(64);

function buildRecord(
  overrides: Partial<AuditRecordForChain> = {},
  prevHash = GENESIS_HASH,
): AuditRecordForChain {
  const base = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    event_type: 'RELEASE_CREATED',
    actor_id: 'actor-uuid-1',
    resource_type: 'Release',
    resource_id: 'resource-uuid-1',
    action: 'CREATE',
    payload: { name: 'v1.0' },
    event_timestamp: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
  const content = JSON.stringify({
    event_type: base.event_type,
    actor_id: base.actor_id,
    resource_type: base.resource_type,
    resource_id: base.resource_id,
    action: base.action,
    payload: base.payload,
    event_timestamp: base.event_timestamp.toISOString(),
  });
  return {
    ...base,
    checksum: computeChecksum(content, prevHash),
    previous_checksum: prevHash,
  };
}

describe('computeChecksum', () => {
  it('produces a 64-character hex string', () => {
    const result = computeChecksum('content', GENESIS_HASH);
    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[0-9a-f]+$/);
  });

  it('produces deterministic output for the same inputs', () => {
    const a = computeChecksum('hello', 'prev');
    const b = computeChecksum('hello', 'prev');
    expect(a).toBe(b);
  });

  it('produces different output when content changes', () => {
    const a = computeChecksum('hello', 'prev');
    const b = computeChecksum('world', 'prev');
    expect(a).not.toBe(b);
  });

  it('matches manual SHA-256 computation', () => {
    const content = 'test-content';
    const prev = 'prev-hash';
    const expected = createHash('sha256').update(content).update(prev).digest('hex');
    expect(computeChecksum(content, prev)).toBe(expected);
  });
});

describe('verifyChain', () => {
  it('returns valid for an empty chain', () => {
    expect(verifyChain([])).toEqual({ valid: true });
  });

  it('returns valid for a single correctly-hashed record', () => {
    const r = buildRecord();
    expect(verifyChain([r])).toEqual({ valid: true });
  });

  it('returns valid for a multi-record chain', () => {
    const r1 = buildRecord({ id: 'id-1' }, GENESIS_HASH);
    const r2 = buildRecord({ id: 'id-2', event_type: 'RELEASE_UPDATED' }, r1.checksum);
    const r3 = buildRecord({ id: 'id-3', event_type: 'RELEASE_APPROVED' }, r2.checksum);
    expect(verifyChain([r1, r2, r3])).toEqual({ valid: true });
  });

  it('detects tampered record content', () => {
    const r1 = buildRecord({ id: 'id-1' });
    const r2 = buildRecord({ id: 'id-2' }, r1.checksum);
    const tampered = { ...r2, payload: { tampered: true } };
    expect(verifyChain([r1, tampered])).toEqual({ valid: false, invalidAt: 1 });
  });

  it('detects wrong previous_checksum', () => {
    const r1 = buildRecord({ id: 'id-1' });
    const r2 = buildRecord({ id: 'id-2' }, r1.checksum);
    const tampered = { ...r2, previous_checksum: 'wrong-hash' };
    expect(verifyChain([r1, tampered])).toEqual({ valid: false, invalidAt: 1 });
  });
});
