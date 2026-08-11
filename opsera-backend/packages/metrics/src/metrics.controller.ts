import { Controller, Get, Header, Logger } from '@nestjs/common';
import { MetricsService } from './metrics.service.js';

/**
 * Exposes /metrics endpoint on port 9090 for Prometheus scraping.
 * The application port serves the business API; metrics run on a separate port
 * configured via Kubernetes ServiceMonitor (see opsera-infra/helm/monitoring/).
 */
@Controller('metrics')
export class MetricsController {
  private readonly logger = new Logger(MetricsController.name);

  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}
