/**
 * WO-041: Risk aggregation and trend analysis
 * WO-043: Risk threshold alerting
 */
import { Injectable, Logger } from '@nestjs/common';

export interface RiskTrendPoint {
  date: string;
  avgRiskScore: number;
  totalReleases: number;
  blockedReleases: number;
  highRiskCount: number;
}

export interface RiskThresholdAlert {
  alertId: string;
  severity: 'warning' | 'critical';
  message: string;
  triggeredAt: string;
  currentScore: number;
  threshold: number;
}

const ALERT_THRESHOLDS = {
  warning: 65,
  critical: 85,
};

@Injectable()
export class RiskTrendService {
  private readonly logger = new Logger(RiskTrendService.name);
  private readonly scoreHistory: Array<{ date: string; score: number; releaseId: string }> = [];

  recordScore(releaseId: string, score: number): void {
    this.scoreHistory.push({
      date: new Date().toISOString().split('T')[0],
      score,
      releaseId,
    });
  }

  getTrends(days = 30): RiskTrendPoint[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const byDate = new Map<string, number[]>();
    for (const entry of this.scoreHistory) {
      if (new Date(entry.date) >= cutoff) {
        const scores = byDate.get(entry.date) ?? [];
        scores.push(entry.score);
        byDate.set(entry.date, scores);
      }
    }

    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, scores]) => ({
        date,
        avgRiskScore: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
        totalReleases: scores.length,
        blockedReleases: scores.filter((s) => s >= 90).length,
        highRiskCount: scores.filter((s) => s >= ALERT_THRESHOLDS.warning).length,
      }));
  }

  checkThresholds(currentScore: number, releaseId: string): RiskThresholdAlert[] {
    const alerts: RiskThresholdAlert[] = [];

    if (currentScore >= ALERT_THRESHOLDS.critical) {
      alerts.push({
        alertId: crypto.randomUUID(),
        severity: 'critical',
        message: `Release ${releaseId} risk score ${currentScore} exceeds critical threshold (${ALERT_THRESHOLDS.critical})`,
        triggeredAt: new Date().toISOString(),
        currentScore,
        threshold: ALERT_THRESHOLDS.critical,
      });
      this.logger.error(`CRITICAL risk threshold exceeded for release ${releaseId}: ${currentScore}`);
    } else if (currentScore >= ALERT_THRESHOLDS.warning) {
      alerts.push({
        alertId: crypto.randomUUID(),
        severity: 'warning',
        message: `Release ${releaseId} risk score ${currentScore} exceeds warning threshold (${ALERT_THRESHOLDS.warning})`,
        triggeredAt: new Date().toISOString(),
        currentScore,
        threshold: ALERT_THRESHOLDS.warning,
      });
      this.logger.warn(`Warning risk threshold exceeded for release ${releaseId}: ${currentScore}`);
    }

    return alerts;
  }
}
