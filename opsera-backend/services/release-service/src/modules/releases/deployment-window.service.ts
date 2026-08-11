/**
 * WO-037: Deployment window management — configurable per-environment windows
 */
import { Injectable, Logger } from '@nestjs/common';

export interface DeploymentWindow {
  id: string;
  environment: string;
  name: string;
  startHourUtc: number;
  endHourUtc: number;
  daysOfWeek: number[];  // 0=Sun, 6=Sat
  enabled: boolean;
  exceptions: Array<{ date: string; reason: string }>;
}

@Injectable()
export class DeploymentWindowService {
  private readonly logger = new Logger(DeploymentWindowService.name);

  private readonly windows: DeploymentWindow[] = [
    {
      id: 'prod-night',
      environment: 'production',
      name: 'Production Nightly Window',
      startHourUtc: 2,
      endHourUtc: 6,
      daysOfWeek: [1, 2, 3, 4, 5],
      enabled: true,
      exceptions: [],
    },
    {
      id: 'staging-any',
      environment: 'staging',
      name: 'Staging (All hours)',
      startHourUtc: 0,
      endHourUtc: 24,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      enabled: true,
      exceptions: [],
    },
    {
      id: 'dev-any',
      environment: 'development',
      name: 'Development (All hours)',
      startHourUtc: 0,
      endHourUtc: 24,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      enabled: true,
      exceptions: [],
    },
  ];

  isWithinWindow(environment: string, at?: Date): boolean {
    const now = at ?? new Date();
    const hour = now.getUTCHours();
    const day = now.getUTCDay();
    const dateStr = now.toISOString().split('T')[0];

    const envWindows = this.windows.filter((w) => w.environment === environment && w.enabled);

    for (const window of envWindows) {
      const hasException = window.exceptions.some((e) => e.date === dateStr);
      if (hasException) continue;

      if (window.daysOfWeek.includes(day) && hour >= window.startHourUtc && hour < window.endHourUtc) {
        return true;
      }
    }

    return false;
  }

  getWindows(environment?: string): DeploymentWindow[] {
    return environment
      ? this.windows.filter((w) => w.environment === environment)
      : this.windows;
  }

  addException(windowId: string, date: string, reason: string): void {
    const window = this.windows.find((w) => w.id === windowId);
    if (window) {
      window.exceptions.push({ date, reason });
      this.logger.log(`Exception added for window ${windowId} on ${date}: ${reason}`);
    }
  }
}
