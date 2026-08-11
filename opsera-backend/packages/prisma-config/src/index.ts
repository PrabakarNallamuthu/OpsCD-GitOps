/**
 * @opsera/prisma-config — shared Prisma client configuration and
 * service-isolation conventions. Each service owns its own Prisma schema
 * under services/<name>/prisma/schema.prisma but all share the same
 * client options, error handling, and connection pool defaults from here.
 *
 * Full client implementation per-service wired in WO-019.
 */

/** Shared Prisma client options enforced across all services. */
export interface PrismaClientOptions {
  /** Log levels for Prisma query/info/warn/error events. */
  readonly log: Array<'query' | 'info' | 'warn' | 'error'>;
  /** Maximum connections in the pool per service instance. */
  readonly connectionPoolMax: number;
  /** Connection timeout in milliseconds. */
  readonly connectionTimeoutMs: number;
}

export const DEFAULT_PRISMA_OPTIONS: PrismaClientOptions = {
  log: ['warn', 'error'],
  connectionPoolMax: 10,
  connectionTimeoutMs: 10_000,
};

export const PRODUCTION_PRISMA_OPTIONS: PrismaClientOptions = {
  log: ['error'],
  connectionPoolMax: 20,
  connectionTimeoutMs: 5_000,
};

/** Returns options based on the current NODE_ENV. */
export function getPrismaOptions(): PrismaClientOptions {
  return process.env['NODE_ENV'] === 'production'
    ? PRODUCTION_PRISMA_OPTIONS
    : DEFAULT_PRISMA_OPTIONS;
}
