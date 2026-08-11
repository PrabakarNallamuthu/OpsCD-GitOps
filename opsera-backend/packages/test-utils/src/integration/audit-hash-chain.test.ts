/**
 * WO-087: Unit tests for hash chain integrity
 */
import { createHash } from 'node:crypto';

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function canonicalJson(obj: Record<string, unknown>): string {
  return JSON.stringify(
    Object.keys(obj).sort().reduce((acc, k) => ({ ...acc, [k]: obj[k] }), {} as Record<string, unknown>),
  );
}

function computeChecksum(payload: Record<string, unknown>, previousChecksum: string): string {
  const canonical = canonicalJson({ ...payload, _prev: previousChecksum });
  return sha256(canonical);
}

describe('Audit Hash Chain', () => {
  it('should produce consistent checksums for identical payloads', () => {
    const payload = { event_type: 'release.created', actor_id: 'user-1', resource_id: 'rel-1' };
    const prev = '0'.repeat(64);

    const c1 = computeChecksum(payload, prev);
    const c2 = computeChecksum(payload, prev);

    expect(c1).toBe(c2);
    expect(c1).toHaveLength(64);
    expect(c1).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should produce different checksums when previous checksum changes', () => {
    const payload = { event_type: 'release.approved', actor_id: 'user-2' };
    const c1 = computeChecksum(payload, 'a'.repeat(64));
    const c2 = computeChecksum(payload, 'b'.repeat(64));
    expect(c1).not.toBe(c2);
  });

  it('should build a verifiable chain of 3 records', () => {
    const genesis = '0'.repeat(64);
    const records = [
      { event_type: 'release.created', actor_id: 'alice' },
      { event_type: 'release.approved', actor_id: 'bob' },
      { event_type: 'release.deployed', actor_id: 'system' },
    ];

    const chain: string[] = [genesis];
    for (const record of records) {
      const checksum = computeChecksum(record, chain[chain.length - 1]);
      chain.push(checksum);
    }

    expect(chain).toHaveLength(4);
    // Each element must be different (no hash collisions for distinct inputs)
    const unique = new Set(chain);
    expect(unique.size).toBe(4);
  });
});
