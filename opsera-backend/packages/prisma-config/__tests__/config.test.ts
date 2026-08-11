import {
  getPrismaOptions,
  DEFAULT_PRISMA_OPTIONS,
  PRODUCTION_PRISMA_OPTIONS,
} from '../src/index.js';

describe('@opsera/prisma-config — module resolution', () => {
  it('returns default options in non-production environments', () => {
    const original = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'test';
    const opts = getPrismaOptions();
    expect(opts).toEqual(DEFAULT_PRISMA_OPTIONS);
    process.env['NODE_ENV'] = original;
  });

  it('returns production options when NODE_ENV=production', () => {
    const original = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'production';
    const opts = getPrismaOptions();
    expect(opts).toEqual(PRODUCTION_PRISMA_OPTIONS);
    expect(opts.connectionPoolMax).toBeGreaterThan(DEFAULT_PRISMA_OPTIONS.connectionPoolMax);
    process.env['NODE_ENV'] = original;
  });
});
