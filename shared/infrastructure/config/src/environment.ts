import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server Configuration
  port: parseInt(process.env['PORT'] || '3000', 10),
  nodeEnv: process.env['NODE_ENV'] || 'development',
  
  // MongoDB Configuration
  mongodb: {
    uri: process.env['MONGODB_URI'] || 'mongodb://localhost:27017/technovastore',
    options: {
      maxPoolSize: parseInt(process.env['MONGODB_MAX_POOL_SIZE'] || '10', 10),
      minPoolSize: parseInt(process.env['MONGODB_MIN_POOL_SIZE'] || '2', 10),
      maxIdleTimeMS: parseInt(process.env['MONGODB_MAX_IDLE_TIME'] || '30000', 10),
      serverSelectionTimeoutMS: parseInt(process.env['MONGODB_SERVER_SELECTION_TIMEOUT'] || '5000', 10),
      socketTimeoutMS: parseInt(process.env['MONGODB_SOCKET_TIMEOUT'] || '45000', 10),
    }
  },
  
  // PostgreSQL Configuration
  postgresql: {
    host: process.env['POSTGRES_HOST'] || 'localhost',
    port: parseInt(process.env['POSTGRES_PORT'] || '5432', 10),
    database: process.env['POSTGRES_DB'] || 'technovastore',
    username: process.env['POSTGRES_USER'] || 'postgres',
    password: process.env['POSTGRES_PASSWORD'] || 'password',
    pool: {
      max: parseInt(process.env['POSTGRES_POOL_MAX'] || '20', 10),
      min: parseInt(process.env['POSTGRES_POOL_MIN'] || '5', 10),
      acquire: parseInt(process.env['POSTGRES_POOL_ACQUIRE'] || '30000', 10),
      idle: parseInt(process.env['POSTGRES_POOL_IDLE'] || '10000', 10),
    },
    dialectOptions: {
      ssl: process.env['POSTGRES_SSL'] === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  },
  
  // Redis Configuration
  redis: {
    host: process.env['REDIS_HOST'] || 'localhost',
    port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
    password: process.env['REDIS_PASSWORD'] || undefined,
    db: parseInt(process.env['REDIS_DB'] || '0', 10),
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
  },
  
  // JWT Configuration
  jwt: {
    secret: process.env['JWT_SECRET'] || 'REDACTED_JWT_SECRET',
    expiresIn: process.env['JWT_EXPIRES_IN'] || '24h',
    refreshSecret: process.env['JWT_REFRESH_SECRET'] || 'your-super-secret-refresh-key',
    refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
  }
};

export default config;