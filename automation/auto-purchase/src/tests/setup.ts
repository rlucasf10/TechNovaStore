// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Mock console methods to reduce noise during tests
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error
};

beforeAll(() => {
  // Only show errors during tests
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = originalConsole.error;
});

afterAll(() => {
  // Restore console methods
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});