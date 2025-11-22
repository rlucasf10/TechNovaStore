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
    '/coverage/'
  ],
  testTimeout: 30000, // Longer timeout for AI service tests
  forceExit: true, // Force exit after tests complete to prevent hanging
  detectOpenHandles: false, // Disable open handles detection for faster execution
};