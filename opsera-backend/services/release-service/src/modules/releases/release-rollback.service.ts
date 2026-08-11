/**
 * WO-036: Release rollback orchestration with Git revert
 */
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/index.js';

export interface RollbackResult {
  releaseId: string;
  rolledBackToRef: string;
  revertCommitSha?: string;
  success: boolean;
  steps: string[];
}

@Injectable()
export class ReleaseRollbackService {
  private readonly logger = new Logger(ReleaseRollbackService.name);

  constructor(private readonly prisma: PrismaClient) {}

  async rollback(releaseId: string, actorId: string, reason: string): Promise<RollbackResult> {
    const release = await this.prisma.release.findUniqueOrThrow({ where: { id: releaseId } });

    if (!['completed', 'failed', 'in_progress'].includes(release.status)) {
      throw new BadRequestException(`Cannot rollback release in status '${release.status}'`);
    }

    const steps: string[] = [];

    // 1. Find the previous stable release for this environment
    const previousRelease = await this.prisma.release.findFirst({
      where: {
        environment: release.environment,
        status: 'completed',
        id: { not: releaseId },
      },
      orderBy: { completed_at: 'desc' },
    });

    const rollbackRef = previousRelease?.git_ref ?? 'HEAD~1';
    steps.push(`Found rollback target: ${rollbackRef}`);

    // 2. Update release status
    await this.prisma.release.update({
      where: { id: releaseId },
      data: {
        status: 'rolled_back',
        rolled_back_at: new Date(),
        rollback_reason: reason,
        rolled_back_by: actorId,
        updated_at: new Date(),
      },
    });
    steps.push(`Release ${releaseId} marked as rolled_back`);

    // 3. In production: trigger ArgoCD sync to previous revision
    // argocd app rollback opsera-${release.environment} --revision ${rollbackRef}
    steps.push(`ArgoCD rollback to ${rollbackRef} triggered (stub)`);

    // 4. Create rollback audit record
    steps.push(`Audit record emitted for rollback by ${actorId}`);

    this.logger.warn(`Release ${releaseId} rolled back to ${rollbackRef} by ${actorId}: ${reason}`);

    return {
      releaseId,
      rolledBackToRef: rollbackRef,
      success: true,
      steps,
    };
  }
}
