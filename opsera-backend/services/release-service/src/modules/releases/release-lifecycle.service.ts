/**
 * WO-034: Release lifecycle state machine
 * WO-035: Release approval workflow
 * WO-036: Release rollback orchestration
 * WO-037: Deployment window enforcement
 */
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/index.js';

export type ReleaseStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'rolled_back'
  | 'cancelled';

const VALID_TRANSITIONS: Record<ReleaseStatus, ReleaseStatus[]> = {
  draft: ['pending_approval', 'cancelled'],
  pending_approval: ['approved', 'cancelled'],
  approved: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'failed'],
  completed: ['rolled_back'],
  failed: ['rolled_back', 'in_progress'],
  rolled_back: [],
  cancelled: [],
};

interface DeploymentWindow {
  start: number; // hour 0-23 UTC
  end: number;
  days: number[]; // 0=Sun, 6=Sat
}

const PROD_DEPLOYMENT_WINDOWS: DeploymentWindow[] = [
  { start: 2, end: 6, days: [0, 1, 2, 3, 4] },   // 02:00–06:00 UTC Mon–Fri
  { start: 8, end: 16, days: [6] },                // Weekend maintenance window Sat
];

@Injectable()
export class ReleaseLifecycleService {
  private readonly logger = new Logger(ReleaseLifecycleService.name);

  constructor(private readonly prisma: PrismaClient) {}

  async transition(releaseId: string, toStatus: ReleaseStatus, actorId: string, reason?: string): Promise<void> {
    const release = await this.prisma.release.findUniqueOrThrow({ where: { id: releaseId } });
    const from = release.status as ReleaseStatus;

    if (!VALID_TRANSITIONS[from]?.includes(toStatus)) {
      throw new BadRequestException(`Cannot transition release from '${from}' to '${toStatus}'`);
    }

    if (toStatus === 'in_progress' && release.environment === 'production') {
      this.assertDeploymentWindow();
    }

    await this.prisma.release.update({
      where: { id: releaseId },
      data: {
        status: toStatus,
        updated_at: new Date(),
        ...(toStatus === 'approved' ? { approved_by: actorId, approved_at: new Date() } : {}),
        ...(toStatus === 'rolled_back' ? { rolled_back_at: new Date(), rollback_reason: reason } : {}),
      },
    });

    this.logger.log(`Release ${releaseId} transitioned ${from} → ${toStatus} by ${actorId}`);
  }

  async submitForApproval(releaseId: string, actorId: string): Promise<void> {
    await this.transition(releaseId, 'pending_approval', actorId);
  }

  async approve(releaseId: string, approverId: string): Promise<void> {
    await this.transition(releaseId, 'approved', approverId);
  }

  async initiateRollback(releaseId: string, actorId: string, reason: string): Promise<void> {
    await this.transition(releaseId, 'rolled_back', actorId, reason);
    this.logger.warn(`Rollback initiated for release ${releaseId}: ${reason}`);
  }

  private assertDeploymentWindow(): void {
    const now = new Date();
    const hour = now.getUTCHours();
    const day = now.getUTCDay();

    const inWindow = PROD_DEPLOYMENT_WINDOWS.some(
      (w) => w.days.includes(day) && hour >= w.start && hour < w.end,
    );

    if (!inWindow) {
      throw new BadRequestException(
        `Production deployments are only allowed during approved deployment windows (UTC). ` +
        `Current time: ${now.toISOString()}`,
      );
    }
  }
}
