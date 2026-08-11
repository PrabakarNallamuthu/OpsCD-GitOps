"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KAFKA_TOPIC_PREFIX = exports.HEALTH_ENDPOINT = exports.MAX_PAGE_LIMIT = exports.DEFAULT_PAGE_LIMIT = exports.API_VERSION = void 0;
/** API version prefix used by all Opsera HTTP services. */
exports.API_VERSION = 'v1';
/** Default pagination limit when none is specified. */
exports.DEFAULT_PAGE_LIMIT = 20;
/** Maximum pagination limit to prevent runaway queries. */
exports.MAX_PAGE_LIMIT = 100;
/** Health endpoint path — used by K8s liveness and readiness probes. */
exports.HEALTH_ENDPOINT = '/health';
/** Kafka topic name prefix used by all services. */
exports.KAFKA_TOPIC_PREFIX = 'opsera.';
//# sourceMappingURL=index.js.map