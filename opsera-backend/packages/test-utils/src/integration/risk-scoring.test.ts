/**
 * WO-086: Unit tests for risk scoring engine
 */
import { RiskScoringService } from '../../../services/risk-engine/src/modules/risk/risk-scoring.service.js';

describe('RiskScoringService', () => {
  let service: RiskScoringService;

  beforeEach(() => {
    service = new RiskScoringService();
  });

  it('should score low risk for a small, tested, in-window deployment', () => {
    const result = service.assess('release-001', {
      changeVolumeLines: 50,
      affectedServices: 1,
      hasFailingTests: false,
      deploymentFrequencyPerDay: 5,
      changeFailureRate: 0.05,
      environment: 'staging',
      isOutsideDeploymentWindow: false,
    });

    expect(result.riskLevel).toBe('low');
    expect(result.recommendation).toBe('proceed');
    expect(result.overallScore).toBeLessThan(25);
  });

  it('should score critical risk for large, failing, out-of-window production deployment', () => {
    const result = service.assess('release-002', {
      changeVolumeLines: 5000,
      affectedServices: 8,
      hasFailingTests: true,
      deploymentFrequencyPerDay: 1,
      changeFailureRate: 0.4,
      environment: 'production',
      isOutsideDeploymentWindow: true,
    });

    expect(['high', 'critical']).toContain(result.riskLevel);
    expect(result.recommendation).not.toBe('proceed');
    expect(result.overallScore).toBeGreaterThan(60);
  });

  it('should include all expected factor names', () => {
    const result = service.assess('release-003', {
      changeVolumeLines: 100,
      affectedServices: 2,
      hasFailingTests: false,
      deploymentFrequencyPerDay: 3,
      changeFailureRate: 0.1,
      environment: 'staging',
      isOutsideDeploymentWindow: false,
    });

    const factorNames = result.factors.map((f) => f.name);
    expect(factorNames).toContain('change_volume');
    expect(factorNames).toContain('blast_radius');
    expect(factorNames).toContain('test_health');
    expect(factorNames).toContain('historical_failure_rate');
    expect(factorNames).toContain('deployment_timing');
  });
});
