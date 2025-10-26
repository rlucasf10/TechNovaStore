import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
// import { config } from '@technovastore/shared-config';
import { connectPostgreSQL } from './config/database';
import { logger } from './utils/logger';
import { errorHandler } from '../../../shared/middleware/errorHandler';
import { authRoutes } from './routes/authRoutes';
import { userRoutes } from './routes/userRoutes';
import { gdprRoutes } from './routes/gdprRoutes';
import { scheduleTokenCleanup } from './services/cleanupService';
import { GdprCleanupService } from './services/gdprCleanupService';
import './models/User';
import './models/RefreshToken';
import './models/PasswordReset';
import './models/UserConsent';
import './models/AccountDeletionRequest';

const app = express();

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
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/gdpr', gdprRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'user-service',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3002;

const startServer = async () => {
  try {
    // Connect to database
    await connectPostgreSQL();
    
    // Start token cleanup service (runs every 24 hours)
    scheduleTokenCleanup(24);
    logger.info('Token cleanup service scheduled');
    
    // Start GDPR cleanup service (runs daily at 2:00 AM)
    GdprCleanupService.scheduleCleanupTasks();
    logger.info('GDPR cleanup service scheduled');
    
    app.listen(PORT, () => {
      logger.info(`User Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;