import { Module } from '@nestjs/common';
import { PolicyController } from './policy.controller.js';
import { PolicyService } from './policy.service.js';
import { PolicyEvaluatorService } from './policy-evaluator.service.js';
import { PrismaClient } from '../../generated/prisma/index.js';

@Module({
  controllers: [PolicyController],
  providers: [PolicyService, PolicyEvaluatorService, PrismaClient],
  exports: [PolicyService, PolicyEvaluatorService],
})
export class PolicyModule {}
