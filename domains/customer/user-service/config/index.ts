/**
 * Configuración del User Service
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
  // Puerto del servicio
  port: parseInt(process.env.PORT || '3003', 10),

  // Entorno
  nodeEnv: process.env.NODE_ENV || 'development',

  // PostgreSQL
  postgresql: {
    host: process.env.POSTGRES_HOST || 'postgresql',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'technovastore',
    username: process.env.POSTGRES_USER || 'postgres',
    password: POSTGRES_PASSWORD,
    pool: {
      max: 20,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      ssl: process.env.POSTGRES_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false,
      } : false,
    },
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '1', 10),
  },

  // JWT
  jwt: {
    secret: JWT_SECRET,
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // OAuth
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackUrl: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback',
    },
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },

  // Seguridad
  security: {
    bcryptRounds: 10,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutos
  },

  // Email (para notificaciones)
  email: {
    from: process.env.EMAIL_FROM || 'noreply@technovastore.com',
  },
};

export default config;
