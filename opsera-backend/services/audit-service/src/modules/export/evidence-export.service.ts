/**
 * WO-058: Tamper-Evident Evidence Export with MinIO Packaging
 * Async export job — complete within 30s for 10,000 records.
 */
import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { createHash } from 'crypto';

export interface ExportFilter {
  release_id?: string;
  start_date: string;
  end_date: string;
  compliance_frameworks?: string[];
}

export interface ExportJob {
  exportId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedBy: string;
  requestedAt: string;
  filters: ExportFilter;
  signedUrl?: string;
  errorReason?: string;
}

const activeJobs = new Map<string, ExportJob>();

@Injectable()
export class EvidenceExportService {
  private readonly logger = new Logger(EvidenceExportService.name);

  async createExportJob(
    filter: ExportFilter,
    requestedBy: string,
    userRoles: string[],
  ): Promise<string> {
    const allowedRoles = ['Auditor', 'Leadership', 'Admin'];
    if (!userRoles.some((r) => allowedRoles.includes(r))) {
      throw new ForbiddenException(
        'You do not have permission to export audit data. Required role: Auditor or Leadership',
      );
    }

    const exportId = crypto.randomUUID();
    const job: ExportJob = {
      exportId,
      status: 'pending',
      requestedBy,
      requestedAt: new Date().toISOString(),
      filters: filter,
    };
    activeJobs.set(exportId, job);

    // Process asynchronously
    setImmediate(() => void this.processExport(exportId));
    return exportId;
  }

  getJob(exportId: string): ExportJob | undefined {
    return activeJobs.get(exportId);
  }

  private async processExport(exportId: string): Promise<void> {
    const job = activeJobs.get(exportId);
    if (!job) return;

    job.status = 'processing';
    const startMs = Date.now();

    try {
      // In production: stream records from DB, compute manifest, upload to MinIO
      const mockRecords = this.generateMockRecords(job.filters);
      const manifest = this.computeManifest(mockRecords);

      const exportPayload = JSON.stringify({
        metadata: {
          export_id: exportId,
          requested_by: job.requestedBy,
          requested_at: job.requestedAt,
          filters_applied: job.filters,
          total_records: mockRecords.length,
          generated_at: new Date().toISOString(),
        },
        records: mockRecords,
        manifest,
      });

      // In production: upload to MinIO with SSE-S3; generate signed URL
      const durationMs = Date.now() - startMs;
      this.logger.log(`Export ${exportId} completed: ${mockRecords.length} records in ${durationMs}ms`);

      job.status = 'completed';
      // Stub signed URL — in production this comes from MinIO presign
      job.signedUrl = `https://minio.opsera.internal/audit-exports/${exportId}/export.json.gz?token=PRESIGNED&ttl=3600`;
      void exportPayload;
    } catch (err) {
      job.status = 'failed';
      job.errorReason = (err as Error).message;
      this.logger.error(`Export ${exportId} failed: ${(err as Error).message}`);
    }
  }

  private computeManifest(records: unknown[]): { sha256: string; record_count: number; timestamp: string } {
    const content = JSON.stringify(records);
    return {
      sha256: createHash('sha256').update(content).digest('hex'),
      record_count: records.length,
      timestamp: new Date().toISOString(),
    };
  }

  private generateMockRecords(filter: ExportFilter): unknown[] {
    // Stub — in production query partitioned audit.records table with streaming cursor
    return Array.from({ length: 10 }, (_, i) => ({
      id: crypto.randomUUID(),
      event_type: 'release.deployed',
      actor_id: crypto.randomUUID(),
      resource_type: 'release',
      resource_id: filter.release_id ?? crypto.randomUUID(),
      action: 'deploy',
      event_timestamp: new Date(
        new Date(filter.start_date).getTime() + i * 3600 * 1000,
      ).toISOString(),
      compliance_frameworks: filter.compliance_frameworks ?? ['SOX'],
    }));
  }
}
