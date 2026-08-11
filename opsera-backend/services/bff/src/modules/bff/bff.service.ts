/**
 * BFF service — calls downstream services, applies Redis caching
 */
import { Injectable, Logger } from '@nestjs/common';

interface DashboardSummary {
  totalReleases: number;
  successRate: number;
  avgRiskScore: number;
  pendingApprovals: number;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
  doraMetrics: {
    deploymentFrequency: number;
    leadTimeHours: number;
    changeFailureRate: number;
    mttrHours: number;
    level: string;
  };
}

const CACHE_TTL_SECONDS = 30;

@Injectable()
export class BffService {
  private readonly logger = new Logger(BffService.name);
  private readonly cache = new Map<string, { value: unknown; expiresAt: number }>();

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.value as T;
    }
    return null;
  }

  private setCache(key: string, value: unknown, ttlSeconds = CACHE_TTL_SECONDS): void {
    this.cache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    const cacheKey = 'bff:dashboard';
    const cached = this.getCached<DashboardSummary>(cacheKey);
    if (cached) return cached;

    // In production: fan-out to release-service, risk-engine, analytics-service via gRPC/HTTP
    const summary: DashboardSummary = {
      totalReleases: 0,
      successRate: 0,
      avgRiskScore: 0,
      pendingApprovals: 0,
      recentActivity: [],
      doraMetrics: {
        deploymentFrequency: 0,
        leadTimeHours: 0,
        changeFailureRate: 0,
        mttrHours: 0,
        level: 'low',
      },
    };

    this.setCache(cacheKey, summary);
    return summary;
  }

  async getReleaseSummary(environment?: string, limit = 10): Promise<unknown[]> {
    const cacheKey = `bff:releases:${environment ?? 'all'}:${limit}`;
    const cached = this.getCached<unknown[]>(cacheKey);
    if (cached) return cached;

    // In production: call release-service + risk-engine and merge
    const releases: unknown[] = [];
    this.setCache(cacheKey, releases, 15);
    return releases;
  }

  async getRiskSummary(): Promise<unknown> {
    const cacheKey = 'bff:risk:summary';
    const cached = this.getCached<unknown>(cacheKey);
    if (cached) return cached;

    const summary = { avgScore: 0, highRiskCount: 0, trends: [] };
    this.setCache(cacheKey, summary, 60);
    return summary;
  }
}
