import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';

let sdk: NodeSDK | null = null;

export function initTracing(serviceName: string, serviceVersion = '1.0.0'): void {
  const endpoint =
    process.env['OTEL_EXPORTER_OTLP_ENDPOINT'] ??
    'http://otel-collector.monitoring.svc.cluster.local:4318';

  const samplingRatio = process.env['NODE_ENV'] === 'production' ? 0.1 : 1.0;

  sdk = new NodeSDK({
    resource: new Resource({
      [SEMRESATTRS_SERVICE_NAME]: serviceName,
      [SEMRESATTRS_SERVICE_VERSION]: serviceVersion,
    }),
    traceExporter: new OTLPTraceExporter({
      url: `${endpoint}/v1/traces`,
    }),
    sampler: new ParentBasedSampler({
      root: new TraceIdRatioBasedSampler(samplingRatio),
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-http': { enabled: true },
        '@opentelemetry/instrumentation-express': { enabled: true },
        '@opentelemetry/instrumentation-kafkajs': { enabled: true },
        '@opentelemetry/instrumentation-pg': { enabled: true },
      }),
    ],
  });

  try {
    sdk.start();
  } catch (err) {
    console.error('Failed to initialize OpenTelemetry SDK:', err);
  }

  process.on('SIGTERM', async () => {
    try {
      await sdk?.shutdown();
    } catch {
      // Non-fatal
    }
  });
}
