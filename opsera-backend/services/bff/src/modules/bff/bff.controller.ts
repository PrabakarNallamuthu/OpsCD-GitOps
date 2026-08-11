/**
 * WO-061: BFF (Backend For Frontend) — aggregates data for UI
 * WO-062: BFF caching layer with Redis
 * WO-063: BFF release summary endpoint
 * WO-064: BFF dashboard endpoint
 */
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { BffService } from './bff.service.js';

@Controller('bff')
export class BffController {
  constructor(private readonly bffService: BffService) {}

  @Get('dashboard')
  getDashboard() {
    return this.bffService.getDashboardSummary();
  }

  @Get('releases/summary')
  getReleaseSummary(
    @Query('environment') environment?: string,
    @Query('limit') limit = '10',
  ) {
    return this.bffService.getReleaseSummary(environment, parseInt(limit, 10));
  }

  @Get('risk/summary')
  getRiskSummary() {
    return this.bffService.getRiskSummary();
  }
}
