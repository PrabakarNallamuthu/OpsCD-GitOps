import {
  buildPaginationResponse,
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
    it('builds response with nextCursor and hasMore', () => {
      const result = buildPaginationResponse([1, 2, 3], 'next-token', 30);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('next-token');
      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(30);
    });

    it('sets hasMore=false when nextCursor is null', () => {
      const result = buildPaginationResponse([], null);
      expect(result.hasMore).toBe(false);
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
