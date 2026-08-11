/**
 * WO-092: Unit tests for policy evaluation engine
 */
import { PolicyEvaluatorService } from '../../../services/policy-engine/src/modules/policy/policy-evaluator.service.js';

describe('PolicyEvaluatorService', () => {
  let service: PolicyEvaluatorService;

  beforeEach(() => {
    service = new PolicyEvaluatorService();
  });

  const policies = [
    {
      id: 'p1',
      name: 'Block production without tests',
      ruleType: 'block_production_without_tests',
      conditions: {},
      action: 'block' as const,
    },
    {
      id: 'p2',
      name: 'Require approval',
      ruleType: 'require_approval',
      conditions: {},
      action: 'block' as const,
    },
  ];

  it('should pass evaluation when no policies are violated', async () => {
    const result = await service.evaluate('release-1', {
      environment: 'staging',
      hasFailingTests: false,
      approvedBy: 'user-1',
    }, policies);

    expect(result.passed).toBe(true);
    expect(result.blocked).toBe(false);
    expect(result.violations).toHaveLength(0);
  });

  it('should block when production has failing tests', async () => {
    const result = await service.evaluate('release-2', {
      environment: 'production',
      hasFailingTests: true,
      approvedBy: 'user-1',
    }, policies);

    expect(result.blocked).toBe(true);
    expect(result.violations.some((v) => v.policyId === 'p1')).toBe(true);
  });

  it('should block when approval is missing', async () => {
    const result = await service.evaluate('release-3', {
      environment: 'staging',
      hasFailingTests: false,
      approvedBy: undefined,
    }, policies);

    expect(result.blocked).toBe(true);
    expect(result.violations.some((v) => v.policyId === 'p2')).toBe(true);
  });

  it('should skip exempt policies', async () => {
    service.grantExemption({
      policyId: 'p2',
      releaseId: 'release-4',
      reason: 'Emergency deployment',
      grantedBy: 'admin-1',
      expiresAt: new Date(Date.now() + 3600_000),
    });

    const result = await service.evaluate('release-4', {
      environment: 'staging',
      hasFailingTests: false,
      approvedBy: undefined, // normally would trigger p2
    }, policies);

    expect(result.violations.some((v) => v.policyId === 'p2')).toBe(false);
  });
});
