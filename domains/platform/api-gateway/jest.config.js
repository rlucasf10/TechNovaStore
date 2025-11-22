module.exports = {
  ...require('../../../jest.config.base.js'),
  
  // Service-specific configuration
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/logs/'],
  testTimeout: 15000, // Longer timeout for API Gateway tests
  transformIgnorePatterns: [
    'node_modules/(?!(isomorphic-dompurify|dompurify|parse5)/)',
  ],
};
