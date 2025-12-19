/**
 * Configuración del Ticket Service
 * 
 * SEGURIDAD: JWT_SECRET es OBLIGATORIO y debe configurarse en variables de entorno.
 * La aplicación fallará al iniciar si no está configurado correctamente.
 */

import { logger } from '../shared/utils/logger';

// ✅ SEGURIDAD: JWT_SECRET es OBLIGATORIO - no se permite valor por defecto
const JWT_SECRET = process.env.JWT_SECRET;

// Validación de configuración de seguridad al cargar el módulo
if (!JWT_SECRET) {
  logger.error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not set');
  logger.error('JWT_SECRET is required for secure authentication');
  logger.error('Please set JWT_SECRET in your environment or .env file');
  logger.error('Example: JWT_SECRET=your-super-secret-key-at-least-32-characters');
  throw new Error('JWT_SECRET must be configured. Application cannot start without a valid JWT secret.');
}

if (JWT_SECRET.length < 32) {
  logger.warn('WARNING: JWT_SECRET is shorter than 32 characters');
  logger.warn('For production, use a secret of at least 32 characters for adequate security');
}

export const config = {
  // Puerto del servicio
  port: parseInt(process.env.PORT || '3012', 10),

  // Entorno
  nodeEnv: process.env.NODE_ENV || 'development',

  // PostgreSQL - ✅ SEGURIDAD: password validado en database.ts, sin valor por defecto
  postgresql: {
    host: process.env.POSTGRES_HOST || 'postgresql',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'technovastore',
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD, // OBLIGATORIO - validado en database.ts
  },

  // JWT - ✅ SEGURIDAD: Secreto validado al inicio, sin valor por defecto
  jwt: {
    secret: JWT_SECRET,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

export default config;
