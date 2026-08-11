import { Module } from '@nestjs/common';
import { ReleaseController } from './release.controller.js';
import { ReleaseService } from './release.service.js';
import { ReleaseLifecycleService } from './release-lifecycle.service.js';
import { PrismaClient } from '../../generated/prisma/index.js';

@Module({
  controllers: [ReleaseController],
  providers: [ReleaseService, ReleaseLifecycleService, PrismaClient],
  exports: [ReleaseService, ReleaseLifecycleService],
})
export class ReleaseModule {}
