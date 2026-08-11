/**
 * WO-038: Release component management — track multi-service components per release
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/index.js';

export interface ReleaseComponent {
  id: string;
  releaseId: string;
  serviceName: string;
  imageTag: string;
  gitRef: string;
  previousImageTag?: string;
  deployedAt?: Date;
  healthStatus: 'pending' | 'healthy' | 'degraded' | 'failed';
}

@Injectable()
export class ReleaseComponentService {
  private readonly logger = new Logger(ReleaseComponentService.name);

  constructor(private readonly prisma: PrismaClient) {}

  async addComponent(releaseId: string, component: Omit<ReleaseComponent, 'id' | 'releaseId'>): Promise<ReleaseComponent> {
    const created = await this.prisma.releaseComponent.create({
      data: {
        release_id: releaseId,
        service_name: component.serviceName,
        image_tag: component.imageTag,
        git_ref: component.gitRef,
        previous_image_tag: component.previousImageTag,
        health_status: component.healthStatus,
      },
    });
    return this.mapComponent(created);
  }

  async updateHealth(componentId: string, status: ReleaseComponent['healthStatus']): Promise<void> {
    await this.prisma.releaseComponent.update({
      where: { id: componentId },
      data: { health_status: status, ...(status === 'healthy' ? { deployed_at: new Date() } : {}) },
    });
  }

  async getComponents(releaseId: string): Promise<ReleaseComponent[]> {
    const rows = await this.prisma.releaseComponent.findMany({
      where: { release_id: releaseId },
      orderBy: { created_at: 'asc' },
    });
    return rows.map(this.mapComponent);
  }

  private mapComponent(row: Record<string, unknown>): ReleaseComponent {
    return {
      id: row['id'] as string,
      releaseId: row['release_id'] as string,
      serviceName: row['service_name'] as string,
      imageTag: row['image_tag'] as string,
      gitRef: row['git_ref'] as string,
      previousImageTag: row['previous_image_tag'] as string | undefined,
      deployedAt: row['deployed_at'] as Date | undefined,
      healthStatus: row['health_status'] as ReleaseComponent['healthStatus'],
    };
  }
}
