import { DynamicModule, Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsService } from './metrics.service.js';
import { MetricsController } from './metrics.controller.js';
import { MetricsInterceptor } from './interceptors/metrics.interceptor.js';

export interface MetricsModuleOptions {
  serviceName: string;
}

@Global()
@Module({})
export class MetricsModule {
  static forRoot(options: MetricsModuleOptions): DynamicModule {
    const metricsServiceProvider = {
      provide: MetricsService,
      useFactory: () => new MetricsService(options.serviceName),
    };

    return {
      module: MetricsModule,
      controllers: [MetricsController],
      providers: [
        metricsServiceProvider,
        {
          provide: APP_INTERCEPTOR,
          useClass: MetricsInterceptor,
        },
      ],
      exports: [MetricsService],
    };
  }
}
