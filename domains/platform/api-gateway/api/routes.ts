import { Express } from 'express';
import { GatewayController } from './GatewayController';
import { ProxyRequest } from '../proxy-request/ProxyRequest';
import { RateLimitRequest } from '../rate-limit-request/RateLimitRequest';
import { logger } from '../shared/utils/logger';

/**
 * Configura todas las rutas del API Gateway
 */
export const setupRoutes = (app: Express): void => {
  const controller = new GatewayController();
  const proxyRequest = new ProxyRequest();
  const rateLimitRequest = new RateLimitRequest();

  // URLs de servicios
  const services = {
    product: process.env['PRODUCT_SERVICE_URL'] || 'http://localhost:3001',
    user: process.env['USER_SERVICE_URL'] || 'http://localhost:3002',
    order: process.env['ORDER_SERVICE_URL'] || 'http://localhost:3003',
    payment: process.env['PAYMENT_SERVICE_URL'] || 'http://localhost:3004',
    notification: process.env['NOTIFICATION_SERVICE_URL'] || 'http://localhost:3005',
    chatbot: process.env['CHATBOT_SERVICE_URL'] || 'http://chatbot:3001',
  };

  // Endpoint para token CSRF
  app.get('/api/csrf-token', controller.getCsrfToken.bind(controller));

  // Endpoints de seguridad (admin)
  app.get(
    '/api/admin/security/stats',
    rateLimitRequest.createStrictRateLimit(),
    controller.getAuthMiddleware(),
    controller.getSecurityStats.bind(controller)
  );

  app.get(
    '/api/admin/security/suspicious-ips',
    rateLimitRequest.createStrictRateLimit(),
    controller.getAuthMiddleware(),
    controller.getSuspiciousIPs.bind(controller)
  );

  // Endpoint de documentación
  app.get('/api/docs', controller.getApiDocs.bind(controller));

  // Rutas de categorías (acceso público)
  app.use(
    '/api/categories',
    controller.getOptionalAuthMiddleware(),
    proxyRequest.execute({
      serviceName: 'categories',
      targetUrl: services.product,
      pathRewrite: { '^/api/categories': '/categories' },
      securityLevel: 'LOW'
    })
  );

  // Rutas de búsqueda de productos (con rate limiting específico)
  app.use(
    '/api/products/search',
    rateLimitRequest.createSearchRateLimit(),
    controller.getOptionalAuthMiddleware(),
    proxyRequest.execute({
      serviceName: 'product-search',
      targetUrl: services.product,
      pathRewrite: { '^/api/products/search': '/products/search' },
      securityLevel: 'MEDIUM'
    })
  );

  // Rutas de productos (acceso público para catálogo)
  app.use(
    '/api/products',
    controller.getOptionalAuthMiddleware(),
    proxyRequest.execute({
      serviceName: 'product',
      targetUrl: services.product,
      pathRewrite: { '^/api/products': '/products' },
      securityLevel: 'MEDIUM'
    })
  );

  // Rutas GDPR (autenticación requerida)
  app.use(
    '/api/gdpr',
    controller.getAuthMiddleware(),
    proxyRequest.execute({
      serviceName: 'gdpr',
      targetUrl: services.user,
      pathRewrite: { '^/api/gdpr': '/gdpr' },
      securityLevel: 'HIGH',
      onProxyReq: (_proxyReq: any, req: any) => {
        // Log GDPR operations for audit trail
        logger.info('GDPR operation', {
          userId: req.user.id,
          operation: req.path,
          method: req.method,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      }
    })
  );

  // Rutas de usuarios (autenticación requerida)
  app.use(
    '/api/users',
    controller.getAuthMiddleware(),
    proxyRequest.execute({
      serviceName: 'user',
      targetUrl: services.user,
      pathRewrite: { '^/api/users': '/users' },
      securityLevel: 'MEDIUM'
    })
  );

  // Login (con rate limiting estricto)
  app.use(
    '/api/auth/login',
    rateLimitRequest.createAuthRateLimit(),
    proxyRequest.execute({
      serviceName: 'auth-login',
      targetUrl: services.user,
      pathRewrite: { '^/api/auth/login': '/auth/login' },
      timeout: 30000,
      proxyTimeout: 30000,
      securityLevel: 'HIGH'
    })
  );

  // Registro (con rate limiting estricto)
  app.use(
    '/api/auth/register',
    rateLimitRequest.createAuthRateLimit(),
    proxyRequest.execute({
      serviceName: 'auth-register',
      targetUrl: services.user,
      pathRewrite: { '^/api/auth/register': '/auth/register' },
      timeout: 30000,
      proxyTimeout: 30000,
      securityLevel: 'MEDIUM'
    })
  );

  // Reset password (muy estricto)
  app.use(
    '/api/auth/reset-password',
    rateLimitRequest.createStrictRateLimit(),
    proxyRequest.execute({
      serviceName: 'auth-reset-password',
      targetUrl: services.user,
      pathRewrite: { '^/api/auth/reset-password': '/auth/reset-password' },
      timeout: 30000,
      proxyTimeout: 30000,
      securityLevel: 'HIGH'
    })
  );

  // OAuth callback (público, timeout extendido)
  app.use(
    '/api/auth/oauth/callback',
    proxyRequest.execute({
      serviceName: 'auth-oauth-callback',
      targetUrl: services.user,
      pathRewrite: { '^/api/auth/oauth/callback': '/auth/oauth/callback' },
      timeout: 60000,
      proxyTimeout: 60000,
      securityLevel: 'MEDIUM'
    })
  );

  // Auth /me (autenticación requerida)
  app.use(
    '/api/auth/me',
    controller.getAuthMiddleware(),
    proxyRequest.execute({
      serviceName: 'auth-me',
      targetUrl: services.user,
      pathRewrite: { '^/api/auth/me': '/auth/me' },
      securityLevel: 'LOW'
    })
  );

  // Otras rutas de auth (público)
  app.use(
    '/api/auth',
    proxyRequest.execute({
      serviceName: 'auth',
      targetUrl: services.user,
      pathRewrite: { '^/api/auth': '/auth' },
      securityLevel: 'MEDIUM'
    })
  );

  // Creación de pedidos (autenticación + rate limiting)
  app.use(
    '/api/orders/create',
    rateLimitRequest.createOrderRateLimit(),
    controller.getAuthMiddleware(),
    proxyRequest.execute({
      serviceName: 'order-create',
      targetUrl: services.order,
      pathRewrite: { '^/api/orders/create': '/orders/create' },
      securityLevel: 'HIGH',
      onProxyReq: (_proxyReq: any, req: any) => {
        // Log order creation attempts
        logger.info('Order creation attempt', {
          userId: req.user.id,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      }
    })
  );

  // Rutas de pedidos (autenticación requerida)
  app.use(
    '/api/orders',
    controller.getAuthMiddleware(),
    proxyRequest.execute({
      serviceName: 'order',
      targetUrl: services.order,
      pathRewrite: { '^/api/orders': '/orders' },
      securityLevel: 'MEDIUM'
    })
  );

  // Rutas de pagos (autenticación + seguridad estricta)
  app.use(
    '/api/payments',
    rateLimitRequest.createPaymentRateLimit(),
    controller.getAuthMiddleware(),
    proxyRequest.execute({
      serviceName: 'payment',
      targetUrl: services.payment,
      pathRewrite: { '^/api/payments': '/payments' },
      securityLevel: 'CRITICAL'
    })
  );

  // Rutas de notificaciones (autenticación requerida)
  app.use(
    '/api/notifications',
    controller.getAuthMiddleware(),
    proxyRequest.execute({
      serviceName: 'notification',
      targetUrl: services.notification,
      pathRewrite: { '^/api/notifications': '/notifications' },
      securityLevel: 'MEDIUM'
    })
  );

  // Rutas de chatbot (acceso público)
  app.use(
    '/api/chat',
    controller.getOptionalAuthMiddleware(),
    proxyRequest.execute({
      serviceName: 'chatbot',
      targetUrl: services.chatbot,
      pathRewrite: { '^/api/chat': '/api' },
      timeout: 60000,
      proxyTimeout: 60000,
      securityLevel: 'LOW'
    })
  );
};
