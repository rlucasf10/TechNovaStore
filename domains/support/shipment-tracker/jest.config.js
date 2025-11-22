module.exports = {
  ...require('../../../jest.config.base.js'),
  
  // Service-specific configuration - Screaming Architecture
  roots: [
    '<rootDir>/get-tracking-info',
    '<rootDir>/update-tracking-info',
    '<rootDir>/update-all-active-shipments',
    '<rootDir>/get-estimated-delivery',
    '<rootDir>/get-shipment-status',
    '<rootDir>/test'
  ],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testTimeout: 30000, // Longer timeout for external API calls
};