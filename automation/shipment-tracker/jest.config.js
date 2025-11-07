module.exports = {
  ...require('../../jest.config.base.js'),
  
  // Service-specific configuration
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testTimeout: 30000, // Longer timeout for external API calls
};