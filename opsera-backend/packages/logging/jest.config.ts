import type { Config } from 'jest';

const config: Config = {
  displayName: process.env['npm_package_name'] ?? 'package',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        module: 'CommonJS',
        moduleResolution: 'node',
        esModuleInterop: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        strict: true,
      },
    }],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@opsera/shared(.*)$': '<rootDir>/../../packages/shared/src$1',
    '^@opsera/logging(.*)$': '<rootDir>/../../packages/logging/src$1',
    '^@opsera/kafka(.*)$': '<rootDir>/../../packages/kafka/src$1',
  },
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};

export default config;
