/**
 * WO-024: Lead time and MTTR DORA calculators
 * WO-038: DORA metrics aggregation with weekly trends
 */
import { Injectable, Logger } from '@nestjs/common';

export interface LeadTimeMetrics {
  avgLeadTimeHours: number;
  p50LeadTimeHours: number;
  p95LeadTimeHours: number;
  sampleSize: number;
}

export interface MttrMetrics {
  avgMttrHours: number;
  p50MttrHours: number;
  incidentCount: number;
}

export interface WeeklyTrendPoint {
  week: string;
  deployments: number;
  failures: number;
  avgLeadTimeHours: number;
}

@Injectable()
export class LeadTimeCalculator {
  private readonly logger = new Logger(LeadTimeCalculator.name);

  calculateLeadTime(events: Array<{ commitTimestamp: Date; deployedAt: Date }>): LeadTimeMetrics {
    if (events.length === 0) {
      return { avgLeadTimeHours: 0, p50LeadTimeHours: 0, p95LeadTimeHours: 0, sampleSize: 0 };
    }

    const hours = events.map((e) =>
      (e.deployedAt.getTime() - e.commitTimestamp.getTime()) / 3_600_000,
    ).sort((a, b) => a - b);

    return {
      avgLeadTimeHours: hours.reduce((s, v) => s + v, 0) / hours.length,
      p50LeadTimeHours: this.percentile(hours, 50),
      p95LeadTimeHours: this.percentile(hours, 95),
      sampleSize: hours.length,
    };
  }

  calculateMttr(incidents: Array<{ detectedAt: Date; resolvedAt: Date }>): MttrMetrics {
    if (incidents.length === 0) {
      return { avgMttrHours: 0, p50MttrHours: 0, incidentCount: 0 };
    }

    const hours = incidents.map((i) =>
      (i.resolvedAt.getTime() - i.detectedAt.getTime()) / 3_600_000,
    ).sort((a, b) => a - b);

    return {
      avgMttrHours: hours.reduce((s, v) => s + v, 0) / hours.length,
      p50MttrHours: this.percentile(hours, 50),
      incidentCount: hours.length,
    };
  }

  buildWeeklyTrends(
    deployments: Array<{ deployedAt: Date; success: boolean; leadTimeHours: number }>,
    weeks = 12,
  ): WeeklyTrendPoint[] {
    const buckets = new Map<string, { count: number; failures: number; leadTimeSum: number }>();

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - i * 7);
      const key = `W${weekStart.getFullYear()}-${String(this.getWeekNumber(weekStart)).padStart(2, '0')}`;
      buckets.set(key, { count: 0, failures: 0, leadTimeSum: 0 });
    }

    for (const d of deployments) {
      const key = `W${d.deployedAt.getFullYear()}-${String(this.getWeekNumber(d.deployedAt)).padStart(2, '0')}`;
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.count++;
        if (!d.success) bucket.failures++;
        bucket.leadTimeSum += d.leadTimeHours;
      }
    }

    return Array.from(buckets.entries()).map(([week, b]) => ({
      week,
      deployments: b.count,
      failures: b.failures,
      avgLeadTimeHours: b.count > 0 ? b.leadTimeSum / b.count : 0,
    }));
  }

  private percentile(sorted: number[], p: number): number {
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
  }

  private getWeekNumber(d: Date): number {
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d.getTime() - startOfYear.getTime()) / 86_400_000 + startOfYear.getDay() + 1) / 7);
  }
}
