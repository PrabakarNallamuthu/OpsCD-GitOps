import { AsyncLocalStorage } from 'async_hooks';

export interface CorrelationContext {
  correlationId: string;
  actorId?: string;
  requestId?: string;
  serviceName?: string;
}

const storage = new AsyncLocalStorage<CorrelationContext>();

export function getCorrelationContext(): CorrelationContext | undefined {
  return storage.getStore();
}

export function getCorrelationId(): string {
  return storage.getStore()?.correlationId ?? 'unknown';
}

export function runWithContext<T>(
  context: CorrelationContext,
  fn: () => T,
): T {
  return storage.run(context, fn);
}

export function runWithContextAsync<T>(
  context: CorrelationContext,
  fn: () => Promise<T>,
): Promise<T> {
  return storage.run(context, fn);
}
