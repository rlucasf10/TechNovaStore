import { Request, Response } from 'express';
import { AuthenticateRequest } from '../authenticate-request/AuthenticateRequest';
import { ValidateCsrfToken } from '../validate-csrf-token/ValidateCsrfToken';
import { SanitizeInput } from '../sanitize-input/SanitizeInput';
import { securityMonitor } from '../shared/utils/securityMonitor';
import { GetAdminMetrics } from '../get-admin-metrics/GetAdminMetrics';
import { GetAdminAnalytics } from '../get-admin-metrics/GetAdminAnalytics';

/**
 * Controlador del API Gateway
 * 
 * Configura todas las rutas y middlewares del gateway.
 */
export class GatewayController {
  private authenticateRequest: AuthenticateRequest;
  private validateCsrfToken: ValidateCsrfToken;
  private sanitizeInput: SanitizeInput;
  private getAdminMetrics: GetAdminMetrics;
  private getAdminAnalytics: GetAdminAnalytics;

  constructor() {
    this.authenticateRequest = new AuthenticateRequest();
    this.validateCsrfToken = new ValidateCsrfToken();
    this.sanitizeInput = new SanitizeInput();
    this.getAdminMetrics = new GetAdminMetrics();
    this.getAdminAnalytics = new GetAdminAnalytics();
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
  async getCsrfToken(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.headers['x-session-id'] as string || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const token = await this.validateCsrfToken.generateToken(sessionId);

      res.json({
        csrfToken: token,
        sessionId: sessionId
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to generate CSRF token',
        code: 'CSRF_GENERATION_ERROR'
      });
    }
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

  // ============================================================================
  // Endpoints de Métricas de Admin (Requisitos: 15.1, 15.2, 15.3, 15.4)
  // ============================================================================

  /**
   * Endpoint para métricas del Chatbot
   * Requisitos: 15.2
   */
  async getChatbotMetrics(_req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.getAdminMetrics.getChatbotMetrics();
      res.json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener métricas del chatbot' 
      });
    }
  }

  /**
   * Endpoint para obtener logs del Chatbot
   */
  async getChatbotLogs(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const data = await this.getAdminMetrics.getChatbotLogs(limit);
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener logs del chatbot' 
      });
    }
  }

  /**
   * Endpoint para reiniciar el Chatbot
   */
  async restartChatbot(_req: Request, res: Response): Promise<void> {
    try {
      const result = await this.getAdminMetrics.restartChatbot();
      res.json({
        success: result.success,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'Error al reiniciar el chatbot' 
      });
    }
  }

  /**
   * Endpoint para métricas del Recommender
   * Requisitos: 15.2
   */
  async getRecommenderMetrics(_req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.getAdminMetrics.getRecommenderMetrics();
      res.json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener métricas del recommender' 
      });
    }
  }

  /**
   * Endpoint para métricas de Automatización
   * Requisitos: 15.3
   */
  async getAutomationMetrics(_req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.getAdminMetrics.getAutomationMetrics();
      res.json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener métricas de automatización' 
      });
    }
  }

  /**
   * Endpoint para métricas del Sistema
   * Requisitos: 15.4
   */
  async getSystemMetrics(_req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.getAdminMetrics.getSystemMetrics();
      res.json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener métricas del sistema' 
      });
    }
  }

  /**
   * Endpoint para KPIs de negocio
   * Requisitos: 15.1
   */
  async getBusinessKPIs(_req: Request, res: Response): Promise<void> {
    try {
      const kpis = await this.getAdminMetrics.getBusinessKPIs();
      res.json({
        success: true,
        data: kpis,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener KPIs de negocio' 
      });
    }
  }

  /**
   * Endpoint para estado de salud de todos los servicios
   */
  async getAllServicesHealth(_req: Request, res: Response): Promise<void> {
    try {
      const services = await this.getAdminMetrics.getAllServicesHealth();
      res.json({
        success: true,
        data: services,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener estado de servicios' 
      });
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

  // ============================================================================
  // Endpoints de Analíticas (Requisito: 15.1)
  // ============================================================================

  /**
   * Endpoint para obtener datos de ventas por día
   */
  async getSalesData(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const data = await this.getAdminAnalytics.getSalesData(days);
      
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener datos de ventas' 
      });
    }
  }

  /**
   * Endpoint para obtener productos más vendidos
   */
  async getTopProducts(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await this.getAdminAnalytics.getTopProducts(limit);
      
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener productos más vendidos' 
      });
    }
  }

  /**
   * Endpoint para obtener datos de categorías
   */
  async getCategoriesData(_req: Request, res: Response): Promise<void> {
    try {
      const data = await this.getAdminAnalytics.getCategoriesData();
      
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener datos de categorías' 
      });
    }
  }

  /**
   * Endpoint para obtener embudo de conversión
   */
  async getConversionFunnel(_req: Request, res: Response): Promise<void> {
    try {
      const data = await this.getAdminAnalytics.getConversionFunnel();
      
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener embudo de conversión' 
      });
    }
  }

  /**
   * Endpoint para obtener datos de tendencia
   */
  async getTrendData(_req: Request, res: Response): Promise<void> {
    try {
      const data = await this.getAdminAnalytics.getTrendData();
      
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener datos de tendencia' 
      });
    }
  }

  /**
   * Endpoint para obtener actividad reciente
   */
  async getRecentActivity(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await this.getAdminAnalytics.getRecentActivity(limit);
      
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener actividad reciente' 
      });
    }
  }
}
