/**
 * WO-050: Policy evaluation engine — evaluates releases against active policies
 * WO-051: Policy violation workflow
 * WO-052: Policy exemption management
 */
import { Injectable, Logger } from '@nestjs/common';

export type PolicyAction = 'block' | 'warn' | 'audit';

export interface PolicyRule {
  id: string;
  name: string;
  ruleType: string;
  conditions: Record<string, unknown>;
  action: PolicyAction;
}

export interface PolicyViolation {
  policyId: string;
  policyName: string;
  action: PolicyAction;
  message: string;
}

export interface PolicyEvaluationResult {
  releaseId: string;
  passed: boolean;
  violations: PolicyViolation[];
  blocked: boolean;
  warnings: number;
  evaluatedAt: string;
}

export interface PolicyExemption {
  policyId: string;
  releaseId: string;
  reason: string;
  grantedBy: string;
  expiresAt: Date;
}

@Injectable()
export class PolicyEvaluatorService {
  private readonly logger = new Logger(PolicyEvaluatorService.name);
  private readonly exemptions = new Map<string, PolicyExemption[]>();

  async evaluate(
    releaseId: string,
    context: Record<string, unknown>,
    policies: PolicyRule[],
  ): Promise<PolicyEvaluationResult> {
    const violations: PolicyViolation[] = [];

    for (const policy of policies) {
      const isExempt = this.isExempt(policy.id, releaseId);
      if (isExempt) {
        this.logger.log(`Policy ${policy.id} exempted for release ${releaseId}`);
        continue;
      }

      const violated = this.evaluateRule(policy, context);
      if (violated) {
        violations.push({
          policyId: policy.id,
          policyName: policy.name,
          action: policy.action,
          message: `Policy '${policy.name}' (${policy.ruleType}) violated`,
        });
      }
    }

    const blocked = violations.some((v) => v.action === 'block');
    const warnings = violations.filter((v) => v.action === 'warn').length;

    this.logger.log(
      `Release ${releaseId}: ${violations.length} violations, blocked=${blocked}, warnings=${warnings}`,
    );

    return {
      releaseId,
      passed: !blocked,
      violations,
      blocked,
      warnings,
      evaluatedAt: new Date().toISOString(),
    };
  }

  grantExemption(exemption: PolicyExemption): void {
    const key = exemption.policyId;
    const list = this.exemptions.get(key) ?? [];
    list.push(exemption);
    this.exemptions.set(key, list);
    this.logger.warn(`Exemption granted: policy=${exemption.policyId} release=${exemption.releaseId} by=${exemption.grantedBy}`);
  }

  private isExempt(policyId: string, releaseId: string): boolean {
    const list = this.exemptions.get(policyId) ?? [];
    const now = new Date();
    return list.some((e) => e.releaseId === releaseId && e.expiresAt > now);
  }

  private evaluateRule(policy: PolicyRule, context: Record<string, unknown>): boolean {
    const conditions = policy.conditions;

    switch (policy.ruleType) {
      case 'require_approval':
        return !context['approvedBy'];
      case 'block_production_without_tests':
        return context['environment'] === 'production' && context['hasFailingTests'] === true;
      case 'require_minimum_coverage':
        return typeof context['coveragePercent'] === 'number' &&
          context['coveragePercent'] < ((conditions['threshold'] as number) ?? 80);
      case 'block_outside_window':
        return context['isOutsideDeploymentWindow'] === true;
      default:
        this.logger.warn(`Unknown rule type: ${policy.ruleType}`);
        return false;
    }
  }
}
