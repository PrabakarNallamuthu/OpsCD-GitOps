/**
 * WO-053: Policy evaluation endpoint — evaluates a release against all active policies
 */
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PolicyEvaluatorService } from './policy-evaluator.service.js';
import { PolicyService } from './policy.service.js';

interface EvaluateDto {
  releaseId: string;
  context: Record<string, unknown>;
}

interface ExemptionDto {
  policyId: string;
  releaseId: string;
  reason: string;
  grantedBy: string;
  expiresInHours?: number;
}

@Controller('policies')
export class PolicyEvaluatorController {
  constructor(
    private readonly evaluatorService: PolicyEvaluatorService,
    private readonly policyService: PolicyService,
  ) {}

  @Post('evaluate')
  @HttpCode(HttpStatus.OK)
  async evaluate(@Body() dto: EvaluateDto) {
    const policies = await this.policyService.list();
    return this.evaluatorService.evaluate(dto.releaseId, dto.context, policies);
  }

  @Post('exemptions')
  @HttpCode(HttpStatus.CREATED)
  grantExemption(@Body() dto: ExemptionDto) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (dto.expiresInHours ?? 24));

    this.evaluatorService.grantExemption({
      policyId: dto.policyId,
      releaseId: dto.releaseId,
      reason: dto.reason,
      grantedBy: dto.grantedBy,
      expiresAt,
    });

    return { message: 'Exemption granted', expiresAt };
  }
}
