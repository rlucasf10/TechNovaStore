module.exports = {
  ...require('../../jest.config.base.js'),
  
  // Shared utils specific configuration
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/src/test/jestSetup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/examples/**', // Exclude example files
  ],
};