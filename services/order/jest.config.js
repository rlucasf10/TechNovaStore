module.exports = {
  ...require('../../jest.config.base.js'),
  
  // Service-specific configuration
  roots: ['<rootDir>/src'],
  
  // Use test-specific tsconfig if it exists
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json'
    }
  }
};