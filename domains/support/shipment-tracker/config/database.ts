import { Sequelize } from 'sequelize';
import { config } from '@technovastore/shared-config';
import { logger } from '../shared/utils/logger';

/**
 * Función de logging estructurado para queries SQL
 * Solo activa en desarrollo, usa logger.debug con contexto estructurado
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
const sqlLogger = (sql: string, timing?: number | object): void => {
  // Limitar longitud del SQL para no saturar logs
  const truncatedSql = sql.length > 200 ? `${sql.substring(0, 200)}...` : sql;
  
  // Extraer el tiempo de ejecución si está disponible
  let executionTime: string | undefined;
  if (typeof timing === 'number') {
    executionTime = `${timing}ms`;
  }
  
  logger.debug('SQL Query', {
    sql: truncatedSql,
    executionTime,
    service: 'shipment-tracker',
    component: 'sequelize'
  });
};

export const sequelize = new Sequelize({
  host: config.postgresql.host,
  port: config.postgresql.port,
  database: config.postgresql.database,
  username: config.postgresql.username,
  password: config.postgresql.password,
  dialect: 'postgres',
  pool: config.postgresql.pool,
  dialectOptions: config.postgresql.dialectOptions,
  // Usar logger estructurado en desarrollo, desactivado en producción
  // Requirements: 8.1, 8.4
  logging: config.nodeEnv === 'development' ? sqlLogger : false,
});

export const connectPostgreSQL = async (): Promise<Sequelize> => {
  try {
    await sequelize.authenticate();
    logger.info('Connected to PostgreSQL', {
      service: 'shipment-tracker',
      component: 'database'
    });
    
    // Sync models (create tables if they don't exist, but don't alter existing ones)
    await sequelize.sync({ force: false, alter: false });
    logger.info('Database synchronized', {
      service: 'shipment-tracker',
      component: 'database'
    });
    
    return sequelize;
  } catch (error) {
    logger.error('Failed to connect to PostgreSQL', {
      error: error instanceof Error ? error.message : 'Unknown error',
      service: 'shipment-tracker',
      component: 'database'
    });
    throw error;
  }
};
