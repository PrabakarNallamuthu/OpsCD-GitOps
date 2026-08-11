import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient, DoraEventType, PeriodType, Prisma } from '../../../generated/prisma/index.js';

export interface DeploymentEvent {
  teamId: string;
  serviceId: string;
  orgId: string;
  releaseId?: string;
  commitSha?: string;
  deployedAt: Date;
  isSuccessful: boolean;
  leadTimeSecs?: number;
}

export interface IncidentEvent {
  teamId: string;
  serviceId: string;
  orgId: string;
  incidentId: string;
  openedAt: Date;
  resolvedAt?: Date;
  isFailureRelated: boolean;
}

@Injectable()
export class DoraMetricsCalculator {
  private readonly logger = new Logger(DoraMetricsCalculator.name);

  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Record a deployment event and trigger metric computation.
   */
  async onDeploymentEvent(event: DeploymentEvent): Promise<void> {
    const idempotencyId = `deploy:${event.releaseId ?? event.commitSha ?? Date.now()}`;

    // Idempotent insert: skip if already processed
    try {
      await this.prisma.doraEvent.create({
        data: {
          id: this.deterministicUuid(idempotencyId),
          event_type: DoraEventType.Deployment,
          service_id: event.serviceId,
          team_id: event.teamId,
          org_id: event.orgId,
          release_id: event.releaseId,
          commit_sha: event.commitSha,
          lead_time_secs: event.leadTimeSecs,
          payload: event as unknown as Prisma.JsonObject,
          event_timestamp: event.deployedAt,
        },
      });
    } catch (err) {
      if ((err as { code?: string }).code === 'P2002') {
        this.logger.debug(`Idempotent skip: ${idempotencyId}`);
        return;
      }
      throw err;
    }

    await this.computeDeploymentFrequency(event.teamId, event.serviceId, event.orgId, event.deployedAt);
  }

  /**
   * Compute Deployment Frequency: deployments per day for a team/service.
   */
  async computeDeploymentFrequency(teamId: string, serviceId: string, orgId: string, forDate: Date): Promise<void> {
    const periodDate = this.getMonthStart(forDate);

    const deployCount = await this.prisma.doraEvent.count({
      where: {
        team_id: teamId,
        service_id: serviceId,
        event_type: DoraEventType.Deployment,
        event_timestamp: {
          gte: periodDate,
          lt: this.addMonths(periodDate, 1),
        },
      },
    });

    const daysInMonth = this.daysInMonth(periodDate);
    const frequency = new Prisma.Decimal(deployCount / daysInMonth);

    await this.prisma.deliveryMetric.upsert({
      where: {
        team_id_service_id_period_type_period_date: {
          team_id: teamId,
          service_id: serviceId,
          period_type: PeriodType.Monthly,
          period_date: periodDate,
        },
      },
      create: {
        team_id: teamId,
        service_id: serviceId,
        period_type: PeriodType.Monthly,
        period_date: periodDate,
        deployment_count: deployCount,
        deployment_frequency: frequency,
      },
      update: {
        deployment_count: deployCount,
        deployment_frequency: frequency,
        computed_at: new Date(),
      },
    });

    this.logger.log(`Deployment frequency updated: ${teamId}/${serviceId} — ${frequency} deploys/day`);
  }

  /**
   * Compute Change Failure Rate from verification events.
   */
  async computeChangeFailureRate(teamId: string, serviceId: string, forDate: Date): Promise<void> {
    const periodDate = this.getMonthStart(forDate);
    const periodEnd = this.addMonths(periodDate, 1);

    const [totalDeployments, failedVerifications] = await Promise.all([
      this.prisma.doraEvent.count({
        where: {
          team_id: teamId,
          service_id: serviceId,
          event_type: DoraEventType.Deployment,
          event_timestamp: { gte: periodDate, lt: periodEnd },
        },
      }),
      this.prisma.doraEvent.count({
        where: {
          team_id: teamId,
          service_id: serviceId,
          event_type: DoraEventType.Deployment,
          event_timestamp: { gte: periodDate, lt: periodEnd },
          payload: { path: ['isSuccessful'], equals: false },
        },
      }),
    ]);

    const cfr = totalDeployments > 0
      ? new Prisma.Decimal(failedVerifications / totalDeployments)
      : new Prisma.Decimal(0);

    await this.prisma.deliveryMetric.upsert({
      where: {
        team_id_service_id_period_type_period_date: {
          team_id: teamId,
          service_id: serviceId,
          period_type: PeriodType.Monthly,
          period_date: periodDate,
        },
      },
      create: {
        team_id: teamId,
        service_id: serviceId,
        period_type: PeriodType.Monthly,
        period_date: periodDate,
        deployment_count: totalDeployments,
        deployment_frequency: new Prisma.Decimal(0),
        change_failure_rate: cfr,
      },
      update: { change_failure_rate: cfr, computed_at: new Date() },
    });
  }

  private getMonthStart(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  }

  private addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    d.setUTCMonth(d.getUTCMonth() + months);
    return d;
  }

  private daysInMonth(date: Date): number {
    return new Date(date.getUTCFullYear(), date.getUTCMonth() + 1, 0).getDate();
  }

  private deterministicUuid(seed: string): string {
    // Deterministic UUID v5-like from seed (simplified for idempotency)
    const hash = Buffer.from(seed).toString('hex').padEnd(32, '0').slice(0, 32);
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
  }
}
