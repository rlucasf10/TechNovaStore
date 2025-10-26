// Test setup file
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DB_HOST = ':memory:';
process.env.DB_NAME = 'test';
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = 'test';
process.env.DB_PORT = '5432';