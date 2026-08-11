import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';
import { MetricsService } from '../metrics.service.js';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MetricsInterceptor.name);

  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const start = process.hrtime.bigint();

    // Use parameterized route to avoid high-cardinality label sets
    const route = (req.route?.path as string | undefined) ?? req.path ?? 'unknown';
    const method = req.method ?? 'GET';

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
          this.metricsService.recordHttpRequest(
            method,
            route,
            res.statusCode,
            durationMs / 1000,
          );
        },
        error: (err: unknown) => {
          const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
          const statusCode =
            (err as { status?: number; statusCode?: number })?.status ??
            (err as { status?: number; statusCode?: number })?.statusCode ??
            500;
          this.metricsService.recordHttpRequest(method, route, statusCode, durationMs / 1000);
        },
      }),
    );
  }
}
