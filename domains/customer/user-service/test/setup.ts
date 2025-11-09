import { sequelize } from '../src/config/database';
// Import all models to ensure they are registered with Sequelize
import '../src/models/User';
import '../src/models/RefreshToken';
import '../src/models/PasswordReset';

// Test setup file
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
// Use PostgreSQL in Docker for tests
process.env.DB_HOST = process.env.DB_HOST || 'postgresql';
process.env.DB_NAME = process.env.DB_NAME || 'technovastore_test';
process.env.DB_USER = process.env.DB_USER || 'admin';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'password';
process.env.DB_PORT = process.env.DB_PORT || '5432';

// Setup database connection before all tests
beforeAll(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync database schema (create tables if they don't exist)
    // No usar force: true para evitar conflictos con ENUMs
    await sequelize.sync({ alter: false });
    console.log('Database schema synchronized.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
});

// Clean up after all tests
afterAll(async () => {
  try {
    await sequelize.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
});

// Clean up data after each test
afterEach(async () => {
  try {
    // Truncate all tables
    await sequelize.truncate({ cascade: true, restartIdentity: true });
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
});