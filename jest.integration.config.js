module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/integration'],
  testMatch: ['**/*.integration.(test|spec).+(ts|tsx|js)'],
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
  coverageDirectory: 'coverage/integration',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Integration test setup
  globalSetup: '<rootDir>/tests/integration/globalSetup.ts',
  globalTeardown: '<rootDir>/tests/integration/globalTeardown.ts',
  setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.ts'],
  
  // Resource cleanup configuration for integration tests
  detectOpenHandles: true, // Always detect handles in integration tests
  forceExit: false, // Let cleanup system handle exit
  
  // Extended timeouts for integration tests
  testTimeout: process.env.CI ? 45000 : 30000,
  
  // Performance configuration for integration tests
  maxWorkers: process.env.CI ? 1 : 2, // Limit concurrency for integration tests
  
  // Mock configuration
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Logging configuration
  verbose: process.env.CI ? false : true,
  silent: false, // Keep some output for integration test debugging
  
  // CI-specific configuration
  ...(process.env.CI && {
    bail: 1, // Stop on first failure in CI
    collectCoverage: false, // Skip coverage for integration tests in CI
    reporters: ['default']
  }),
  
  // Environment variables for integration tests
  setupFiles: ['<rootDir>/tests/integration/env.ts']
};