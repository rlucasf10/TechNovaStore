/**
 * Jest Setup for Test Resource Cleanup System
 */

// Global test timeout
jest.setTimeout(10000);

// Setup global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Mock console methods in tests to reduce noise
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeEach(() => {
  // Suppress expected warnings in tests
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  // Restore console methods
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});