/**
 * WO-040: Risk Scoring Engine — Multi-factor risk assessment
 * WO-041: Risk aggregation and trend analysis
 */
import { Injectable, Logger } from '@nestjs/common';

export interface RiskFactor {
  name: string;
  weight: number;    // 0–1
  score: number;     // 0–100
  evidence?: string;
}

export interface RiskAssessment {
  releaseId: string;
  overallScore: number;        // 0–100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  recommendation: 'proceed' | 'review' | 'block';
  assessedAt: string;
}

const RISK_LEVEL_THRESHOLDS = {
  low: 25,
  medium: 50,
  high: 75,
};

@Injectable()
export class RiskScoringService {
  private readonly logger = new Logger(RiskScoringService.name);

  assess(releaseId: string, context: {
    changeVolumeLines: number;
    affectedServices: number;
    hasFailingTests: boolean;
    deploymentFrequencyPerDay: number;
    changeFailureRate: number;  // 0–1
    environment: string;
    isOutsideDeploymentWindow: boolean;
  }): RiskAssessment {
    const factors: RiskFactor[] = [
      {
        name: 'change_volume',
        weight: 0.20,
        score: Math.min(100, (context.changeVolumeLines / 1000) * 100),
        evidence: `${context.changeVolumeLines} lines changed`,
      },
      {
        name: 'blast_radius',
        weight: 0.25,
        score: Math.min(100, context.affectedServices * 12),
        evidence: `${context.affectedServices} services affected`,
      },
      {
        name: 'test_health',
        weight: 0.25,
        score: context.hasFailingTests ? 100 : 0,
        evidence: context.hasFailingTests ? 'Failing tests detected' : 'All tests passing',
      },
      {
        name: 'historical_failure_rate',
        weight: 0.20,
        score: context.changeFailureRate * 100,
        evidence: `${(context.changeFailureRate * 100).toFixed(1)}% recent failure rate`,
      },
      {
        name: 'deployment_timing',
        weight: 0.10,
        score: context.isOutsideDeploymentWindow ? 80 : 0,
        evidence: context.isOutsideDeploymentWindow ? 'Outside approved window' : 'Within deployment window',
      },
    ];

    const overallScore = factors.reduce((sum, f) => sum + f.weight * f.score, 0);

    let riskLevel: RiskAssessment['riskLevel'];
    let recommendation: RiskAssessment['recommendation'];

    if (overallScore >= RISK_LEVEL_THRESHOLDS.high) {
      riskLevel = overallScore >= 90 ? 'critical' : 'high';
      recommendation = overallScore >= 90 ? 'block' : 'review';
    } else if (overallScore >= RISK_LEVEL_THRESHOLDS.medium) {
      riskLevel = 'medium';
      recommendation = 'review';
    } else {
      riskLevel = 'low';
      recommendation = 'proceed';
    }

    this.logger.log(`Release ${releaseId} risk: ${riskLevel} (${overallScore.toFixed(1)}) → ${recommendation}`);

    return {
      releaseId,
      overallScore: Math.round(overallScore),
      riskLevel,
      factors,
      recommendation,
      assessedAt: new Date().toISOString(),
    };
  }
}
