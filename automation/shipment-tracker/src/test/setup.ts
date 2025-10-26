// Test setup for Shipment Tracker
import { jest } from '@jest/globals';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3006';
process.env.POSTGRES_HOST = 'localhost';
process.env.POSTGRES_PORT = '5432';
process.env.POSTGRES_DB = 'technovastore_test';
process.env.POSTGRES_USER = 'test';
process.env.POSTGRES_PASSWORD = 'test';

// Mock API keys for testing
process.env.AMAZON_API_KEY = 'test_amazon_key';
process.env.ALIEXPRESS_API_KEY = 'test_aliexpress_key';
process.env.EBAY_API_KEY = 'test_ebay_key';
process.env.BANGGOOD_API_KEY = 'test_banggood_key';
process.env.NEWEGG_API_KEY = 'test_newegg_key';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});