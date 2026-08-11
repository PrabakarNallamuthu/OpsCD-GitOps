import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { runWithContextAsync } from '../correlation-id.storage.js';

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
    }>();
    const response = context.switchToHttp().getResponse<{
      setHeader: (name: string, value: string) => void;
    }>();

    const correlationId =
      request.headers['x-correlation-id'] ??
      extractTraceParentId(request.headers['traceparent']) ??
      uuidv4();

    response.setHeader('X-Correlation-ID', correlationId);

    return new Observable((subscriber) => {
      runWithContextAsync({ correlationId }, async () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err: unknown) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      }).catch((err: unknown) => subscriber.error(err));
    });
  }
}

function extractTraceParentId(
  traceparent: string | undefined,
): string | undefined {
  if (!traceparent) return undefined;
  const parts = traceparent.split('-');
  return parts.length >= 3 ? parts[2] : undefined;
}
