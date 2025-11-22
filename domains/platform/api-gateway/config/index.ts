/**
 * Configuración del API Gateway
 */

export const config = {
  // Puerto del servicio
  port: parseInt(process.env.PORT || '3000', 10),

  // Entorno
  nodeEnv: process.env.NODE_ENV || 'development',

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // límite de requests por ventana
    message: 'Too many requests from this IP, please try again later.',
  },

  // Servicios backend
  services: {
    product: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3001',
    user: process.env.USER_SERVICE_URL || 'http://user-service:3003',
    order: process.env.ORDER_SERVICE_URL || 'http://order-service:3002',
    payment: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3004',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3005',
    syncEngine: process.env.SYNC_ENGINE_URL || 'http://sync-engine:3006',
    autoPurchase: process.env.AUTO_PURCHASE_URL || 'http://auto-purchase:3007',
    shipmentTracker: process.env.SHIPMENT_TRACKER_URL || 'http://shipment-tracker:3008',
    chatbot: process.env.CHATBOT_SERVICE_URL || 'http://chatbot:3009',
    recommender: process.env.RECOMMENDER_SERVICE_URL || 'http://recommender:3010',
    ticket: process.env.TICKET_SERVICE_URL || 'http://ticket-service:3012',
  },

  // Timeouts
  timeouts: {
    standard: 30000, // 30 segundos
    oauth: 60000, // 60 segundos
    chatbot: 60000, // 60 segundos
    longRunning: 120000, // 2 minutos
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  // Security
  security: {
    enableHelmet: true,
    enableCsrf: process.env.ENABLE_CSRF === 'true',
    trustProxy: true,
  },

  // Health Check
  healthCheck: {
    enabled: true,
    interval: 30000, // 30 segundos
  },
};

export default config;
