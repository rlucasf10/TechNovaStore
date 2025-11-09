module.exports = {
  ...require('../../../jest.config.base.js'),
  
  // Service-specific configuration
  roots: ['<rootDir>/test'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
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