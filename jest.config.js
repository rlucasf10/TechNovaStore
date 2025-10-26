module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/services', '<rootDir>/automation', '<rootDir>/ai-services', '<rootDir>/api-gateway', '<rootDir>/shared', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/tests/integration/',
    '<rootDir>/node_modules/',
    '<rootDir>/frontend/e2e/',
    '<rootDir>/frontend/playwright-report/',
    '<rootDir>/frontend/test-results/',
    '/dist/',
    '/build/'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'services/**/*.{ts,tsx}',
    'automation/**/*.{ts,tsx}',
    'ai-services/**/*.{ts,tsx}',
    'api-gateway/src/**/*.{ts,tsx}',
    'shared/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/*.interface.ts',
    '!**/*.type.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Global setup and teardown
  globalSetup: '<rootDir>/tests/globalSetup.ts',
  globalTeardown: '<rootDir>/tests/globalTeardown.ts',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Resource cleanup configuration
  detectOpenHandles: process.env.CI === 'true',
  forceExit: false, // Let our cleanup system handle exit gracefully
  
  // Timeout configuration
  testTimeout: process.env.CI ? 20000 : 15000,
  
  // Performance configuration
  maxWorkers: process.env.CI ? 2 : '50%',
  
  // Mock configuration
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Logging
  verbose: process.env.CI ? false : true,
  silent: process.env.CI === 'true',
  
  // CI-specific configuration
  ...(process.env.CI && {
    bail: 1, // Stop on first failure in CI
    collectCoverage: true,
    coverageThreshold: {
      global: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70
      }
    }
  })
};