import { PostgresHealthIndicator } from '../src/indicators/postgres.health-indicator.js';
import { RedisHealthIndicator } from '../src/indicators/redis.health-indicator.js';
import { KafkaHealthIndicator } from '../src/indicators/kafka.health-indicator.js';
import { HealthCheckError } from '@nestjs/terminus';

describe('PostgresHealthIndicator', () => {
  it('returns healthy when SELECT 1 succeeds', async () => {
    const mockPrisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
    const indicator = new PostgresHealthIndicator(mockPrisma);
    const result = await indicator.isHealthy('postgres');
    expect(result['postgres']?.['status']).toBe('up');
  });

  it('throws HealthCheckError when query fails', async () => {
    const mockPrisma = {
      $queryRaw: jest.fn().mockRejectedValue(new Error('Connection refused')),
    };
    const indicator = new PostgresHealthIndicator(mockPrisma);
    await expect(indicator.isHealthy('postgres')).rejects.toThrow(HealthCheckError);
  });

  it('throws HealthCheckError on timeout', async () => {
    const mockPrisma = {
      $queryRaw: jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10_000)),
      ),
    };
    const indicator = new PostgresHealthIndicator(mockPrisma);
    await expect(indicator.isHealthy('postgres')).rejects.toThrow(HealthCheckError);
  }, 10_000);
});

describe('RedisHealthIndicator', () => {
  it('returns healthy when PING returns PONG', async () => {
    const mockRedis = { ping: jest.fn().mockResolvedValue('PONG') };
    const indicator = new RedisHealthIndicator(mockRedis);
    const result = await indicator.isHealthy('redis');
    expect(result['redis']?.['status']).toBe('up');
  });

  it('throws HealthCheckError when PING fails', async () => {
    const mockRedis = {
      ping: jest.fn().mockRejectedValue(new Error('Redis unreachable')),
    };
    const indicator = new RedisHealthIndicator(mockRedis);
    await expect(indicator.isHealthy('redis')).rejects.toThrow(HealthCheckError);
  });

  it('throws HealthCheckError on unexpected PING response', async () => {
    const mockRedis = { ping: jest.fn().mockResolvedValue('ERR') };
    const indicator = new RedisHealthIndicator(mockRedis);
    await expect(indicator.isHealthy('redis')).rejects.toThrow(HealthCheckError);
  });
});

describe('KafkaHealthIndicator', () => {
  it('returns healthy with broker count when cluster is reachable', async () => {
    const mockAdmin = {
      describeCluster: jest.fn().mockResolvedValue({ brokers: [{}, {}, {}] }),
    };
    const indicator = new KafkaHealthIndicator(mockAdmin);
    const result = await indicator.isHealthy('kafka');
    expect(result['kafka']?.['status']).toBe('up');
    expect(result['kafka']?.['brokerCount']).toBe(3);
  });

  it('throws HealthCheckError when broker is unreachable', async () => {
    const mockAdmin = {
      describeCluster: jest.fn().mockRejectedValue(new Error('Broker unavailable')),
    };
    const indicator = new KafkaHealthIndicator(mockAdmin);
    await expect(indicator.isHealthy('kafka')).rejects.toThrow(HealthCheckError);
  });
});
