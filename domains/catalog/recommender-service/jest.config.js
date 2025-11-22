module.exports = {
  ...require('../../../jest.config.base.js'),
  
  // Service-specific configuration
  roots: ['<rootDir>'],
  testMatch: [
    '**/*.test.ts',
    '**/*.spec.ts'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/src/',
    '/dist/',
    '/test/'
  ],
  testTimeout: 30000, // Longer timeout for ML operations
  forceExit: true, // Force exit after tests complete to prevent hanging
  detectOpenHandles: false, // Disable open handles detection for faster execution
};