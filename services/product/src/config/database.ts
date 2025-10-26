import mongoose from 'mongoose';
import { config } from '@technovastore/shared-config';
import { logger } from '../utils/logger';

export const connectMongoDB = async (): Promise<typeof mongoose> => {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    logger.info('Connected to MongoDB');
    
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    return mongoose;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};