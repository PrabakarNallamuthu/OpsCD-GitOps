import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type Redis from 'ioredis';
import { createHash } from 'crypto';

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
  attemptCount?: number;
}

const MAX_ATTEMPTS = parseInt(process.env['RATE_LIMIT_MAX_ATTEMPTS'] ?? '10', 10);
const WINDOW_SECS = parseInt(process.env['RATE_LIMIT_WINDOW_SECONDS'] ?? '300', 10);
const LOCKOUT_SECS = parseInt(process.env['RATE_LIMIT_LOCKOUT_SECONDS'] ?? '1800', 10);

// Lua script: atomic INCR + conditional EXPIRE + lockout check
const RATE_LIMIT_LUA = `
local key = KEYS[1]
local lockout_key = KEYS[2]
local max = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local lockout = tonumber(ARGV[3])

-- Check if already locked out
if redis.call('EXISTS', lockout_key) == 1 then
  local ttl = redis.call('TTL', lockout_key)
  return {-1, ttl}
end

-- Increment counter
local count = redis.call('INCR', key)
if count == 1 then
  redis.call('EXPIRE', key, window)
end

-- Check threshold
if count >= max then
  redis.call('SET', lockout_key, '1', 'EX', lockout)
  redis.call('DEL', key)
  return {-1, lockout}
end

return {count, 0}
`;

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async checkAndRecord(ipAddress: string): Promise<RateLimitResult> {
    const ipHash = this.hashIp(ipAddress);
    const counterKey = `ratelimit:auth:${ipHash}`;
    const lockoutKey = `ratelimit:lockout:${ipHash}`;

    try {
      const result = await this.redis.eval(
        RATE_LIMIT_LUA,
        2,
        counterKey,
        lockoutKey,
        MAX_ATTEMPTS.toString(),
        WINDOW_SECS.toString(),
        LOCKOUT_SECS.toString(),
      ) as [number, number];

      const [count, retryAfter] = result;

      if (count === -1) {
        this.logger.warn(`Rate limit enforced for IP hash ${ipHash.slice(0, 8)}..., retry after ${retryAfter}s`);
        return { allowed: false, retryAfterSeconds: retryAfter };
      }

      return { allowed: true, attemptCount: count };
    } catch (err) {
      // Fail-open: Redis unavailable should not block authentication
      this.logger.error(`Rate limit Redis unavailable — failing open: ${(err as Error).message}`);
      return { allowed: true };
    }
  }

  async recordSuccess(ipAddress: string): Promise<void> {
    // Intentionally not resetting counter on success (PCI-DSS requirement)
    // Attackers cannot reset counter with stolen valid credentials
    void ipAddress;
  }

  private hashIp(ip: string): string {
    return createHash('sha256').update(ip).digest('hex');
  }
}
