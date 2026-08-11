import { Injectable, Logger } from '@nestjs/common';
import {
  Registry,
  Histogram,
  Counter,
  Gauge,
  collectDefaultMetrics,
  type HistogramConfiguration,
  type CounterConfiguration,
  type GaugeConfiguration,
} from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly registry: Registry;

  private readonly httpRequestDuration: Histogram;
  private readonly httpRequestTotal: Counter;
  private readonly httpRequestErrors: Counter;

  constructor(private readonly serviceName: string) {
    this.registry = new Registry();
    this.registry.setDefaultLabels({ service: serviceName });
    collectDefaultMetrics({ register: this.registry, prefix: 'nodejs_' });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code', 'service_name'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'service_name'],
      registers: [this.registry],
    });

    this.httpRequestErrors = new Counter({
      name: 'http_request_errors_total',
      help: 'Total HTTP error responses (4xx and 5xx)',
      labelNames: ['method', 'route', 'status_code', 'service_name'],
      registers: [this.registry],
    });

    this.logger.log(`Metrics initialized for service: ${serviceName}`);
  }

  getRegistry(): Registry {
    return this.registry;
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationSeconds: number,
  ): void {
    const labels = {
      method,
      route,
      status_code: String(statusCode),
      service_name: this.serviceName,
    };
    this.httpRequestDuration.observe(labels, durationSeconds);
    this.httpRequestTotal.inc(labels);
    if (statusCode >= 400) {
      this.httpRequestErrors.inc(labels);
    }
  }

  createHistogram<T extends string>(config: HistogramConfiguration<T>): Histogram<T> {
    return new Histogram({ ...config, registers: [this.registry] });
  }

  createCounter<T extends string>(config: CounterConfiguration<T>): Counter<T> {
    return new Counter({ ...config, registers: [this.registry] });
  }

  createGauge<T extends string>(config: GaugeConfiguration<T>): Gauge<T> {
    return new Gauge({ ...config, registers: [this.registry] });
  }
}
