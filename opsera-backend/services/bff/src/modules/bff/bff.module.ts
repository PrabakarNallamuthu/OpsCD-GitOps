import { Module } from '@nestjs/common';
import { BffController } from './bff.controller.js';
import { BffService } from './bff.service.js';

@Module({
  controllers: [BffController],
  providers: [BffService],
})
export class BffModule {}
