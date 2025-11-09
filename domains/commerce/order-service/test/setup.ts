/**
 * Test setup for order-service
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.POSTGRES_HOST = 'postgresql';
process.env.POSTGRES_PORT = '5432';
process.env.POSTGRES_DB = 'technovastore';
process.env.POSTGRES_USER = 'admin';
process.env.POSTGRES_PASSWORD = 'password';

// Increase timeout for tests that may take longer
jest.setTimeout(30000);
