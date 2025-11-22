import mongoose from 'mongoose';
import { connectRedis, redisClient } from './shared/infrastructure/redis';
import { Product } from './shared/types/Product';

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/technovastore_test';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB for testing');
  
  // Crear índice de texto para búsquedas
  try {
    await Product.collection.createIndex({ name: 'text', description: 'text' });
    console.log('Text index created for Product search');
  } catch (error) {
    console.warn('Text index creation failed (may already exist):', error);
  }
  
  // Conectar a Redis para tests
  try {
    await connectRedis();
    console.log('Connected to Redis for testing');
  } catch (error) {
    console.warn('Redis connection failed, tests will run without cache:', error);
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  console.log('Disconnected from MongoDB');
  
  // Cerrar conexión de Redis
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
      console.log('Disconnected from Redis');
    }
  } catch (error) {
    console.warn('Redis disconnect failed:', error);
  }
});
