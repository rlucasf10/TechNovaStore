import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectPostgreSQL } from './config/database';
import { logger } from './utils/logger';
import { register, metricsMiddleware, HealthChecker, createPostgresHealthCheck, createMemoryCheck } from '@technovastore/shared-utils';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.CORS_ORIGINS || 'https://technovastore.com').split(',')
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3011'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'X-Session-ID', 'X-User-ID', 'X-User-Role'],
  exposedHeaders: ['X-CSRF-Token'],
  maxAge: 86400,
}));

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

// Initialize health checker
const healthChecker = new HealthChecker('payment-service');

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
app.get('/health', async (_req: Request, res: Response) => {
  try {
    const healthResult = await healthChecker.runHealthCheck();
    const statusCode = healthResult.status === 'healthy' ? 200 : 
                      healthResult.status === 'degraded' ? 200 : 503;
    res.status(statusCode).json(healthResult);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'payment-service',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Payment endpoints
app.post('/api/payments/process', (req: Request, res: Response) => {
  const { amount, currency } = req.body;
  res.json({ 
    message: 'Payment processing endpoint',
    amount,
    currency
  });
});

app.get('/api/payments/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({ 
    message: 'Get payment details endpoint',
    paymentId: id
  });
});

const startServer = async () => {
  try {
    // Connect to database
    const sequelize = await connectPostgreSQL();
    
    // Setup health checks
    healthChecker.addDependency('postgresql', createPostgresHealthCheck(sequelize));
    healthChecker.addCheck('memory', createMemoryCheck(512));
    
    app.listen(PORT, () => {
      logger.info(`Payment Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
