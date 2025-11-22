import { Request, Response } from 'express';
import { AuthenticateRequest } from '../authenticate-request/AuthenticateRequest';
import { ValidateCsrfToken } from '../validate-csrf-token/ValidateCsrfToken';
import { SanitizeInput } from '../sanitize-input/SanitizeInput';
import { securityMonitor } from '../shared/utils/securityMonitor';

/**
 * Controlador del API Gateway
 * 
 * Configura todas las rutas y middlewares del gateway.
 */
export class GatewayController {
  private authenticateRequest: AuthenticateRequest;
  private validateCsrfToken: ValidateCsrfToken;
  private sanitizeInput: SanitizeInput;

  constructor() {
    this.authenticateRequest = new AuthenticateRequest();
    this.validateCsrfToken = new ValidateCsrfToken();
    this.sanitizeInput = new SanitizeInput();
  }

  /**
   * Obtiene el middleware de autenticación
   */
  getAuthMiddleware() {
    return this.authenticateRequest.execute.bind(this.authenticateRequest);
  }

  /**
   * Obtiene el middleware de autenticación opcional
   */
  getOptionalAuthMiddleware() {
    return this.authenticateRequest.executeOptional.bind(this.authenticateRequest);
  }

  /**
   * Obtiene el middleware de validación CSRF
   */
  getCsrfMiddleware() {
    return this.validateCsrfToken.execute.bind(this.validateCsrfToken);
  }

  /**
   * Obtiene el middleware de sanitización
   */
  getSanitizeMiddleware() {
    return this.sanitizeInput.execute.bind(this.sanitizeInput);
  }

  /**
   * Obtiene el middleware de validación de contenido
   */
  getContentValidationMiddleware() {
    return this.sanitizeInput.validateContent.bind(this.sanitizeInput);
  }

  /**
   * Endpoint para obtener token CSRF
   */
  getCsrfToken(req: Request, res: Response): void {
    const sessionId = req.headers['x-session-id'] as string || 'anonymous';
    const token = this.validateCsrfToken.generateToken(sessionId);

    res.json({
      csrfToken: token,
      sessionId: sessionId
    });
  }

  /**
   * Endpoint para estadísticas de seguridad
   */
  getSecurityStats(_req: Request, res: Response): void {
    try {
      const stats = securityMonitor.getStats();
      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch security statistics' });
    }
  }

  /**
   * Endpoint para IPs sospechosas
   */
  getSuspiciousIPs(_req: Request, res: Response): void {
    try {
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
      res.status(500).json({ error: 'Failed to fetch suspicious IP data' });
    }
  }

  /**
   * Endpoint de documentación de la API
   */
  getApiDocs(_req: Request, res: Response): void {
    const services = {
      product: process.env['PRODUCT_SERVICE_URL'] || 'http://localhost:3001',
      user: process.env['USER_SERVICE_URL'] || 'http://localhost:3002',
      order: process.env['ORDER_SERVICE_URL'] || 'http://localhost:3003',
      payment: process.env['PAYMENT_SERVICE_URL'] || 'http://localhost:3004',
      notification: process.env['NOTIFICATION_SERVICE_URL'] || 'http://localhost:3005',
      chatbot: process.env['CHATBOT_SERVICE_URL'] || 'http://chatbot:3001',
    };

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
  }
}
