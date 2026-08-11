import { createHash } from 'crypto';

/**
 * Computes SHA-256 checksum for an audit record.
 * The hash covers the record content + the previous record's hash,
 * forming a tamper-evident chain (Bitcoin-style blockchain lite).
 */
export function computeChecksum(
  recordContent: string,
  previousChecksum: string,
): string {
  return createHash('sha256')
    .update(recordContent)
    .update(previousChecksum)
    .digest('hex');
}

export interface AuditRecordForChain {
  id: string;
  checksum: string;
  previous_checksum: string;
  // Content fields — all are used in the hash
  event_type: string;
  actor_id: string;
  resource_type: string;
  resource_id: string;
  action: string;
  payload: unknown;
  event_timestamp: Date;
}

/**
 * Verifies the integrity of an entire audit hash chain.
 * Returns true if every record's checksum is correctly derived.
 * Returns false with the first invalid record index on failure.
 */
export function verifyChain(records: AuditRecordForChain[]): {
  valid: boolean;
  invalidAt?: number;
} {
  for (let i = 0; i < records.length; i++) {
    const record = records[i]!;
    const prevHash = i === 0 ? '0'.repeat(64) : records[i - 1]!.checksum;
    const content = JSON.stringify({
      event_type: record.event_type,
      actor_id: record.actor_id,
      resource_type: record.resource_type,
      resource_id: record.resource_id,
      action: record.action,
      payload: record.payload,
      event_timestamp: record.event_timestamp.toISOString(),
    });
    const expected = computeChecksum(content, prevHash);
    if (expected !== record.checksum) {
      return { valid: false, invalidAt: i };
    }
    if (record.previous_checksum !== prevHash) {
      return { valid: false, invalidAt: i };
    }
  }
  return { valid: true };
}
