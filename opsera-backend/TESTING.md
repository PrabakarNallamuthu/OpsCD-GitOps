# Opsera Backend — Testing Guide

## Running Tests

```bash
# Run all tests across the monorepo
pnpm jest

# Run with coverage (enforces 80% threshold)
pnpm jest --coverage

# Run a single package
pnpm --filter @opsera/logging jest

# Run a specific service
pnpm --filter release-service jest --watch
```

## Coverage Gates

Coverage thresholds are enforced at **80%** for branches, functions, lines,
and statements per package/service. The CI pipeline (`forge/scripts/build-node.sh`)
will fail if any threshold is not met.

To check coverage locally:

```bash
pnpm jest --coverage --coverageReporters=text
```

## Shared Test Utilities (`@opsera/test-utils`)

| Export | Purpose |
|--------|---------|
| `createMockPrismaClient()` | Auto-mocked Prisma delegates with `jest.fn()` |
| `createMockKafkaProducer()` | Captures emitted Kafka events for assertion |
| `generateTestJwt(claims)` | Creates signed HS256 JWT for test authentication |
| `toHaveCorrelationId()` | Custom Jest matcher for correlation ID presence |
| `toMatchAuditRecord()` | Custom Jest matcher for audit record structure |
| `toBeValidTraceparent()` | Custom Jest matcher for W3C trace context |

### Example — service unit test

```typescript
import { createMockPrismaClient, createMockKafkaProducer } from '@opsera/test-utils';
import { Test } from '@nestjs/testing';
import { ReleaseService } from '../src/release.service';

describe('ReleaseService', () => {
  let service: ReleaseService;
  const mockPrisma = createMockPrismaClient();
  const { producer: mockKafka, expectEventEmitted } = createMockKafkaProducer();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReleaseService,
        { provide: 'PRISMA', useValue: mockPrisma },
        { provide: 'KAFKA_PRODUCER', useValue: mockKafka },
      ],
    }).compile();
    service = module.get(ReleaseService);
  });

  it('publishes releases.created event on creation', async () => {
    mockPrisma.release.create.mockResolvedValue({ id: 'test-id', name: 'v1.0' });
    await service.createRelease({ name: 'v1.0', target_environment: 'env-id', changes: ['commit-abc'] });
    expectEventEmitted('releases-created', { type: 'RELEASE_CREATED' });
  });
});
```

## Adding Tests to a New Service

1. Create `jest.config.ts` in the service root using the standard template from any existing service.
2. Add `"test"` script to `package.json`: `"jest --passWithNoTests"`.
3. Write unit tests in `test/` and integration tests in `test/integration/`.
4. Ensure coverage threshold is met before submitting a PR.
