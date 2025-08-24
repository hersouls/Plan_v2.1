export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  maxWorkers: 1,
  coverageProvider: 'v8',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    // Path aliases to match tsconfig paths
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@contexts/(.*)$': '<rootDir>/src/contexts/$1',
    '^@pages/(.*)$': '<rootDir>/src/pages/$1',
    // CSS and asset mocks
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      'jest-transform-stub',
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          jsx: 'react-jsx',
        },
        isolatedModules: true,
        diagnostics: false,
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$))'],
  testMatch: [
    '<rootDir>/src/lib/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/hooks/__tests__/**/*.{ts,tsx}',
    '<rootDir>/tests/rules/**/*.test.ts',
  ],
  testPathIgnorePatterns: [],
  collectCoverageFrom: [
    'src/lib/points.ts',
    'src/lib/pointsMetrics.ts',
    'src/hooks/usePointHistory.ts',
    'src/hooks/useFavoriteGroups.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  // Increase test timeout for Firebase operations
  testTimeout: 10000,
  // Handle ES modules properly
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
};
