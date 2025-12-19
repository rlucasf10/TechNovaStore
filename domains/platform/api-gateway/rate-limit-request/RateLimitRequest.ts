import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '../shared/utils/logger';

/**
 * Caso de uso: Rate Limit Request
 * 
 * Limita la tasa de peticiones para prevenir abuso y ataques DDoS.
 * Proporciona diferentes configuraciones de rate limiting según el tipo de endpoint.
 */
export class RateLimitRequest {
  /**
   * Crea un rate limiter con configuración avanzada
   */
  createRateLimit(options: RateLimitOptions): any {
    return rateLimit({
      windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutos por defecto
      max: options.max || 100,
      message: {
        error: options.message || 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((options.windowMs || 900000) / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      skipFailedRequests: options.skipFailedRequests || false,
      handler: (req: Request, res: Response) => {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.url,
          method: req.method
        });

        res.status(429).json({
          error: options.message || 'Too many requests from this IP, please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((options.windowMs || 900000) / 1000)
        });
      }
    });
  }

  /**
   * Rate limiter para endpoints de autenticación
   * Límites realistas: 20 intentos en 15 minutos (permite errores de usuario)
   */
  createAuthRateLimit(): any {
    return this.createRateLimit({
      windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutos
      max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '20', 10), // 20 intentos
      message: 'Too many authentication attempts, please try again later.',
      skipSuccessfulRequests: true
    });
  }

  /**
   * Rate limiter para API general
   * Límites realistas: 500 peticiones en 15 minutos para usuarios normales
   */
  createApiRateLimit(): any {
    return this.createRateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutos
      max: parseInt(process.env.RATE_LIMIT_MAX || '500', 10), // 500 peticiones
      message: 'API rate limit exceeded, please try again later.'
    });
  }

  /**
   * Rate limiter para operaciones sensibles (reset password, etc.)
   * Límites realistas: 30 peticiones en 5 minutos
   */
  createStrictRateLimit(): any {
    return this.createRateLimit({
      windowMs: 5 * 60 * 1000, // 5 minutos
      max: 30, // 30 peticiones por ventana
      message: 'Rate limit exceeded for sensitive operations.'
    });
  }

  /**
   * Rate limiter para métricas de admin (permisivo para dashboards con polling)
   * Límites realistas: 120 peticiones por minuto para soportar múltiples widgets
   */
  createAdminMetricsRateLimit(): any {
    return this.createRateLimit({
      windowMs: 1 * 60 * 1000, // 1 minuto
      max: 120, // 120 peticiones por minuto
      message: 'Admin metrics rate limit exceeded.'
    });
  }

  /**
   * Rate limiter para búsquedas
   * Límites realistas: 60 búsquedas por minuto
   */
  createSearchRateLimit(): any {
    return this.createRateLimit({
      windowMs: parseInt(process.env.SEARCH_RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minuto
      max: parseInt(process.env.SEARCH_RATE_LIMIT_MAX || '60', 10), // 60 búsquedas
      message: 'Search rate limit exceeded.'
    });
  }

  /**
   * Rate limiter para creación de pedidos
   * Límites realistas: 20 pedidos en 5 minutos
   */
  createOrderRateLimit(): any {
    return this.createRateLimit({
      windowMs: parseInt(process.env.ORDER_RATE_LIMIT_WINDOW_MS || '300000', 10), // 5 minutos
      max: parseInt(process.env.ORDER_RATE_LIMIT_MAX || '20', 10), // 20 pedidos
      message: 'Too many order attempts, please try again later.'
    });
  }

  /**
   * Rate limiter para pagos
   * Límites realistas: 15 intentos en 10 minutos (permite reintentos por errores)
   */
  createPaymentRateLimit(): any {
    return this.createRateLimit({
      windowMs: 10 * 60 * 1000, // 10 minutos
      max: 15, // 15 intentos de pago
      message: 'Payment rate limit exceeded.',
      skipSuccessfulRequests: true
    });
  }
}

export interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}
