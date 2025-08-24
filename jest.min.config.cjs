module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  maxWorkers: 1,
  cache: true,
  bail: 1,
  verbose: false,
  setupFilesAfterEnv: [],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: true,
        isolatedModules: true,
        diagnostics: false,
        tsconfig: {
          jsx: 'react-jsx',
          target: 'ES2020',
          module: 'ESNext',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$))'],
  testMatch: ['<rootDir>/src/lib/__tests__/pointsMetrics.test.ts'],
  collectCoverage: false,
};
