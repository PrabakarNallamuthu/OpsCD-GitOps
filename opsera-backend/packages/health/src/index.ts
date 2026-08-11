export { HealthController, setShuttingDown } from './health.controller.js';
export { PostgresHealthIndicator, type PrismaClient } from './indicators/postgres.health-indicator.js';
export { RedisHealthIndicator, type RedisClient } from './indicators/redis.health-indicator.js';
export { KafkaHealthIndicator, type KafkaAdmin } from './indicators/kafka.health-indicator.js';
export { registerGracefulShutdown, type ShutdownDependencies } from './graceful-shutdown.js';
