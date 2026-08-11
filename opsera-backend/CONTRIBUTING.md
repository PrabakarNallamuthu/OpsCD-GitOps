# Contributing to opsera-backend

## Monorepo Structure

```
opsera-backend/
├── packages/
│   ├── shared/          # @opsera/shared — types, DTOs, constants (zero internal deps)
│   ├── logging/         # @opsera/logging — structured JSON logger
│   ├── kafka/           # @opsera/kafka — producer/consumer abstractions
│   └── prisma-config/   # @opsera/prisma-config — shared Prisma client config
└── services/
    ├── release-service/ # port 3001 — release lifecycle management
    ├── risk-engine/     # port 3002 — AI risk scoring
    ├── policy-engine/   # port 3003 — policy rule evaluation
    ├── audit-service/   # port 3004 — immutable audit trail
    ├── verification-service/ # port 3005 — post-deploy verification
    ├── analytics-service/    # port 3006 — DORA metrics & analytics
    ├── auth-service/    # port 3007 — OIDC/SAML SSO, JWT, RBAC
    └── bff-service/     # port 3008 — BFF & WebSocket gateway (frontend-facing)
```

## Adding a New Service

1. Create `services/<service-name>/` with `package.json`, `tsconfig.json`, `jest.config.ts`.
2. Add `@opsera/shared` as a workspace dependency: `"@opsera/shared": "workspace:*"`.
3. Scaffold `src/main.ts`, `src/app.module.ts`, `src/app.controller.ts` following the existing pattern.
4. Add the jest config path to root `jest.config.ts` projects array.
5. Run `pnpm install && pnpm build && pnpm test` from root.

## Adding a New Shared Package

1. Create `packages/<name>/` with the same structure as `packages/shared/`.
2. Follow the dependency DAG: packages must NOT create circular dependencies.
   - `@opsera/shared` → no internal deps
   - `@opsera/logging` → depends on `@opsera/shared` only
   - `@opsera/kafka` → depends on `@opsera/shared` only
   - `@opsera/prisma-config` → depends on `@opsera/shared` only
3. Export everything from `src/index.ts`.

## Coding Standards

| Rule | Enforcement |
|---|---|
| No `any` types | ESLint `@typescript-eslint/no-explicit-any: error` |
| TypeScript strict mode | `tsconfig.json` `strict: true` |
| No unused variables | ESLint `no-unused-vars: error` |
| Consistent formatting | Prettier — run `pnpm format` |
| 80% test coverage | Jest coverage thresholds enforced in CI |

## Running Commands

```bash
# From opsera-backend/ root
pnpm install          # Install all workspace deps
pnpm build            # Build all packages + services
pnpm test             # Run all tests
pnpm test:coverage    # Run tests + generate coverage report
pnpm lint             # Lint all TypeScript files
pnpm format           # Format all files with Prettier
```
