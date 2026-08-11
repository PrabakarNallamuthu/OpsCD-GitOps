import type { Config } from 'jest';

const config: Config = {
  projects: [
    '<rootDir>/packages/logging',
    '<rootDir>/packages/kafka',
    '<rootDir>/packages/health',
    '<rootDir>/packages/validation',
    '<rootDir>/packages/test-utils',
    '<rootDir>/services/release-service',
    '<rootDir>/services/risk-engine',
    '<rootDir>/services/policy-engine',
    '<rootDir>/services/audit-service',
    '<rootDir>/services/verification-service',
    '<rootDir>/services/analytics-service',
    '<rootDir>/services/auth-service',
    '<rootDir>/services/bff-service',
  ],
  collectCoverage: false,
  coverageReporters: ['lcov', 'text-summary', 'json'],
  coverageDirectory: '<rootDir>/coverage',
};

export default config;
