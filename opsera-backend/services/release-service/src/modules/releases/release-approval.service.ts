/**
 * WO-035: Release approval workflow with multi-approver, SOX 4-eyes enforcement
 */
import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/index.js';

const REQUIRED_APPROVERS: Record<string, number> = {
  production: 2,   // SOX 4-eyes: 2 distinct approvers required
  staging: 1,
  development: 0,  // Auto-approved
};

@Injectable()
export class ReleaseApprovalService {
  private readonly logger = new Logger(ReleaseApprovalService.name);

  constructor(private readonly prisma: PrismaClient) {}

  async requestApproval(releaseId: string, requesterId: string): Promise<void> {
    const release = await this.prisma.release.findUniqueOrThrow({ where: { id: releaseId } });

    if (release.status !== 'draft') {
      throw new BadRequestException(`Release must be in 'draft' to request approval`);
    }

    await this.prisma.release.update({
      where: { id: releaseId },
      data: { status: 'pending_approval', updated_at: new Date() },
    });

    this.logger.log(`Approval requested for release ${releaseId} by ${requesterId}`);
  }

  async approve(releaseId: string, approverId: string): Promise<{ approved: boolean; approversCount: number; required: number }> {
    const release = await this.prisma.release.findUniqueOrThrow({ where: { id: releaseId } });

    if (release.status !== 'pending_approval') {
      throw new BadRequestException(`Release is not awaiting approval`);
    }

    const existingApprovals = await this.prisma.releaseApproval.findMany({
      where: { release_id: releaseId },
    });

    if (existingApprovals.some((a) => a.approver_id === approverId)) {
      throw new ForbiddenException(`Approver ${approverId} has already approved this release`);
    }

    if (release.created_by === approverId) {
      throw new ForbiddenException(`Release creator cannot approve their own release (SOX 4-eyes)`);
    }

    await this.prisma.releaseApproval.create({
      data: {
        release_id: releaseId,
        approver_id: approverId,
        approved_at: new Date(),
      },
    });

    const totalApprovals = existingApprovals.length + 1;
    const required = REQUIRED_APPROVERS[release.environment] ?? 1;
    const isFullyApproved = totalApprovals >= required;

    if (isFullyApproved) {
      await this.prisma.release.update({
        where: { id: releaseId },
        data: { status: 'approved', approved_by: approverId, approved_at: new Date() },
      });
      this.logger.log(`Release ${releaseId} fully approved (${totalApprovals}/${required})`);
    }

    return { approved: isFullyApproved, approversCount: totalApprovals, required };
  }

  async reject(releaseId: string, reviewerId: string, reason: string): Promise<void> {
    await this.prisma.release.update({
      where: { id: releaseId },
      data: { status: 'cancelled', updated_at: new Date() },
    });
    this.logger.warn(`Release ${releaseId} rejected by ${reviewerId}: ${reason}`);
  }
}
