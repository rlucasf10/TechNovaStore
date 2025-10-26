import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
// import { config } from '@technovastore/shared-config';
import { connectPostgreSQL } from './config/database';
import { logger } from './utils/logger';
import { errorHandler } from '../../../shared/middleware/errorHandler';
import { orderRoutes } from './routes/orderRoutes';
import { invoiceRoutes } from './routes/invoiceRoutes';
import { InvoiceNumberGenerator } from './utils/invoiceNumberGenerator';
import { register, metricsMiddleware, HealthChecker, createPostgresHealthCheck, createMemoryCheck } from '@technovastore/shared-utils';

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
app.use('/orders', orderRoutes);
app.use('/invoices', invoiceRoutes);

// Initialize health checker
const healthChecker = new HealthChecker('order-service');

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
      service: 'order-service',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API Documentation
app.get('/api-docs', (_req, res) => {
  res.json({
    service: 'Order Service',
    version: '1.0.0',
    description: 'Manages orders, payments, invoices, and order lifecycle for TechNovaStore',
    endpoints: {
      orders: {
        'POST /orders': 'Create a new order',
        'GET /orders': 'Get all orders (admin only)',
        'GET /orders/my-orders': 'Get current user orders',
        'GET /orders/stats': 'Get order statistics',
        'GET /orders/:id': 'Get order by ID',
        'GET /orders/number/:orderNumber': 'Get order by order number',
        'POST /orders/:id/cancel': 'Cancel an order',
        'PUT /orders/:id/status': 'Update order status (admin only)',
        'PUT /orders/:id/tracking': 'Update tracking information (admin only)',
      },
      invoices: {
        'POST /invoices/generate/:orderId': 'Generate automatic invoice for an order',
        'GET /invoices': 'Get all invoices with pagination and filters',
        'GET /invoices/:id': 'Get invoice by ID',
        'GET /invoices/number/:invoiceNumber': 'Get invoice by invoice number',
        'PUT /invoices/:id/status': 'Update invoice status',
        'POST /invoices/:id/pdf': 'Generate PDF for invoice',
        'POST /invoices/:id/mark-paid': 'Mark invoice as paid',
        'POST /invoices/:id/cancel': 'Cancel invoice',
        'GET /invoices/next-number': 'Get next invoice number',
        'GET /invoices/stats': 'Get invoice statistics',
      },
      payments: {
        'POST /orders/:id/payment': 'Process payment for an order',
        'GET /orders/:id/payment/status': 'Get payment status',
        'POST /orders/:id/refund': 'Process refund (admin only)',
      },
      health: {
        'GET /health': 'Service health check',
        'GET /api-docs': 'API documentation',
      },
    },
    orderStatuses: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    invoiceStatuses: ['draft', 'issued', 'paid', 'cancelled'],
    paymentMethods: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'],
    spanishTaxRates: {
      general: '21%',
      reduced: '10%',
      superReduced: '4%',
      exempt: '0%',
    },
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3003;

const startServer = async () => {
  try {
    // Connect to database
    const sequelize = await connectPostgreSQL();
    
    // Initialize invoice sequence table
    await InvoiceNumberGenerator.initializeSequenceTable();
    
    // Setup health checks
    healthChecker.addDependency('postgresql', createPostgresHealthCheck(sequelize));
    healthChecker.addCheck('memory', createMemoryCheck(512));
    
    app.listen(PORT, () => {
      logger.info(`Order Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;