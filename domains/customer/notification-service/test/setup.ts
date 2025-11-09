/**
 * Test setup for notification-service
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';

// Mock console methods to reduce noise in tests (optional)
// Uncomment if you want to suppress console output during tests
/*
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
*/
