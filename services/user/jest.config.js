module.exports = {
  ...require('../../jest.config.base.js'),
  
  // Service-specific configuration
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
};