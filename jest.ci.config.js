/**
 * Jest Configuration for CI/CD Environments
 * Optimized for reliability and resource management in automated environments
 */

const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,
  
  // CI-specific overrides
  bail: 1, // Stop on first failure
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Resource management for CI
  maxWorkers: 2, // Limit workers to avoid resource conflicts
  testTimeout: 25000, // Extended timeout for CI environment
  detectOpenHandles: true, // Always detect handles in CI
  forceExit: false, // Let cleanup system handle exit
  
  // Logging configuration
  verbose: false,
  silent: true,
  
  // Reporters for CI
  reporters: ['default'],
  
  // Coverage configuration
  coverageReporters: ['text', 'lcov', 'cobertura', 'json-summary'],
  collectCoverageFrom: [
    ...baseConfig.collectCoverageFrom,
    '!**/*.test.ts',
    '!**/*.spec.ts',
    '!**/test/**',
    '!**/tests/**'
  ],
  
  // Environment variables for CI
  setupFiles: ['<rootDir>/tests/ci-env.ts']
};