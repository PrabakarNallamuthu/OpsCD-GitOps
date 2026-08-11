import { randomUUID, createHash } from 'crypto';

const GENESIS_HASH = '0'.repeat(64);

export interface AuditRecordFactory {
  id: string;
  event_type: string;
  actor_id: string;
  resource_type: string;
  resource_id: string;
  action: string;
  payload: Record<string, unknown>;
  checksum: string;
  previous_checksum: string;
  correlation_id: string;
  event_timestamp: Date;
}

function computeChecksum(record: Omit<AuditRecordFactory, 'checksum' | 'previous_checksum'>, prevHash: string): string {
  const content = JSON.stringify({
    event_type: record.event_type,
    actor_id: record.actor_id,
    resource_type: record.resource_type,
    resource_id: record.resource_id,
    action: record.action,
    payload: record.payload,
    event_timestamp: record.event_timestamp.toISOString(),
  });
  return createHash('sha256').update(content).update(prevHash).digest('hex');
}

export function buildAuditRecord(
  prevHash = GENESIS_HASH,
  overrides: Partial<Omit<AuditRecordFactory, 'checksum' | 'previous_checksum'>> = {},
): AuditRecordFactory {
  const base = {
    id: randomUUID(),
    event_type: 'RELEASE_CREATED',
    actor_id: randomUUID(),
    resource_type: 'Release',
    resource_id: randomUUID(),
    action: 'CREATE',
    payload: { status: 'Draft' },
    correlation_id: randomUUID(),
    event_timestamp: new Date(),
    ...overrides,
  };
  return {
    ...base,
    checksum: computeChecksum(base, prevHash),
    previous_checksum: prevHash,
  };
}

/**
 * Builds an ordered chain of audit records with valid hash linkage.
 */
export function buildAuditChain(
  count: number,
  overrides: Partial<Omit<AuditRecordFactory, 'checksum' | 'previous_checksum'>> = {},
): AuditRecordFactory[] {
  const chain: AuditRecordFactory[] = [];
  let prevHash = GENESIS_HASH;
  for (let i = 0; i < count; i++) {
    const record = buildAuditRecord(prevHash, {
      ...overrides,
      event_timestamp: new Date(Date.now() + i * 1000),
    });
    chain.push(record);
    prevHash = record.checksum;
  }
  return chain;
}
