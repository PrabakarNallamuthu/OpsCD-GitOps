import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/index.js';
import { computeChecksum } from '@opsera/prisma-config';

export interface CreateAuditRecordDto {
  event_type: string;
  actor_id: string;
  resource_type: string;
  resource_id: string;
  action: string;
  payload: Record<string, unknown>;
  correlation_id: string;
  compliance_frameworks?: string[];
  pii_key_version?: string;
  event_timestamp?: Date;
}

/**
 * AuditRecord repository — intentionally exposes only INSERT and SELECT operations.
 * No update or delete methods exist by design (SOX immutability requirement).
 * RLS policies enforce this at the database level as a defense-in-depth control.
 */
@Injectable()
export class AuditRecordRepository {
  private readonly logger = new Logger(AuditRecordRepository.name);
  private previousChecksum = '0'.repeat(64); // genesis hash

  constructor(private readonly prisma: PrismaClient) {}

  async create(dto: CreateAuditRecordDto): Promise<string> {
    const recordContent = JSON.stringify({
      event_type: dto.event_type,
      actor_id: dto.actor_id,
      action: dto.action,
      resource_type: dto.resource_type,
      resource_id: dto.resource_id,
      event_timestamp: dto.event_timestamp ?? new Date(),
    });

    const checksum = computeChecksum(recordContent, this.previousChecksum);
    this.previousChecksum = checksum;

    const record = await this.prisma.auditRecord.create({
      data: {
        event_type: dto.event_type,
        actor_id: dto.actor_id,
        resource_type: dto.resource_type,
        resource_id: dto.resource_id,
        action: dto.action,
        payload: dto.payload,
        checksum,
        previous_checksum: checksum === '0'.repeat(64) ? '0'.repeat(64) : this.previousChecksum,
        correlation_id: dto.correlation_id,
        compliance_frameworks: dto.compliance_frameworks ?? [],
        pii_key_version: dto.pii_key_version,
        event_timestamp: dto.event_timestamp ?? new Date(),
      },
      select: { id: true },
    });

    return record.id;
  }

  async findMany(opts: {
    actor_id?: string;
    resource_type?: string;
    resource_id?: string;
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ records: unknown[]; total: number }> {
    const { page = 1, limit = 50 } = opts;
    const where = {
      ...(opts.actor_id && { actor_id: opts.actor_id }),
      ...(opts.resource_type && { resource_type: opts.resource_type }),
      ...(opts.resource_id && { resource_id: opts.resource_id }),
      ...(opts.fromDate && { event_timestamp: { gte: opts.fromDate } }),
      ...(opts.toDate && { event_timestamp: { lte: opts.toDate } }),
    };

    const [records, total] = await Promise.all([
      this.prisma.auditRecord.findMany({
        where,
        orderBy: { event_timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditRecord.count({ where }),
    ]);

    return { records, total };
  }

  async findOne(id: string): Promise<unknown> {
    return this.prisma.auditRecord.findUniqueOrThrow({ where: { id } });
  }

  async count(where: Record<string, unknown> = {}): Promise<number> {
    return this.prisma.auditRecord.count({ where: where as Parameters<typeof this.prisma.auditRecord.count>[0]['where'] });
  }
}
