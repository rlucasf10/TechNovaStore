import { createClient, RedisClientType } from 'redis';
import { config } from '../../config';
import { logger } from './logger';

// Tipo del cliente Redis
type RedisClient = ReturnType<typeof createClient>;

// Cliente Redis para caché y mensajería
export const redisClient: RedisClient = createClient({
  socket: {
    host: config.redis.host,
    port: config.redis.port,
  },
  password: config.redis.password,
  database: config.redis.db,
});

// Función para conectar a Redis
export const connectRedis = async (): Promise<RedisClient> => {
  try {
    await redisClient.connect();
    logger.info('Connected to Redis');

    redisClient.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    redisClient.on('disconnect', () => {
      logger.warn('Redis disconnected');
    });

    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};