/**
 * Entry point del servicio de tickets
 * Refactorizado a Screaming Architecture
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createTicketRoutes } from './api/routes';
import pool from './config/database';
import { logger } from './shared/utils/logger';
import { apiRateLimiter } from './shared/middleware/rateLimiter';

// Load environment variables
dotenv.config();

const app = express();
const port = parseInt(process.env.TICKET_SERVICE_PORT || '3005', 10);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ticket-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    architecture: 'Screaming Architecture - Organized by use cases'
  });
});

// Rate limiting para todas las rutas /api/
// Configuración: 100 requests por 15 minutos por IP
// Requirements: 7.1, 7.2, 7.3, 7.4
app.use('/api', apiRateLimiter);

// API routes
const ticketRoutes = createTicketRoutes(pool);
app.use('/api', ticketRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise: String(promise) });
  process.exit(1);
});

// Start server
app.listen(port, () => {
  logger.info('Ticket service started', {
    port,
    healthCheck: `http://localhost:${port}/health`,
    apiBaseUrl: `http://localhost:${port}/api`,
    architecture: 'Screaming Architecture - Organized by use cases'
  });
});

export default app;
