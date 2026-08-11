/**
 * WO-042: Risk Engine REST API
 */
import { Controller, Post, Get, Param, Body, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { RiskScoringService } from './risk-scoring.service.js';

interface AssessRiskDto {
  changeVolumeLines: number;
  affectedServices: number;
  hasFailingTests: boolean;
  deploymentFrequencyPerDay: number;
  changeFailureRate: number;
  environment: string;
  isOutsideDeploymentWindow?: boolean;
}

@Controller('risk')
export class RiskController {
  constructor(private readonly riskService: RiskScoringService) {}

  @Post('assess/:releaseId')
  @HttpCode(HttpStatus.OK)
  assess(@Param('releaseId', ParseUUIDPipe) releaseId: string, @Body() dto: AssessRiskDto) {
    return this.riskService.assess(releaseId, {
      ...dto,
      isOutsideDeploymentWindow: dto.isOutsideDeploymentWindow ?? false,
    });
  }
}
