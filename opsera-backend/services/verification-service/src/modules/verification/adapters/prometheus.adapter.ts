import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { type AxiosInstance } from 'axios';
import CircuitBreaker from 'opossum';

export interface MetricResult {
  metric: Record<string, string>;
  value: [number, string];
}

export interface ObservabilityAdapter {
  queryErrorRate(namespace: string, service: string, windowMins: number): Promise<number>;
  queryLatencyPercentile(namespace: string, service: string, percentile: number): Promise<number>;
  queryThroughput(namespace: string, service: string): Promise<number>;
}

@Injectable()
export class PrometheusAdapter implements ObservabilityAdapter {
  private readonly logger = new Logger(PrometheusAdapter.name);
  private readonly http: AxiosInstance;
  private readonly breaker: CircuitBreaker;

  constructor(private readonly config: ConfigService) {
    this.http = axios.create({
      baseURL: config.get<string>('PROMETHEUS_URL', 'http://prometheus:9090'),
      timeout: 10_000,
    });

    this.breaker = new CircuitBreaker(
      async (query: string) => {
        const resp = await this.http.get<{
          data: { result: MetricResult[] };
        }>('/api/v1/query', { params: { query } });
        return resp.data.data.result;
      },
      {
        timeout: 10_000,
        errorThresholdPercentage: 50,
        resetTimeout: 30_000,
        volumeThreshold: 5,
        name: 'prometheus-adapter',
      },
    );

    this.breaker.on('open', () => this.logger.warn('PrometheusAdapter circuit OPEN'));
    this.breaker.on('halfOpen', () => this.logger.log('PrometheusAdapter circuit HALF-OPEN'));
    this.breaker.on('close', () => this.logger.log('PrometheusAdapter circuit CLOSED'));
  }

  async queryErrorRate(namespace: string, service: string, windowMins = 5): Promise<number> {
    const query = `
      sum(rate(http_request_errors_total{namespace="${namespace}",service="${service}"}[${windowMins}m]))
      /
      sum(rate(http_requests_total{namespace="${namespace}",service="${service}"}[${windowMins}m]))
    `;
    const results = (await this.breaker.fire(query)) as MetricResult[];
    if (!results.length) return 0;
    return parseFloat(results[0]!.value[1]);
  }

  async queryLatencyPercentile(
    namespace: string,
    service: string,
    percentile: number,
  ): Promise<number> {
    const query = `histogram_quantile(${percentile / 100}, sum(rate(http_request_duration_seconds_bucket{namespace="${namespace}",service="${service}"}[5m])) by (le)) * 1000`;
    const results = (await this.breaker.fire(query)) as MetricResult[];
    if (!results.length) return -1;
    return Math.round(parseFloat(results[0]!.value[1]));
  }

  async queryThroughput(namespace: string, service: string): Promise<number> {
    const query = `sum(rate(http_requests_total{namespace="${namespace}",service="${service}"}[5m]))`;
    const results = (await this.breaker.fire(query)) as MetricResult[];
    if (!results.length) return 0;
    return parseFloat(results[0]!.value[1]);
  }
}
