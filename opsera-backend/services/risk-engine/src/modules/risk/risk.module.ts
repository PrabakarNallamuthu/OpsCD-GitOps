import { Module } from '@nestjs/common';
import { RiskController } from './risk.controller.js';
import { RiskScoringService } from './risk-scoring.service.js';

@Module({
  controllers: [RiskController],
  providers: [RiskScoringService],
  exports: [RiskScoringService],
})
export class RiskModule {}
