/**
 * WO-038: Verification idempotency — prevents duplicate verification runs
 */
import { Injectable, Logger } from '@nestjs/common';

interface IdempotencyEntry {
  key: string;
  result: unknown;
  createdAt: number;
  ttlMs: number;
}

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);
  private readonly store = new Map<string, IdempotencyEntry>();
  private readonly DEFAULT_TTL_MS = 24 * 3600 * 1000; // 24h

  buildKey(operation: string, resourceId: string, version?: string): string {
    return [operation, resourceId, version].filter(Boolean).join(':');
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() - entry.createdAt > entry.ttlMs) {
      this.store.delete(key);
      return null;
    }

    this.logger.debug(`Idempotency hit: ${key}`);
    return entry.result as T;
  }

  set(key: string, result: unknown, ttlMs = this.DEFAULT_TTL_MS): void {
    this.store.set(key, { key, result, createdAt: Date.now(), ttlMs });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }
}
