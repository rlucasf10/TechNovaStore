/**
 * Entry point del Payment Service
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { logger } from './shared/utils/logger';
import paymentRoutes from './api/routes';
import { register, metricsMiddleware, HealthChecker, createMemoryCheck } from '@technovastore/shared-utils';
import { apiRateLimiter } from './shared/middleware/rateLimiter';

const app = express();
const PORT = config.port;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'X-Session-ID', 'X-User-ID', 'X-User-Role'],
  exposedHeaders: ['X-CSRF-Token'],
  maxAge: 86400,
}));

// Metrics middleware
app.use(metricsMiddleware);

// Cookie parsing middleware
app.use(cookieParser());

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
healthChecker.addCheck('memory', createMemoryCheck(512));

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

// Rate limiting para todas las rutas /api/
// Configuración: 100 requests por 15 minutos por IP
// Requirements: 7.1, 7.2, 7.3, 7.4
app.use('/api', apiRateLimiter);

// Payment routes
app.use('/api/payments', paymentRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const startServer = async () => {
  try {
    app.listen(PORT, () => {
      logger.info(`Payment Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
};

startServer();

export default app;
