module.exports = {
  ...require('../../jest.config.base.js'),
  
  // Service-specific configuration
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  testTimeout: 30000, // Longer timeout for AI service tests
};