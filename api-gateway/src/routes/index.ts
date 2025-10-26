import { Express } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authMiddleware, optionalAuth } from '../middleware/auth';
import { logger } from '../utils/logger';
import {
  authSecurity,
  registrationSecurity,
  passwordResetSecurity,
  orderSecurity,
  searchSecurity,
  paymentSecurity,
  adminSecurity,
  apiSecurity,
  publicSecurity
} from '../middleware/routeSecurity';
import { logSecurityEvent, securityMonitor } from '../utils/securityMonitor';

export const setupRoutes = (app: Express) => {
  // Service endpoints configuration
  const services = {
    product: process.env['PRODUCT_SERVICE_URL'] || 'http://localhost:3001',
    user: process.env['USER_SERVICE_URL'] || 'http://localhost:3002',
    order: process.env['ORDER_SERVICE_URL'] || 'http://localhost:3003',
    payment: process.env['PAYMENT_SERVICE_URL'] || 'http://localhost:3004',
    notification: process.env['NOTIFICATION_SERVICE_URL'] || 'http://localhost:3005',
    chatbot: process.env['CHATBOT_SERVICE_URL'] || 'http://chatbot:3001',
  };

  // Helper function to ensure CORS headers are properly set for credentials
  const ensureCorsHeaders = (proxyRes: any, req: any) => {
    const origin = req.headers.origin;
    if (origin) {
      proxyRes.headers['access-control-allow-origin'] = origin;
      proxyRes.headers['access-control-allow-credentials'] = 'true';
      proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
      proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, X-Session-ID';
      proxyRes.headers['access-control-expose-headers'] = 'X-CSRF-Token';
    }
  };

  // Categories Service Routes (public access)
  app.use('/api/categories', publicSecurity, optionalAuth, createProxyMiddleware({
    target: services.product,
    changeOrigin: true,
    pathRewrite: {
      '^/api/categories': '/categories',
    },
    onError: (err: any, req: any, res: any) => {
      logger.error('Categories service proxy error:', err);
      logSecurityEvent(req, 'SUSPICIOUS_REQUEST', 'MEDIUM', { error: err.message, service: 'categories' });
      res.status(503).json({ error: 'Categories service unavailable' });
    },
    onProxyReq: (proxyReq: any, req: any) => {
      if (req.user) {
        proxyReq.setHeader('X-User-ID', req.user.id);
        proxyReq.setHeader('X-User-Role', req.user.role);
      }
    },
    onProxyRes: ensureCorsHeaders,
  }));

  // Product search routes (with search-specific rate limiting)
  app.use('/api/products/search', publicSecurity, searchSecurity, optionalAuth, createProxyMiddleware({
    target: services.product,
    changeOrigin: true,
    pathRewrite: {
      '^/api/products/search': '/products/search',
    },
    onError: (err: any, req: any, res: any) => {
      logger.error('Product search service proxy error:', err);
      logSecurityEvent(req, 'SUSPICIOUS_REQUEST', 'MEDIUM', { error: err.message, service: 'product-search' });
      res.status(503).json({ error: 'Product search service unavailable' });
    },
    onProxyReq: (proxyReq: any, req: any) => {
      if (req.user) {
        proxyReq.setHeader('X-User-ID', req.user.id);
        proxyReq.setHeader('X-User-Role', req.user.role);
      }
    },
    onProxyRes: ensureCorsHeaders,
  }));

  // Product Service Routes (public access for catalog, auth required for management)
  app.use('/api/products', publicSecurity, optionalAuth, createProxyMiddleware({
    target: services.product,
    changeOrigin: true,
    pathRewrite: {
      '^/api/products': '/products',
    },
    onError: (err: any, req: any, res: any) => {
      logger.error('Product service proxy error:', err);
      logSecurityEvent(req, 'SUSPICIOUS_REQUEST', 'MEDIUM', { error: err.message, service: 'product' });
      res.status(503).json({ error: 'Product service unavailable' });
    },
    onProxyReq: (proxyReq: any, req: any) => {
      // Forward user information if available
      if (req.user) {
        proxyReq.setHeader('X-User-ID', req.user.id);
        proxyReq.setHeader('X-User-Role', req.user.role);
      }
    },
    onProxyRes: ensureCorsHeaders,
  }));

  // GDPR Service Routes (authentication required with enhanced security for data operations)
  app.use('/api/gdpr', apiSecurity, authMiddleware, createProxyMiddleware({
    target: services.user,
    changeOrigin: true,
    pathRewrite: {
      '^/api/gdpr': '/gdpr',
    },
    onError: (err: any, req: any, res: any) => {
      logger.error('GDPR service proxy error:', err);
      logSecurityEvent(req, 'SUSPICIOUS_REQUEST', 'HIGH', { error: err.message, service: 'gdpr' });
      res.status(503).json({ error: 'GDPR service unavailable' });
    },
    onProxyReq: (proxyReq: any, req: any) => {
      proxyReq.setHeader('X-User-ID', req.user.id);
      proxyReq.setHeader('X-User-Role', req.user.role);
      // Log GDPR operations for audit trail
      logger.info('GDPR operation', {
        userId: req.user.id,
        operation: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    },
    onProxyRes: ensureCorsHeaders,
  }));

  // User Service Routes (authentication required)
  app.use('/api/users', apiSecurity, authMiddleware, createProxyMiddleware({
    target: services.user,
    changeOrigin: true,
    pathRewrite: {
      '^/api/users': '/users',
    },
    onError: (err: any, req: any, res: any) => {
      logger.error('User service proxy error:', err);
      logSecurityEvent(req, 'SUSPICIOUS_REQUEST', 'MEDIUM', { error: err.message, service: 'user' });
      res.status(503).json({ error: 'User service unavailable' });
    },
    onProxyReq: (proxyReq: any, req: any) => {
      proxyReq.setHeader('X-User-ID', req.user.id);
      proxyReq.setHeader('X-User-Role', req.user.role);
    },
    onProxyRes: ensureCorsHeaders,
  }));

  // Specific auth endpoints with enhanced security
  app.use('/api/auth/login', authSecurity, createProxyMiddleware({
    target: services.user,
    changeOrigin: true,
    pathRewrite: {
      '^/api/auth/login': '/auth/login',
    },
    onError: (err: any, req: any, res: any) => {
      logger.error('Auth login service proxy error:', err);
      logSecurityEvent(req, 'AUTH_FAILURE', 'HIGH', { error: err.message, endpoint: 'login' });
      res.status(503).json({ error: 'Authentication service unavailable' });
    },
    onProxyRes: ensureCorsHeaders,
  }));

  app.use('/api/auth/register', registrationSecurity, createProxyMiddleware({
    target: services.user,
    changeOrigin: true,
    pathRewrite: {
      '^/api/auth/register': '/auth/register',
    },
    onError: (err: any, req: any, res: any) => {
      logger.error('Auth register service proxy error:', err);
      logSecurityEvent(req, 'SUSPICIOUS_REQUEST', 'MEDIUM', { error: err.message, endpoint: 'register' });
      res.status(503).json({ error: 'Registration service unavailable' });
    },
    onProxyRes: ensureCorsHeaders,
  }));

  app.use('/api/auth/reset-password', passwordResetSecurity, createProxyMiddleware({
    target: services.user,
    changeOrigin: true,
    pathRewrite: {
      '^/api/auth/reset-password': '/auth/reset-password',
    },
    onError: (err: any, req: any, res: any) => {
      logger.error('Password reset service proxy error:', err);
      logSecurityEvent(req, 'SUSPICIOUS_REQUEST', 'HIGH', { error: err.message, endpoint: 'reset-password' });
      res.status(503).json({ error: 'Password reset service unavailable' });
    },
    onProxyRes: ensureCorsHeaders,
  }));

  // General auth endpoints (public for other auth operations)
  app.use('/api/auth', publicSecurity, createProxyMiddleware({
    target: services.user,
    changeOrigin: true,
    pathRewrite: {
      '^/api/auth': '/auth',
    },
    onError: (err: any, req: any, res: any) => {
      logger.error('Auth service proxy error:', err);
      logSecurityEvent(req, 'SUSPICIOUS_REQUEST', 'MEDIUM', { error: err.message, service: 'auth' });
      res.status(503).json({ error: 'Authentication service unavailable' });
    },
    onProxyRes: ensureCorsHeaders,
  }));

  // Order creation with enhanced security
  app.use('/api/orders/create', orderSecurity, authMiddleware, createProxyMiddleware({
    target: services.order,
    changeOrigin: true,
    pathRewrite: {
      '^/api/orders/create': '/orders/create',
    },
    onError: (err: any, req: any, res: any) => {
      logger.error('Order creation service proxy error:', err);
      logSecurityEvent(req, 'SUSPICIOUS_REQUEST', 'HIGH', { error: err.message, endpoint: 'order-create' });
      res.status(503).json({ error: 'Order creation service unavailable' });
    },
    onProxyReq: (proxyReq: any, req: any) => {
      proxyReq.setHeader('X-User-ID', req.user.id);
      proxyReq.setHeader('X-User-Role', req.user.role);
      // Log order creation attempts
      logger.info('Order creation attempt', {
        userId: req.user.id,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    },
    onProxyRes: ensureCorsHeaders,
  }));

  // Order Service Routes (authentication required)
  app.use('/api/orders', apiSecurity, authMiddleware, createProxyMiddleware({
    target: services.order,
    changeOrigin: true,
    pathRewrite: {
      '^/api/orders': '/orders',
    },
    onError: (err: any, req: any, res: any) => {
      logger.error('Order service proxy error:', err);
      logSecurityEvent(req, 'SUSPICIOUS_REQUEST', 'MEDIUM', { error: err.message, service: 'order' });
      res.status(503).json({ error: 'Order service unavailable' });
    },
    onProxyReq: (proxyReq: any, req: any) => {
      proxyReq.setHeader('X-User-ID', req.user.id);
      proxyReq.setHeader('X-User-Role', req.user.role);
    },
    onProxyRes: ensureCorsHeaders,
  }));

  // Payment Service Routes (authentication required with enhanced security)
  app.use('/api/payments', paymentSecurity, authMiddleware, createProxyMiddleware({
    target: services.payment,
    changeOrigin: true,
    pathRewrite: {
      '^/api/payments': '/payments',
    },
    onError: (err: any, req: any, res: any) => {
      logger.error('Payment service proxy error:', err);
      logSecurityEvent(req, 'SUSPICIOUS_REQUEST', 'CRITICAL', { error: err.message, service: 'payment' });
      res.status(503).json({ error: 'Payment service unavailable' });
    },
    onProxyReq: (proxyReq: any, req: any) => {
      proxyReq.setHeader('X-User-ID', req.user.id);
      proxyReq.setHeader('X-User-Role', req.user.role);
    },
    onProxyRes: ensureCorsHeaders,
  }));

  // Notification Service Routes (authentication required)
  app.use('/api/notifications', apiSecurity, authMiddleware, createProxyMiddleware({
    target: services.notification,
    changeOrigin: true,
    pathRewrite: {
      '^/api/notifications': '/notifications',
    },
    onError: (err: any, req: any, res: any) => {
      logger.error('Notification service proxy error:', err);
      logSecurityEvent(req, 'SUSPICIOUS_REQUEST', 'MEDIUM', { error: err.message, service: 'notification' });
      res.status(503).json({ error: 'Notification service unavailable' });
    },
    onProxyReq: (proxyReq: any, req: any) => {
      proxyReq.setHeader('X-User-ID', req.user.id);
      proxyReq.setHeader('X-User-Role', req.user.role);
    },
    onProxyRes: ensureCorsHeaders,
  }));

  // Chatbot Service Routes (public access for chat functionality)
  app.use('/chat', publicSecurity, optionalAuth, createProxyMiddleware({
    target: services.chatbot,
    changeOrigin: true,
    timeout: 60000, // 60 seconds timeout for chatbot responses
    proxyTimeout: 60000,
    pathRewrite: {
      '^/chat': '/api',
    },
    onError: (err: any, req: any, res: any) => {
      logger.error('Chatbot service proxy error:', err);
      logSecurityEvent(req, 'SUSPICIOUS_REQUEST', 'LOW', { error: err.message, service: 'chatbot' });
      res.status(503).json({ error: 'Chatbot service unavailable' });
    },
    onProxyReq: (proxyReq: any, req: any) => {
      if (req.user) {
        proxyReq.setHeader('X-User-ID', req.user.id);
        proxyReq.setHeader('X-User-Role', req.user.role);
      }
    },
    onProxyRes: ensureCorsHeaders,
  }));

  // Security monitoring endpoints (admin only)
  app.get('/api/admin/security/stats', adminSecurity, authMiddleware, (_req: any, res: any) => {
    try {
      const stats = securityMonitor.getStats();
      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error fetching security stats:', error);
      res.status(500).json({ error: 'Failed to fetch security statistics' });
    }
  });

  app.get('/api/admin/security/suspicious-ips', adminSecurity, authMiddleware, (_req: any, res: any) => {
    try {
      // This would typically come from a database or cache
      // For now, we'll return a placeholder response
      res.json({
        success: true,
        data: {
          suspiciousIPs: [],
          blockedIPs: [],
          recentAlerts: []
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error fetching suspicious IPs:', error);
      res.status(500).json({ error: 'Failed to fetch suspicious IP data' });
    }
  });

  // API documentation endpoint
  app.get('/api/docs', publicSecurity, (_req: any, res: any) => {
    res.json({
      name: 'TechNovaStore API Gateway',
      version: '1.0.0',
      security: {
        https: 'SSL/TLS encryption enabled',
        csrf: 'CSRF protection active',
        xss: 'XSS protection enabled',
        rateLimit: 'Advanced rate limiting',
        monitoring: 'Security event monitoring'
      },
      endpoints: {
        '/api/categories': 'Product categories',
        '/api/products': 'Product catalog and management',
        '/api/products/search': 'Product search with rate limiting',
        '/api/auth/login': 'User authentication with security',
        '/api/auth/register': 'User registration with validation',
        '/api/auth/reset-password': 'Password reset with strict limits',
        '/api/auth': 'Other authentication operations',
        '/api/users': 'User management',
        '/api/gdpr': 'GDPR compliance and data management',
        '/api/orders': 'Order management',
        '/api/orders/create': 'Order creation with enhanced security',
        '/api/payments': 'Payment processing with strict security',
        '/api/notifications': 'Notification management',
        '/api/csrf-token': 'Get CSRF token for secure requests',
        '/api/admin/security/*': 'Security monitoring (admin only)',
        '/health': 'Health check with security status',
      },
      services,
    });
  });
};