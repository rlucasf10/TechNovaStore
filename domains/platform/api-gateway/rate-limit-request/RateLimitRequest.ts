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
   * Rate limiter para endpoints de autenticación (más estricto)
   */
  createAuthRateLimit(): any {
    return this.createRateLimit({
      windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutos
      max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5', 10), // 5 intentos
      message: 'Too many authentication attempts, please try again later.',
      skipSuccessfulRequests: true
    });
  }

  /**
   * Rate limiter para API general
   */
  createApiRateLimit(): any {
    return this.createRateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutos
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 peticiones
      message: 'API rate limit exceeded, please try again later.'
    });
  }

  /**
   * Rate limiter estricto para operaciones sensibles
   */
  createStrictRateLimit(): any {
    return this.createRateLimit({
      windowMs: 5 * 60 * 1000, // 5 minutos
      max: 10, // 10 peticiones por ventana
      message: 'Rate limit exceeded for sensitive operations.'
    });
  }

  /**
   * Rate limiter para búsquedas
   */
  createSearchRateLimit(): any {
    return this.createRateLimit({
      windowMs: parseInt(process.env.SEARCH_RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minuto
      max: parseInt(process.env.SEARCH_RATE_LIMIT_MAX || '30', 10), // 30 búsquedas
      message: 'Search rate limit exceeded.'
    });
  }

  /**
   * Rate limiter para creación de pedidos
   */
  createOrderRateLimit(): any {
    return this.createRateLimit({
      windowMs: parseInt(process.env.ORDER_RATE_LIMIT_WINDOW_MS || '300000', 10), // 5 minutos
      max: parseInt(process.env.ORDER_RATE_LIMIT_MAX || '10', 10), // 10 pedidos
      message: 'Too many order attempts, please try again later.'
    });
  }

  /**
   * Rate limiter para pagos (muy estricto)
   */
  createPaymentRateLimit(): any {
    return this.createRateLimit({
      windowMs: 10 * 60 * 1000, // 10 minutos
      max: 5, // 5 intentos de pago
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
