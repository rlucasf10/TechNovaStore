// Forzar NODE_ENV='test' para que los mocks usen delays cortos
process.env.NODE_ENV = 'test';

module.exports = {
  ...require('../../../jest.config.base.js'),
  
  // Service-specific configuration
  roots: [
    '<rootDir>/execute-purchase',
    '<rootDir>/orchestrate-purchase',
    '<rootDir>/select-provider',
    '<rootDir>/place-order',
    '<rootDir>/handle-confirmation',
    '<rootDir>/calculate-cost',
    '<rootDir>/process-orders-batch',
    '<rootDir>/get-purchase-status',
    '<rootDir>/cancel-purchase',
    '<rootDir>/get-processing-stats'
  ],
  testTimeout: 20000,
  
  // Module path mapping for shared packages
  moduleNameMapper: {
    '^@technovastore/shared-types$': '<rootDir>/../../../shared/domain/types/src',
    '^@technovastore/shared-models$': '<rootDir>/../../../shared/domain/models/src'
  },
  
  // Ignore specific paths
  testPathIgnorePatterns: [
    ...require('../../../jest.config.base.js').testPathIgnorePatterns,
    '<rootDir>/src/config/',
    '<rootDir>/src/services/__mocks__/'
  ],
  
  // Override for CI/automation environment
  verbose: false,
  silent: true,
  forceExit: true,
  detectOpenHandles: false
};