import { Sequelize } from 'sequelize';
import { config } from '@technovastore/shared-config';

export const sequelize = new Sequelize({
  host: config.postgresql.host,
  port: config.postgresql.port,
  database: config.postgresql.database,
  username: config.postgresql.username,
  password: config.postgresql.password,
  dialect: 'postgres',
  pool: config.postgresql.pool,
  dialectOptions: config.postgresql.dialectOptions,
  logging: config.nodeEnv === 'development' ? console.log : false,
});

export const connectPostgreSQL = async (): Promise<Sequelize> => {
  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL');
    
    // Sync models (create tables if they don't exist, but don't alter existing ones)
    await sequelize.sync({ force: false, alter: false });
    console.log('Database synchronized');
    
    return sequelize;
  } catch (error) {
    console.error('Failed to connect to PostgreSQL:', error);
    throw error;
  }
};
