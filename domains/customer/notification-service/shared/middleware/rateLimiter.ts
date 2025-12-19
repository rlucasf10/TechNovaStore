/**
 * Middleware de Rate Limiting para notification-service
 * 
 * Protege el servicio contra ataques DoS y abuso de la API
 * limitando el número de requests por IP en una ventana de tiempo.
 * 
 * Configuración: 100 requests por 15 minutos (según Requirements 7.1, 7.2, 7.3, 7.4)
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

/**
 * Configuración del rate limiter para el notification-service
 * - 100 requests máximo por ventana de 15 minutos
 * - Excluye endpoints de health check
 * - Incluye headers estándar de rate limit
 * - Loggea cuando se excede el límite
 */
export const apiRateLimiter = rateLimit({
  // Ventana de tiempo: 15 minutos
  windowMs: 15 * 60 * 1000,
  
  // Máximo de requests por ventana
  max: 100,
  
  // Mensaje de error cuando se excede el límite
  message: {
    error: 'Too many requests',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  
  // Usar headers estándar (RateLimit-*)
  standardHeaders: true,
  
  // No usar headers legacy (X-RateLimit-*)
  legacyHeaders: false,
  
  // Función para saltar ciertos requests (health checks)
  skip: (req: Request) => {
    // Excluir health checks del rate limiting
    return req.path === '/health' || req.path === '/metrics';
  },
  
  // Handler personalizado cuando se excede el límite
  handler: (req: Request, res: Response) => {
    // Loggear el evento de rate limit excedido
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      endpoint: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      service: 'notification-service'
    });
    
    // Responder con 429 Too Many Requests
    res.status(429).json({
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes'
    });
  },
  
  // Función para generar la clave de identificación (por defecto usa IP)
  keyGenerator: (req: Request) => {
    // Usar X-Forwarded-For si está detrás de un proxy, sino usar IP directa
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
});

export default apiRateLimiter;
