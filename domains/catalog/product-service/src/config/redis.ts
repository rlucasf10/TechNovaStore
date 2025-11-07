import { createClient } from 'redis';
import { config } from '@technovastore/shared-config';
import { logger } from '../utils/logger';

export const redisClient = createClient({
  socket: {
    host: config.redis.host,
    port: config.redis.port,
  },
  password: config.redis.password,
  database: config.redis.db,
});

export const connectRedis = async () => {
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