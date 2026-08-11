/**
 * @opsera/logging — structured JSON logger for all Opsera services.
 * Wraps a pino-compatible interface; implementation wired in WO-020.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  readonly service: string;
  readonly traceId?: string;
  readonly spanId?: string;
  readonly userId?: string;
  readonly [key: string]: unknown;
}

export interface Logger {
  debug(message: string, context?: Partial<LogContext>): void;
  info(message: string, context?: Partial<LogContext>): void;
  warn(message: string, context?: Partial<LogContext>): void;
  error(message: string, error?: Error, context?: Partial<LogContext>): void;
  fatal(message: string, error?: Error, context?: Partial<LogContext>): void;
  child(context: Partial<LogContext>): Logger;
}

/** Stub implementation — replaced by pino in WO-020. */
export class ConsoleLogger implements Logger {
  constructor(private readonly context: LogContext) {}

  debug(message: string, context?: Partial<LogContext>): void {
    console.debug(JSON.stringify({ level: 'debug', message, ...this.context, ...context }));
  }

  info(message: string, context?: Partial<LogContext>): void {
    console.info(JSON.stringify({ level: 'info', message, ...this.context, ...context }));
  }

  warn(message: string, context?: Partial<LogContext>): void {
    console.warn(JSON.stringify({ level: 'warn', message, ...this.context, ...context }));
  }

  error(message: string, error?: Error, context?: Partial<LogContext>): void {
    console.error(
      JSON.stringify({
        level: 'error',
        message,
        error: error?.message,
        stack: error?.stack,
        ...this.context,
        ...context,
      }),
    );
  }

  fatal(message: string, error?: Error, context?: Partial<LogContext>): void {
    console.error(
      JSON.stringify({
        level: 'fatal',
        message,
        error: error?.message,
        stack: error?.stack,
        ...this.context,
        ...context,
      }),
    );
  }

  child(context: Partial<LogContext>): Logger {
    return new ConsoleLogger({ ...this.context, ...context } as LogContext);
  }
}

export function createLogger(context: LogContext): Logger {
  return new ConsoleLogger(context);
}
