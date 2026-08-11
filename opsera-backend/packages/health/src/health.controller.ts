import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthCheckResult } from '@nestjs/terminus';

let isShuttingDown = false;

export function setShuttingDown(value: boolean): void {
  isShuttingDown = value;
}

@Controller()
export class HealthController {
  constructor(private readonly health: HealthCheckService) {}

  @Get('live')
  @HealthCheck()
  liveness(): HealthCheckResult | { status: 'shutting_down' } {
    if (isShuttingDown) {
      return { status: 'shutting_down' };
    }
    return this.health.check([]);
  }

  @Get('ready')
  @HealthCheck()
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([]);
  }
}
