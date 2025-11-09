module.exports = {
  ...require('../../../jest.config.base.js'),
  
  // Service-specific configuration
  roots: ['<rootDir>/test'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testTimeout: 30000,
};
