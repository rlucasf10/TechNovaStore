/**
 * Configuración centralizada del Payment Service
 */

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
    password: process.env.POSTGRES_PASSWORD || 'technovastore123',
  },
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // CORS
  corsOrigins: process.env.NODE_ENV === 'production'
    ? (process.env.CORS_ORIGINS || 'https://technovastore.com').split(',')
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3011'],
};
