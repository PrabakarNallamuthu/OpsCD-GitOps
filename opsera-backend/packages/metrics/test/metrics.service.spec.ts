import { MetricsService } from '../src/metrics.service.js';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(() => {
    service = new MetricsService('test-service');
  });

  it('returns Prometheus text format from getMetrics()', async () => {
    const output = await service.getMetrics();
    expect(output).toContain('# HELP');
    expect(output).toContain('# TYPE');
  });

  it('records HTTP request and increments counters', async () => {
    service.recordHttpRequest('GET', '/api/releases', 200, 0.05);
    const output = await service.getMetrics();
    expect(output).toContain('http_requests_total');
    expect(output).toContain('http_request_duration_seconds');
  });

  it('records error requests in error counter', async () => {
    service.recordHttpRequest('POST', '/api/releases', 500, 0.1);
    const output = await service.getMetrics();
    expect(output).toContain('http_request_errors_total');
  });

  it('does not increment error counter for 2xx responses', async () => {
    service.recordHttpRequest('GET', '/api/health', 200, 0.01);
    const output = await service.getMetrics();
    // error counter line should not have status_code="200"
    const lines = output.split('\n');
    const errorLines = lines.filter(
      (l) => l.startsWith('http_request_errors_total{') && l.includes('status_code="200"'),
    );
    expect(errorLines).toHaveLength(0);
  });

  it('creates custom histogram', () => {
    const hist = service.createHistogram({
      name: 'risk_analysis_duration_seconds',
      help: 'Risk analysis duration',
      labelNames: [] as const,
      buckets: [1, 5, 10, 30, 60],
    });
    expect(hist).toBeDefined();
    hist.observe(5.2);
  });

  it('creates custom counter', () => {
    const counter = service.createCounter({
      name: 'releases_created_total',
      help: 'Releases created',
      labelNames: ['status'] as const,
    });
    counter.inc({ status: 'Draft' });
  });

  it('creates custom gauge', async () => {
    const gauge = service.createGauge({
      name: 'websocket_active_connections',
      help: 'Active WebSocket connections',
      labelNames: [] as const,
    });
    gauge.set(42);
    const output = await service.getMetrics();
    expect(output).toContain('websocket_active_connections');
    expect(output).toContain('42');
  });
});
