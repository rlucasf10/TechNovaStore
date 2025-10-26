import { Sequelize } from 'sequelize';
import { logger } from '../utils/logger';

// Test database configuration using SQLite in memory
export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false, // Disable logging for tests
  define: {
    timestamps: true,
    underscored: true,
  },
});

export const connectTestDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('Connected to test database (SQLite in memory)');
    
    // Sync models (create tables)
    await sequelize.sync({ force: true });
    logger.info('Test database synchronized');
    
  } catch (error) {
    logger.error('Failed to connect to test database:', error);
    throw error;
  }
};

export const closeTestDatabase = async (): Promise<void> => {
  try {
    await sequelize.close();
    logger.info('Test database connection closed');
  } catch (error) {
    logger.error('Error closing test database:', error);
  }
};