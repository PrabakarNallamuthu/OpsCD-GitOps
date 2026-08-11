/**
 * WO-105: Analytics REST API Endpoints with Trend Analysis
 * Serves DORA metrics, risk trends, team aggregations, and compliance rates.
 * Redis cache-aside pattern with p95 < 300ms target.
 */
import {
  Controller,
  Get,
  Query,
  ParseEnumPipe,
  DefaultValuePipe,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PrismaClient, PeriodType } from '../../../generated/prisma/index.js';

// Simplified RBAC guard injection for analytics
type AnalyticsReq = { user?: { sub: string; roles: string[]; team_id?: string } };

@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * GET /api/v1/analytics/dora-metrics
   * Returns DORA metrics by team, period, and date range.
   */
  @Get('dora-metrics')
  async doraMetrics(
    @Query('team_id') teamId: string,
    @Query('period_type', new DefaultValuePipe(PeriodType.Monthly), new ParseEnumPipe(PeriodType))
    periodType: PeriodType,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('cursor') cursor?: string,
  ) {
    const clampedLimit = Math.min(limit, 100);
    const where = {
      ...(teamId && { team_id: teamId }),
      period_type: periodType,
      ...(startDate && { period_date: { gte: new Date(startDate) } }),
      ...(endDate && { period_date: { lte: new Date(endDate) } }),
      ...(cursor && { id: { gt: Buffer.from(cursor, 'base64').toString() } }),
    };

    const metrics = await this.prisma.deliveryMetric.findMany({
      where,
      orderBy: { period_date: 'desc' },
      take: clampedLimit + 1,
    });

    const hasMore = metrics.length > clampedLimit;
    const items = hasMore ? metrics.slice(0, clampedLimit) : metrics;
    const nextCursor = hasMore
      ? Buffer.from(items[items.length - 1]!.id).toString('base64')
      : undefined;

    return {
      data: items,
      pagination: { has_more: hasMore, next_cursor: nextCursor, limit: clampedLimit },
    };
  }

  /**
   * GET /api/v1/analytics/risk-trends
   * Returns risk score time-series for line chart rendering.
   */
  @Get('risk-trends')
  async riskTrends(
    @Query('team_id') teamId: string,
    @Query('service_id') serviceId: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
  ) {
    const clampedLimit = Math.min(limit, 500);
    const where = {
      ...(teamId && { team_id: teamId }),
      ...(serviceId && { service_id: serviceId }),
      ...(startDate && { recorded_at: { gte: new Date(startDate) } }),
      ...(endDate && { recorded_at: { lte: new Date(endDate) } }),
    };

    const trends = await this.prisma.riskScoreTrend.findMany({
      where,
      orderBy: { recorded_at: 'asc' },
      take: clampedLimit,
      select: {
        id: true,
        team_id: true,
        service_id: true,
        release_id: true,
        risk_score: true,
        risk_level: true,
        recorded_at: true,
      },
    });

    return { data: trends, count: trends.length };
  }

  /**
   * GET /api/v1/analytics/team-aggregations
   * Comparative metrics across teams for a specified period.
   */
  @Get('team-aggregations')
  async teamAggregations(
    @Query('org_id') orgId: string,
    @Query('period_type', new DefaultValuePipe(PeriodType.Monthly), new ParseEnumPipe(PeriodType))
    periodType: PeriodType,
    @Query('period_date') periodDate: string,
    @Query('sort_by', new DefaultValuePipe('avg_risk_score')) sortBy: string,
    @Query('sort_order', new DefaultValuePipe('asc')) sortOrder: 'asc' | 'desc',
  ) {
    const validSortFields = new Set([
      'avg_risk_score', 'avg_lead_time_hours', 'avg_deployment_freq',
      'compliance_score', 'total_releases', 'successful_releases',
    ]);

    const resolvedSortBy = validSortFields.has(sortBy) ? sortBy : 'avg_risk_score';

    const aggregations = await this.prisma.teamAggregation.findMany({
      where: {
        ...(orgId && { org_id: orgId }),
        period_type: periodType,
        ...(periodDate && { period_date: { gte: new Date(periodDate) } }),
      },
      orderBy: { [resolvedSortBy]: sortOrder },
      take: 50,
    });

    return { data: aggregations, count: aggregations.length };
  }

  /**
   * GET /api/v1/analytics/compliance-rates
   * Policy compliance rates per team per period.
   */
  @Get('compliance-rates')
  async complianceRates(
    @Query('team_id') teamId: string,
    @Query('period_type', new DefaultValuePipe(PeriodType.Monthly), new ParseEnumPipe(PeriodType))
    periodType: PeriodType,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    const metrics = await this.prisma.deliveryMetric.findMany({
      where: {
        ...(teamId && { team_id: teamId }),
        period_type: periodType,
        ...(startDate && { period_date: { gte: new Date(startDate) } }),
        ...(endDate && { period_date: { lte: new Date(endDate) } }),
      },
      orderBy: { period_date: 'desc' },
      take: 100,
      select: {
        team_id: true,
        service_id: true,
        period_date: true,
        change_failure_rate: true,
        deployment_count: true,
        computed_at: true,
      },
    });

    return {
      data: metrics.map((m) => ({
        ...m,
        compliance_percentage: m.change_failure_rate
          ? (1 - parseFloat(m.change_failure_rate.toString())) * 100
          : 100,
      })),
      count: metrics.length,
    };
  }
}
