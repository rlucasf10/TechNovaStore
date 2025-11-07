module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/e2e-tests/integration-tests'],
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
  globalSetup: '<rootDir>/e2e-tests/integration-tests/jest-global-setup.ts',
  globalTeardown: '<rootDir>/e2e-tests/integration-tests/jest-global-teardown.ts',
  setupFilesAfterEnv: ['<rootDir>/e2e-tests/integration-tests/jest-setup.ts'],
  
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
  setupFiles: ['<rootDir>/e2e-tests/integration-tests/environment.ts']
};