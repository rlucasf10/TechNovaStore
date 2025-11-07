import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
// import { config } from '@technovastore/shared-config';
import { connectMongoDB } from './config/database';
import { connectRedis } from './config/redis';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { productRoutes } from './routes/productRoutes';
import { categoryRoutes } from './routes/categoryRoutes';
import { register, metricsMiddleware, HealthChecker, createMongoHealthCheck, createRedisHealthCheck } from '@technovastore/shared-utils';

const app = express();

// Security middleware
app.use(helmet());

// CORS - Only enable if not behind API Gateway
// When behind API Gateway, let the gateway handle CORS
const behindGateway = process.env.BEHIND_API_GATEWAY === 'true';
if (!behindGateway) {
  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? (process.env.CORS_ORIGINS || 'https://technovastore.com').split(',')
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3011'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'X-Session-ID', 'X-User-ID', 'X-User-Role'],
    exposedHeaders: ['X-CSRF-Token'],
    maxAge: 86400, // 24 hours
  }));
}

// Metrics middleware
app.use(metricsMiddleware);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Routes
app.use('/products', productRoutes);
app.use('/categories', categoryRoutes);

// Metrics endpoint
app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

// Initialize health checker
const healthChecker = new HealthChecker('product-service');

// Health check
app.get('/health', async (_req, res) => {
  try {
    const healthStatus = await healthChecker.runHealthCheck();
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    // Connect to databases
    const mongoose = await connectMongoDB();
    const redis = await connectRedis();

    // Configure health checks after connections
    healthChecker.addDependency('mongodb', createMongoHealthCheck(mongoose));
    healthChecker.addDependency('redis', createRedisHealthCheck(redis));

    app.listen(PORT, () => {
      logger.info(`Product Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;