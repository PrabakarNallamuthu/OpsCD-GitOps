import type { Config } from 'jest';
const config: Config = {
  displayName: '@opsera/shared',
  rootDir: '.',
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.spec.ts'],
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
    '^@opsera/shared$': '<rootDir>/../shared/src/index.ts',
    '^@opsera/logging$': '<rootDir>/../logging/src/index.ts',
    '^@opsera/kafka$': '<rootDir>/../kafka/src/index.ts',
    '^@opsera/prisma-config$': '<rootDir>/../prisma-config/src/index.ts',
  },
};
export default config;
