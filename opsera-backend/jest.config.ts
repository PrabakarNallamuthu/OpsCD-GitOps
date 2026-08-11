import type { Config } from 'jest';

const config: Config = {
  projects: [
    '<rootDir>/packages/shared/jest.config.ts',
    '<rootDir>/packages/logging/jest.config.ts',
    '<rootDir>/packages/kafka/jest.config.ts',
    '<rootDir>/packages/prisma-config/jest.config.ts',
    '<rootDir>/services/release-service/jest.config.ts',
    '<rootDir>/services/risk-engine/jest.config.ts',
    '<rootDir>/services/policy-engine/jest.config.ts',
    '<rootDir>/services/audit-service/jest.config.ts',
    '<rootDir>/services/verification-service/jest.config.ts',
    '<rootDir>/services/analytics-service/jest.config.ts',
    '<rootDir>/services/auth-service/jest.config.ts',
    '<rootDir>/services/bff-service/jest.config.ts',
  ],
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.spec.ts',
    '!**/*.test.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/jest.config.ts',
    '!**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      lines: 80,
      branches: 80,
      functions: 80,
      statements: 80,
    },
  },
};

export default config;
