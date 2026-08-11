import { W3C_TRACEPARENT_PATTERN } from './patterns.js';

expect.extend({
  toHaveCorrelationId(received: unknown) {
    const obj = received as Record<string, unknown>;
    const correlationId = obj['correlation_id'] ?? obj['correlationId'];

    if (typeof correlationId !== 'string' || correlationId.length === 0) {
      return {
        message: () =>
          `expected object to have a non-empty correlation_id, but got: ${JSON.stringify(correlationId)}`,
        pass: false,
      };
    }

    return {
      message: () => `expected object NOT to have correlation_id`,
      pass: true,
    };
  },

  toMatchAuditRecord(received: unknown) {
    const record = received as Record<string, unknown>;
    const requiredFields = [
      'id',
      'event_type',
      'actor_id',
      'resource_type',
      'resource_id',
      'correlation_id',
      'created_at',
    ];

    const missing = requiredFields.filter((f) => !record[f]);

    if (missing.length > 0) {
      return {
        message: () =>
          `expected audit record to have fields: ${missing.join(', ')}`,
        pass: false,
      };
    }

    return {
      message: () => `expected record NOT to be a valid audit record`,
      pass: true,
    };
  },

  toBeValidTraceparent(received: unknown) {
    const pass =
      typeof received === 'string' && W3C_TRACEPARENT_PATTERN.test(received);

    return {
      message: () =>
        pass
          ? `expected "${String(received)}" NOT to be a valid W3C traceparent`
          : `expected "${String(received)}" to match W3C traceparent format (00-{traceId}-{spanId}-{flags})`,
      pass,
    };
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveCorrelationId(): R;
      toMatchAuditRecord(): R;
      toBeValidTraceparent(): R;
    }
  }
}
