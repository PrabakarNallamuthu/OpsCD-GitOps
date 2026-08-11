# Test Fixtures — Convention Guide

This directory holds shared test fixtures used across all Opsera backend services and packages.

## Conventions

### JSON Fixtures
Static JSON files represent canonical domain object shapes (e.g., a valid Release, a RiskAssessment result).

```
test/fixtures/
  releases/
    valid-release.json        # A fully-populated Release object
    release-in-progress.json  # A Release with status=in_progress
  risk/
    assessment-result.json    # A completed RiskAssessment with all 5 scores
```

### Factory Functions
For dynamic test objects, use factory functions exported from `src/__tests__/factories/`:

```ts
// Example factory
export function makeRelease(overrides?: Partial<Release>): Release {
  return {
    id: 'rel-test-001',
    title: 'Test Release',
    status: 'pending',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}
```

### Rules
- Fixtures must be **deterministic** — no `Date.now()`, no `Math.random()` inline.
- Factory functions must accept `Partial<T>` overrides to allow per-test customization.
- Never import production database clients or external services in fixture files.
- If a fixture evolves (type change), update all usages — fixtures are canonical truth for test data.
