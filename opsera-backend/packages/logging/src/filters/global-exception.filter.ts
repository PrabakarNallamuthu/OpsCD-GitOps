import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { getCorrelationId } from '../correlation-id.storage.js';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    correlation_id: string;
    timestamp: string;
  };
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId = getCorrelationId();
    const timestamp = new Date().toISOString();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = exception.constructor.name
        .replace(/Exception$/, '')
        .replace(/([A-Z])/g, '_$1')
        .toUpperCase()
        .slice(1);
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'object'
          ? (exceptionResponse as { message?: string }).message ?? message
          : String(exceptionResponse);
    }

    this.logger.error({
      message: `${request.method} ${request.url} → ${status}`,
      error_code: code,
      correlation_id: correlationId,
      status,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    const body: ErrorResponse = {
      error: {
        code,
        message,
        correlation_id: correlationId,
        timestamp,
      },
    };

    response.status(status).json(body);
  }
}
