module.exports = {
  ...require('../../../jest.config.base.js'),
  
  // Service-specific configuration
  roots: ['<rootDir>/test'],
  globalSetup: '<rootDir>/test/globalSetup.ts',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  
  // Run tests serially to avoid database sync issues
  maxWorkers: 1,
};