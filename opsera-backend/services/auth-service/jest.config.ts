import type { Config } from 'jest';
const config: Config = {
  displayName: '@opsera/auth-service',
  rootDir: '.',
  testMatch: ['**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        module: 'CommonJS',
        moduleResolution: 'Node',
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        strict: true,
        esModuleInterop: true,
      },
      diagnostics: { ignoreCodes: [151002] },
    }],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@opsera/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '^@opsera/logging$': '<rootDir>/../../packages/logging/src/index.ts',
    '^@opsera/kafka$': '<rootDir>/../../packages/kafka/src/index.ts',
  },
};
export default config;
