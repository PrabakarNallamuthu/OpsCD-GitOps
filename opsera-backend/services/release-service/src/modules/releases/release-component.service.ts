/**
 * WO-038: Release component manifest — per-service version tracking
 */
import { Injectable, Logger } from '@nestjs/common';

export interface ServiceComponent {
  name: string;
  currentVersion: string;
  targetVersion: string;
  imageTag: string;
  chartVersion?: string;
  healthStatus: 'healthy' | 'degraded' | 'unknown';
}

@Injectable()
export class ReleaseComponentService {
  private readonly logger = new Logger(ReleaseComponentService.name);

  buildManifest(releaseId: string, components: Array<{ name: string; targetVersion: string }>): ServiceComponent[] {
    return components.map((c) => ({
      name: c.name,
      currentVersion: 'unknown', // fetched from ArgoCD in production
      targetVersion: c.targetVersion,
      imageTag: `${c.name}:${c.targetVersion}`,
      healthStatus: 'unknown',
    }));
  }

  async checkHealth(manifest: ServiceComponent[]): Promise<ServiceComponent[]> {
    // In production: query Kubernetes pod status / ArgoCD health
    return manifest.map((c) => ({ ...c, healthStatus: 'healthy' as const }));
  }
}
