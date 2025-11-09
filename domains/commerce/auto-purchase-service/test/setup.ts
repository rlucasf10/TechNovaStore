// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Increase timeout for tests
jest.setTimeout(30000);