import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { config } from '@technovastore/shared-config';
import { register, metricsMiddleware, HealthChecker, createMongoHealthCheck, createRedisHealthCheck, createMemoryCheck } from '@technovastore/shared-utils';
import { RecommendationService } from './services/RecommendationService';
import { RecommendationController } from './controllers/RecommendationController';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Metrics middleware
app.use(metricsMiddleware);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Initialize Redis client
const redisClient = createClient({
  socket: {
    host: config.redis.host,
    port: config.redis.port,
  },
  password: config.redis.password,
  database: config.redis.db,
});

// Initialize health checker
const healthChecker = new HealthChecker('recommender-service');

// Metrics endpoint
app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

// Health check
app.get('/health', async (_req, res) => {
  try {
    const healthResult = await healthChecker.runHealthCheck();
    const statusCode = healthResult.status === 'healthy' ? 200 : 
                      healthResult.status === 'degraded' ? 200 : 503;
    res.status(statusCode).json(healthResult);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'recommender-service',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    logger.info('Connected to MongoDB');

    // Connect to Redis
    await redisClient.connect();
    logger.info('Connected to Redis');

    // Setup health checks
    healthChecker.addDependency('mongodb', createMongoHealthCheck(mongoose));
    healthChecker.addDependency('redis', createRedisHealthCheck(redisClient));
    healthChecker.addCheck('memory', createMemoryCheck(1024));

    // Initialize services after connections
    const recommendationService = new RecommendationService(redisClient);
    const recommendationController = new RecommendationController(recommendationService);

    // Routes
    app.get('/recommendations/user/:userId', recommendationController.getUserRecommendations.bind(recommendationController));
    app.get('/recommendations/product/:productId/similar', recommendationController.getSimilarProducts.bind(recommendationController));
    app.post('/recommendations/interaction', recommendationController.recordInteraction.bind(recommendationController));
    app.get('/recommendations/trending', recommendationController.getTrendingProducts.bind(recommendationController));

    // Error handling
    app.use(errorHandler);

    app.listen(PORT, () => {
      logger.info(`Recommender service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();