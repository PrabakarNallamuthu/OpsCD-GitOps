/**
 * WO-057: SHA-256 Hash Chain Generator for Audit Tamper Detection
 * Partition-scoped chain: each monthly partition has its own chain.
 * Advisory lock ensures sequential integrity under concurrent writers.
 */
import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaClient } from '../../generated/prisma/index.js';

export const GENESIS_CHECKSUM = createHash('sha256')
  .update('OPSERA_AUDIT_CHAIN_GENESIS')
  .digest('hex');

export interface AuditRecordContent {
  action: string;
  resource_type: string;
  resource_id: string;
  actor_id: string;
  event_timestamp: string;
  payload: Record<string, unknown>;
  compliance_frameworks: string[];
}

export interface ChainVerificationResult {
  valid: boolean;
  totalChecked: number;
  brokenLinks: Array<{ id: string; position: number; reason: string }>;
}

@Injectable()
export class HashChainService {
  private readonly logger = new Logger(HashChainService.name);

  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Compute SHA-256 checksum over canonical JSON of record content + previous checksum.
   */
  computeChecksum(content: AuditRecordContent, prevChecksum: string): string {
    const canonical = this.canonicalize({ ...content, prev_checksum: prevChecksum });
    return createHash('sha256').update(canonical).digest('hex');
  }

  /**
   * Get the previous record's checksum for chain linking.
   * Uses partition-scoped lookup with advisory lock to prevent races.
   */
  async getPreviousChecksumWithLock(partitionDate: Date): Promise<string> {
    const partitionKey = this.getPartitionKey(partitionDate);
    const lockId = this.hashToInt(partitionKey);

    // Acquire advisory lock for this partition (released at transaction end)
    await this.prisma.$executeRaw`SELECT pg_advisory_xact_lock(${lockId}::bigint)`;

    // Find last record in this partition's month
    const monthStart = new Date(partitionDate.getFullYear(), partitionDate.getMonth(), 1);
    const monthEnd = new Date(partitionDate.getFullYear(), partitionDate.getMonth() + 1, 1);

    const lastRecord = await this.prisma.auditRecord.findFirst({
      where: {
        event_timestamp: {
          gte: monthStart,
          lt: monthEnd,
        },
      },
      orderBy: { event_timestamp: 'desc' },
      select: { checksum: true },
    });

    if (lastRecord) return lastRecord.checksum;

    // Check previous month's last record
    const prevMonthEnd = monthStart;
    const prevMonthStart = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1);

    const prevMonthLast = await this.prisma.auditRecord.findFirst({
      where: {
        event_timestamp: {
          gte: prevMonthStart,
          lt: prevMonthEnd,
        },
      },
      orderBy: { event_timestamp: 'desc' },
      select: { checksum: true },
    });

    return prevMonthLast?.checksum ?? GENESIS_CHECKSUM;
  }

  /**
   * Verify hash chain integrity for a given date range.
   * Processes records in batches to handle large chains without OOM.
   */
  async verifyChain(startDate: Date, endDate: Date): Promise<ChainVerificationResult> {
    const brokenLinks: ChainVerificationResult['brokenLinks'] = [];
    let cursor: string | undefined;
    let totalChecked = 0;
    let prevChecksum = GENESIS_CHECKSUM;

    while (true) {
      const records = await this.prisma.auditRecord.findMany({
        where: {
          event_timestamp: { gte: startDate, lte: endDate },
          ...(cursor && { id: { gt: cursor } }),
        },
        orderBy: [{ event_timestamp: 'asc' }, { id: 'asc' }],
        take: 1000,
        select: {
          id: true,
          action: true,
          resource_type: true,
          resource_id: true,
          actor_id: true,
          event_timestamp: true,
          payload: true,
          compliance_frameworks: true,
          checksum: true,
          previous_checksum: true,
        },
      });

      if (records.length === 0) break;

      for (const record of records) {
        const content: AuditRecordContent = {
          action: record.action,
          resource_type: record.resource_type,
          resource_id: record.resource_id,
          actor_id: record.actor_id,
          event_timestamp: record.event_timestamp.toISOString(),
          payload: record.payload as Record<string, unknown>,
          compliance_frameworks: record.compliance_frameworks as string[],
        };

        const expectedChecksum = this.computeChecksum(content, prevChecksum);
        if (expectedChecksum !== record.checksum) {
          brokenLinks.push({
            id: record.id,
            position: totalChecked,
            reason: `Checksum mismatch: expected ${expectedChecksum}, stored ${record.checksum}`,
          });
        }
        prevChecksum = record.checksum;
        totalChecked++;
        cursor = record.id;
      }

      if (records.length < 1000) break;
    }

    return { valid: brokenLinks.length === 0, totalChecked, brokenLinks };
  }

  private canonicalize(obj: unknown): string {
    if (obj === null) return 'null';
    if (typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) return `[${obj.map((v) => this.canonicalize(v)).join(',')}]`;

    const sorted = Object.keys(obj as object)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${this.canonicalize((obj as Record<string, unknown>)[k])}`)
      .join(',');
    return `{${sorted}}`;
  }

  private getPartitionKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private hashToInt(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }
}
