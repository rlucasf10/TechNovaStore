import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validación de JWT_SECRET
const JWT_SECRET = process.env['JWT_SECRET'];

if (!JWT_SECRET) {
  console.error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not set');
  throw new Error('JWT_SECRET must be configured. Application cannot start.');
}

if (JWT_SECRET.length < 32) {
  console.warn('WARNING: JWT_SECRET is shorter than 32 characters. Consider using a longer secret for better security.');
}

// Validación de POSTGRES_PASSWORD
const POSTGRES_PASSWORD = process.env['POSTGRES_PASSWORD'];

if (!POSTGRES_PASSWORD) {
  console.error('CRITICAL: POSTGRES_PASSWORD environment variable is not set');
  throw new Error('POSTGRES_PASSWORD must be configured. Application cannot start.');
}

// Validación de JWT_REFRESH_SECRET
const JWT_REFRESH_SECRET = process.env['JWT_REFRESH_SECRET'];

if (!JWT_REFRESH_SECRET) {
  console.error('CRITICAL SECURITY ERROR: JWT_REFRESH_SECRET environment variable is not set');
  throw new Error('JWT_REFRESH_SECRET must be configured. Application cannot start.');
}

if (JWT_REFRESH_SECRET.length < 32) {
  console.warn('WARNING: JWT_REFRESH_SECRET is shorter than 32 characters. Consider using a longer secret for better security.');
}

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
    password: POSTGRES_PASSWORD,
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
    secret: JWT_SECRET,
    expiresIn: process.env['JWT_EXPIRES_IN'] || '24h',
    refreshSecret: JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
  }
};

export default config;