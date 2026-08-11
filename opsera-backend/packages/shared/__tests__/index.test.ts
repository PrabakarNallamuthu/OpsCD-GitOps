import {
  buildPaginatedResponse,
  ok,
  err,
  isOk,
  isErr,
  API_VERSION,
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
  HEALTH_ENDPOINT,
  KAFKA_TOPIC_PREFIX,
} from '../src/index.js';

describe('@opsera/shared — module resolution', () => {
  describe('PaginationResponse builder', () => {
    it('calculates totalPages correctly', () => {
      const result = buildPaginatedResponse([1, 2, 3], 30, { page: 1, limit: 10 });
      expect(result.totalPages).toBe(3);
      expect(result.total).toBe(30);
      expect(result.data).toHaveLength(3);
    });

    it('rounds up totalPages on uneven division', () => {
      const result = buildPaginatedResponse([], 25, { page: 1, limit: 10 });
      expect(result.totalPages).toBe(3);
    });
  });

  describe('Result type helpers', () => {
    it('ok() creates a success result', () => {
      const result = ok('hello');
      expect(result.ok).toBe(true);
      expect(isOk(result)).toBe(true);
      expect(isErr(result)).toBe(false);
      if (isOk(result)) {
        expect(result.value).toBe('hello');
      }
    });

    it('err() creates a failure result', () => {
      const error = new Error('something failed');
      const result = err(error);
      expect(result.ok).toBe(false);
      expect(isOk(result)).toBe(false);
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toBe('something failed');
      }
    });
  });

  describe('constants', () => {
    it('exports expected constant values', () => {
      expect(API_VERSION).toBe('v1');
      expect(DEFAULT_PAGE_LIMIT).toBe(20);
      expect(MAX_PAGE_LIMIT).toBe(100);
      expect(HEALTH_ENDPOINT).toBe('/health');
      expect(KAFKA_TOPIC_PREFIX).toBe('opsera.');
    });
  });
});
