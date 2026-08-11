import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '../../../generated/prisma/index.js';
import type { ObservabilityAdapter } from '../../verification/adapters/prometheus.adapter.js';

export interface BaselineCaptureRequest {
  releaseId: string;
  namespace: string;
  service: string;
  environment: string;
  windowMinutes?: number;
}

export interface BaselineRecord {
  service: string;
  environment: string;
  errorRateP95: number;
  latencyP50Ms: number;
  latencyP95Ms: number;
  latencyP99Ms: number;
  throughputRps: number;
  sampleWindowHours: number;
  capturedAt: Date;
}

export class BaselineInsufficientError extends Error {
  constructor(
    public readonly metricName: string,
    public readonly dataPointCount: number,
  ) {
    super(`Insufficient baseline data for ${metricName}: only ${dataPointCount} data points (minimum 3 required)`);
    this.name = 'BaselineInsufficientError';
  }
}

export interface ComparisonResult {
  metricName: string;
  baselineValue: number;
  currentValue: number;
  deviationPercent: number;
  threshold: number;
  status: 'within_threshold' | 'exceeded';
  direction: 'increase' | 'decrease';
}

// Environment-specific thresholds (configurable via env vars)
const THRESHOLDS: Record<string, Record<string, number>> = {
  production: {
    error_rate: 5,       // 5% max deviation
    latency_p95_ms: 10,  // 10% max latency regression
    throughput_rps: 20,  // 20% max throughput drop
  },
  staging: {
    error_rate: 10,
    latency_p95_ms: 20,
    throughput_rps: 30,
  },
  dev: {
    error_rate: 50,
    latency_p95_ms: 100,
    throughput_rps: 100,
  },
};

@Injectable()
export class BaselineService {
  private readonly logger = new Logger(BaselineService.name);

  constructor(
    private readonly prisma: PrismaClient,
    private readonly observability: ObservabilityAdapter,
  ) {}

  async captureBaseline(req: BaselineCaptureRequest): Promise<BaselineRecord> {
    const windowMins = req.windowMinutes ?? 30;

    const [errorRate, latencyP95, latencyP50, latencyP99, throughput] = await Promise.allSettled([
      this.observability.queryErrorRate(req.namespace, req.service, windowMins),
      this.observability.queryLatencyPercentile(req.namespace, req.service, 95),
      this.observability.queryLatencyPercentile(req.namespace, req.service, 50),
      this.observability.queryLatencyPercentile(req.namespace, req.service, 99),
      this.observability.queryThroughput(req.namespace, req.service),
    ]);

    // Validate minimum data availability
    const failedCount = [errorRate, latencyP95, latencyP50, latencyP99, throughput].filter(
      (r) => r.status === 'rejected',
    ).length;

    if (failedCount >= 3) {
      throw new BaselineInsufficientError('multiple-metrics', 5 - failedCount);
    }

    const record: BaselineRecord = {
      service: req.service,
      environment: req.environment,
      errorRateP95: errorRate.status === 'fulfilled' ? errorRate.value : 0,
      latencyP50Ms: latencyP50.status === 'fulfilled' ? latencyP50.value : -1,
      latencyP95Ms: latencyP95.status === 'fulfilled' ? latencyP95.value : -1,
      latencyP99Ms: latencyP99.status === 'fulfilled' ? latencyP99.value : -1,
      throughputRps: throughput.status === 'fulfilled' ? throughput.value : 0,
      sampleWindowHours: windowMins / 60,
      capturedAt: new Date(),
    };

    await this.prisma.metricBaseline.create({
      data: {
        service_name: record.service,
        environment: record.environment,
        error_rate_p95: new Prisma.Decimal(record.errorRateP95),
        latency_p50_ms: record.latencyP50Ms,
        latency_p95_ms: record.latencyP95Ms,
        latency_p99_ms: record.latencyP99Ms,
        throughput_rps: new Prisma.Decimal(record.throughputRps),
        sample_window_hours: record.sampleWindowHours,
        baseline_captured_at: record.capturedAt,
      },
    });

    this.logger.log(`Baseline captured for ${req.service} in ${req.environment}`);
    return record;
  }

  compare(baseline: BaselineRecord, current: Partial<BaselineRecord>, environment: string): ComparisonResult[] {
    const thresholds = THRESHOLDS[environment] ?? THRESHOLDS['staging']!;
    const results: ComparisonResult[] = [];

    const compare = (
      metricName: string,
      baselineVal: number,
      currentVal: number,
      thresholdKey: string,
      higherIsBetter: boolean,
    ): void => {
      if (baselineVal < 0 || currentVal < 0) return; // metric unavailable

      let deviationPercent: number;
      if (baselineVal === 0) {
        deviationPercent = currentVal === 0 ? 0 : 100;
      } else {
        deviationPercent = ((currentVal - baselineVal) / baselineVal) * 100;
      }

      const absDeviation = Math.abs(deviationPercent);
      const threshold = thresholds[thresholdKey] ?? 20;
      const direction = deviationPercent >= 0 ? 'increase' : 'decrease';

      // For "higher is better" metrics (throughput), a decrease is the problem
      const isExceeded = higherIsBetter
        ? deviationPercent < 0 && absDeviation > threshold
        : absDeviation > threshold;

      results.push({
        metricName,
        baselineValue: baselineVal,
        currentValue: currentVal,
        deviationPercent,
        threshold,
        status: isExceeded ? 'exceeded' : 'within_threshold',
        direction,
      });
    };

    compare('error_rate', baseline.errorRateP95, current.errorRateP95 ?? baseline.errorRateP95, 'error_rate', false);
    compare('latency_p95_ms', baseline.latencyP95Ms, current.latencyP95Ms ?? baseline.latencyP95Ms, 'latency_p95_ms', false);
    compare('throughput_rps', baseline.throughputRps, current.throughputRps ?? baseline.throughputRps, 'throughput_rps', true);

    return results;
  }
}
