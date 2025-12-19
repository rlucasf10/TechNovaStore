/**
 * Cliente de Redis compartido para el API Gateway
 * 
 * Proporciona una instancia singleton de Redis para:
 * - Almacenamiento de tokens CSRF
 * - Rate limiting
 * - Caché de sesiones
 */

import Redis from 'ioredis';
import { logger } from './logger';

// Validación de REDIS_PASSWORD
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

if (!REDIS_PASSWORD) {
  logger.error('CRITICAL: REDIS_PASSWORD environment variable is not set');
  throw new Error('REDIS_PASSWORD must be configured. Application cannot start.');
}

// Configuración de Redis desde variables de entorno
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
};

// Instancia singleton de Redis
let redisClient: Redis | null = null;

/**
 * Obtiene la instancia de Redis (singleton)
 */
export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(REDIS_CONFIG);

    redisClient.on('connect', () => {
      logger.info('✅ Redis connected successfully', {
        host: REDIS_CONFIG.host,
        port: REDIS_CONFIG.port,
        db: REDIS_CONFIG.db,
      });
    });

    redisClient.on('error', (error) => {
      logger.error('❌ Redis connection error:', error);
    });

    redisClient.on('close', () => {
      logger.warn('⚠️ Redis connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.info('🔄 Redis reconnecting...');
    });
  }

  return redisClient;
};

/**
 * Cierra la conexión de Redis (para testing y shutdown)
 */
export const closeRedisConnection = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  }
};

/**
 * Verifica si Redis está conectado
 */
export const isRedisConnected = (): boolean => {
  return redisClient?.status === 'ready';
};
