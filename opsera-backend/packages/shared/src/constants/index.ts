/** API version prefix used by all Opsera HTTP services. */
export const API_VERSION = 'v1' as const;

/** Default pagination limit when none is specified. */
export const DEFAULT_PAGE_LIMIT = 20 as const;

/** Maximum pagination limit to prevent runaway queries. */
export const MAX_PAGE_LIMIT = 100 as const;

/** Health endpoint path — used by K8s liveness and readiness probes. */
export const HEALTH_ENDPOINT = '/health' as const;

/** Kafka topic name prefix used by all services. */
export const KAFKA_TOPIC_PREFIX = 'opsera.' as const;
