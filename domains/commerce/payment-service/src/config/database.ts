import { Sequelize } from 'sequelize';
import { config } from '@technovastore/shared-config';
import { logger } from '../utils/logger';

export const sequelize = new Sequelize({
    host: config.postgresql.host,
    port: config.postgresql.port,
    database: config.postgresql.database,
    username: config.postgresql.username,
    password: config.postgresql.password,
    dialect: 'postgres',
    pool: config.postgresql.pool,
    dialectOptions: config.postgresql.dialectOptions,
    logging: (msg) => logger.debug(msg),
});

export const connectPostgreSQL = async (): Promise<Sequelize> => {
    try {
        await sequelize.authenticate();
        logger.info('Connected to PostgreSQL');

        await sequelize.sync({ force: false, alter: false });
        logger.info('Database synchronized');

        return sequelize;
    } catch (error) {
        logger.error('Failed to connect to PostgreSQL:', error);
        throw error;
    }
};
