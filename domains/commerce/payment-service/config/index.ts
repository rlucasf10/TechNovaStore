/**
 * Configuración centralizada del Payment Service
 */

import { logger } from '../shared/utils/logger';

// Validación de JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  logger.error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not set');
  throw new Error('JWT_SECRET must be configured. Application cannot start.');
}

if (JWT_SECRET.length < 32) {
  logger.warn('WARNING: JWT_SECRET is shorter than 32 characters. Consider using a longer secret for better security.');
}

// Validación de POSTGRES_PASSWORD
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;

if (!POSTGRES_PASSWORD) {
  logger.error('CRITICAL: POSTGRES_PASSWORD environment variable is not set');
  throw new Error('POSTGRES_PASSWORD must be configured. Application cannot start.');
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Order Service
  orderServiceUrl: process.env.ORDER_SERVICE_URL || 'http://order-service:3000',
  
  // Database
  database: {
    host: process.env.POSTGRES_HOST || 'postgresql',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'technovastore',
    username: process.env.POSTGRES_USER || 'technovastore',
    password: POSTGRES_PASSWORD,
  },
  
  // JWT
  jwt: {
    secret: JWT_SECRET,
  },
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // CORS
  corsOrigins: process.env.NODE_ENV === 'production'
    ? (process.env.CORS_ORIGINS || 'https://technovastore.com').split(',')
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3011'],
};
