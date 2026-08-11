/**
 * WO-100: Anomaly Detection Engine and Verification Verdict Issuance
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient, AnomalySeverity, VerificationVerdict } from '../../../generated/prisma/index.js';
import type { ComparisonResult } from '../baseline/baseline.service.js';

export interface AnomalyResult {
  metricName: string;
  severity: AnomalySeverity;
  description: string;
  zScore: number;
  expectedRange: { min: number; max: number; mean: number; stddev: number };
  detectedValue: number;
}

export interface VerdictResult {
  verdict: VerificationVerdict;
  rollbackRecommended: boolean;
  reason: string;
  anomalyCount: { critical: number; high: number; medium: number; low: number };
}

const Z_SCORE_THRESHOLDS = {
  [AnomalySeverity.Critical]: 4.0,
  [AnomalySeverity.Warning]: 3.0, // reused as HIGH boundary
  [AnomalySeverity.Info]: 2.0,    // reused as MEDIUM/LOW boundary
};

function computeZScore(observed: number, mean: number, stddev: number): number {
  const safeStddev = Math.max(stddev, 0.001);
  return Math.abs((observed - mean) / safeStddev);
}

function classifySeverity(zScore: number): AnomalySeverity {
  if (zScore >= 4.0) return AnomalySeverity.Critical;
  if (zScore >= 3.0) return AnomalySeverity.Warning;
  return AnomalySeverity.Info;
}

@Injectable()
export class AnomalyDetectorService {
  private readonly logger = new Logger(AnomalyDetectorService.name);

  constructor(private readonly prisma: PrismaClient) {}

  detectAnomalies(
    comparisons: ComparisonResult[],
    baselineStats: Record<string, { mean: number; stddev: number }>,
  ): AnomalyResult[] {
    const anomalies: AnomalyResult[] = [];

    for (const comparison of comparisons) {
      if (comparison.status !== 'exceeded') continue;

      const stats = baselineStats[comparison.metricName] ?? {
        mean: comparison.baselineValue,
        stddev: Math.abs(comparison.baselineValue) * 0.1 || 1,
      };

      const zScore = computeZScore(comparison.currentValue, stats.mean, stats.stddev);
      if (zScore < Z_SCORE_THRESHOLDS[AnomalySeverity.Info]) continue;

      const severity = classifySeverity(zScore);
      const expectedRange = {
        min: stats.mean - 2 * stats.stddev,
        max: stats.mean + 2 * stats.stddev,
        mean: stats.mean,
        stddev: stats.stddev,
      };

      anomalies.push({
        metricName: comparison.metricName,
        severity,
        description: `${comparison.metricName} deviated ${comparison.deviationPercent.toFixed(1)}% from baseline (z-score: ${zScore.toFixed(2)})`,
        zScore,
        expectedRange,
        detectedValue: comparison.currentValue,
      });
    }

    return anomalies;
  }

  async persistAnomalies(
    verificationResultId: string,
    anomalies: AnomalyResult[],
  ): Promise<void> {
    if (anomalies.length === 0) return;

    await this.prisma.anomaly.createMany({
      data: anomalies.map((a) => ({
        verification_id: verificationResultId,
        metric_name: a.metricName,
        severity: a.severity,
        description: a.description,
        detected_value: a.detectedValue,
        expected_range: a.expectedRange,
      })),
    });
  }

  issueVerdict(
    healthCheckPassed: boolean,
    comparisons: ComparisonResult[],
    anomalies: AnomalyResult[],
  ): VerdictResult {
    const counts = {
      critical: anomalies.filter((a) => a.severity === AnomalySeverity.Critical).length,
      high: anomalies.filter((a) => a.severity === AnomalySeverity.Warning).length,
      medium: anomalies.filter((a) => a.severity === AnomalySeverity.Info).length,
      low: 0,
    };

    const exceededCount = comparisons.filter((c) => c.status === 'exceeded').length;

    // FAILED: critical anomaly OR >2 high anomalies OR health check failed
    if (!healthCheckPassed || counts.critical > 0 || counts.high > 2) {
      return {
        verdict: VerificationVerdict.Fail,
        rollbackRecommended: true,
        reason: !healthCheckPassed
          ? 'Health check failure'
          : counts.critical > 0
            ? `${counts.critical} critical anomaly detected`
            : `${counts.high} high-severity anomalies detected`,
        anomalyCount: counts,
      };
    }

    // DEGRADED: any high anomaly OR >3 exceeded thresholds
    if (counts.high > 0 || exceededCount > 3) {
      return {
        verdict: VerificationVerdict.Inconclusive,
        rollbackRecommended: false,
        reason: counts.high > 0
          ? `${counts.high} high-severity anomaly detected`
          : `${exceededCount} metrics exceeded thresholds`,
        anomalyCount: counts,
      };
    }

    return {
      verdict: VerificationVerdict.Pass,
      rollbackRecommended: false,
      reason: 'All metrics within acceptable bounds',
      anomalyCount: counts,
    };
  }
}
