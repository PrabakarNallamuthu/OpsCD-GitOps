/**
 * Adapter interface for observability backends (Prometheus, Datadog, New Relic).
 * Implemented in WO-078.
 */
export interface MetricLabels {
  readonly [key: string]: string;
}

export interface ObservabilityAdapter {
  readonly backend: 'prometheus' | 'datadog' | 'newrelic';

  incrementCounter(name: string, labels?: MetricLabels): void;
  recordGauge(name: string, value: number, labels?: MetricLabels): void;
  recordHistogram(name: string, valueMs: number, labels?: MetricLabels): void;
  startSpan(name: string, parentSpanId?: string): string;
  endSpan(spanId: string, error?: Error): void;
}
