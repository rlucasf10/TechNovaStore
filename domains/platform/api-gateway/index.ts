import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import https from 'https';
import http from 'http';
import { config } from './config';
import { logger } from './shared/utils/logger';
import { errorHandler } from './shared/middleware/errorHandler';
import { setupRoutes } from './api/routes';
import { securityConfig } from './shared/config/security';
import { SanitizeInput } from './sanitize-input/SanitizeInput';
import { RateLimitRequest } from './rate-limit-request/RateLimitRequest';
import { ValidateCsrfToken } from './validate-csrf-token/ValidateCsrfToken';
import { createHTTPSOptions, httpsRedirect, generateSelfSignedCert } from './shared/utils/ssl';
import { register, metricsMiddleware, createServiceHealthChecker, healthCheckConfigs } from '@technovastore/shared-utils';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

const app = express();

// Instanciar casos de uso
const sanitizeInput = new SanitizeInput();
const rateLimitRequest = new RateLimitRequest();
const validateCsrfToken = new ValidateCsrfToken();

// Generate self-signed certificates for development if needed
if (securityConfig.https.enabled && config.nodeEnv === 'development') {
  generateSelfSignedCert();
}

// HTTPS redirect middleware (must be first)
if (securityConfig.https.enabled && securityConfig.https.redirectHttp) {
  app.use(httpsRedirect);
}

// Security headers middleware
app.use((_req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
});

// Enhanced Helmet configuration
app.use(helmet({
  contentSecurityPolicy: securityConfig.csp.enabled ? {
    directives: securityConfig.csp.directives,
    reportOnly: securityConfig.csp.reportOnly,
  } : false,
  hsts: securityConfig.hsts.enabled ? {
    maxAge: securityConfig.hsts.maxAge,
    includeSubDomains: securityConfig.hsts.includeSubDomains,
    preload: securityConfig.hsts.preload,
  } : false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Enhanced CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = securityConfig.cors.origin;
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: securityConfig.cors.credentials,
  methods: securityConfig.cors.methods,
  allowedHeaders: securityConfig.cors.allowedHeaders,
  exposedHeaders: securityConfig.cors.exposedHeaders,
  maxAge: securityConfig.cors.maxAge,
}));

// Request sanitization
app.use((req: express.Request, _res: express.Response, next: express.NextFunction) => {
  delete req.headers['x-forwarded-host'];
  delete req.headers['x-forwarded-server'];
  
  const contentLength = parseInt(req.headers['content-length'] || '0');
  if (contentLength > 10 * 1024 * 1024) {
    return _res.status(413).json({
      error: 'Request entity too large',
      code: 'PAYLOAD_TOO_LARGE'
    });
  }
  
  next();
});

// Body parsing middleware - Skip for /api/chat routes
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path.startsWith('/api/chat')) {
    return next();
  }
  express.json({
    limit: securityConfig.validation.maxRequestSize,
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    }
  })(req, res, next);
});

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path.startsWith('/api/chat')) {
    return next();
  }
  express.urlencoded({
    extended: true,
    limit: securityConfig.validation.maxRequestSize,
    parameterLimit: securityConfig.validation.maxFields
  })(req, res, next);
});

// Metrics middleware
app.use(metricsMiddleware);

// Rate limiting and speed limiting
app.use(rateLimitRequest.createApiRateLimit());

// XSS Protection
app.use(sanitizeInput.execute.bind(sanitizeInput));

// CSRF Protection - Skip for /api/chat and OAuth callback routes
if (securityConfig.csrf.enabled) {
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api/chat') || req.path.startsWith('/api/auth/oauth/callback')) {
      return next();
    }
    return validateCsrfToken.execute(req, res, next);
  });
}

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  },
  skip: (req: express.Request) => {
    return req.url === '/health';
  }
}));

// Metrics endpoint
app.get('/metrics', async (_req: express.Request, res: express.Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

// Initialize advanced health checker
const healthChecker = createServiceHealthChecker(healthCheckConfigs.apiGateway({}));

// Health check endpoint
app.get('/health', async (_req: express.Request, res: express.Response) => {
  try {
    const healthStatus = await healthChecker.getDetailedHealthStatus();

    const enhancedStatus = {
      ...healthStatus,
      security: {
        https: securityConfig.https.enabled,
        csrf: securityConfig.csrf.enabled,
        xss: securityConfig.xss.enabled,
        rateLimit: true,
      },
      environment: config.nodeEnv
    };

    const statusCode = healthStatus.status === 'healthy' ? 200 :
      healthStatus.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(enhancedStatus);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Swagger documentation
if (config.nodeEnv !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
  try {
    const swaggerPath = path.join(__dirname, '../../../docs/api/openapi.yaml');
    const swaggerDocument = YAML.load(swaggerPath);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'TechNovaStore API Documentation',
      customfavIcon: '/favicon.ico',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
      }
    }));

    app.get('/api/openapi.json', (_req, res) => {
      res.json(swaggerDocument);
    });

    logger.info('Swagger documentation available at /api-docs');
  } catch (error) {
    logger.warn('Failed to load Swagger documentation:', {
      error: error instanceof Error ? error.message : error,
      swaggerPath: path.join(__dirname, '../../../docs/api/openapi.yaml')
    });
  }
}

// API routes
setupRoutes(app);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  logger.warn('404 - Route not found', {
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

const PORT = config.port;
const HTTPS_PORT = securityConfig.https.port;

// Start HTTP server
const httpServer = http.createServer(app);
httpServer.listen(PORT, () => {
  logger.info(`HTTP Server running on port ${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});

// Start HTTPS server if enabled
if (securityConfig.https.enabled) {
  const httpsOptions = createHTTPSOptions();

  if (httpsOptions) {
    const httpsServer = https.createServer(httpsOptions, app);
    httpsServer.listen(HTTPS_PORT, () => {
      logger.info(`HTTPS Server running on port ${HTTPS_PORT}`);
      logger.info('SSL/TLS encryption enabled');
    });
  } else {
    logger.warn('HTTPS enabled but SSL certificates not found');
    logger.warn('Running in HTTP mode only');
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
