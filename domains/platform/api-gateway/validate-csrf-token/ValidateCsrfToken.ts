import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../shared/utils/logger';
import { getRedisClient } from '../shared/utils/redis';
import type Redis from 'ioredis';

/**
 * Caso de uso: Validate CSRF Token
 * 
 * Genera y valida tokens CSRF para proteger contra ataques
 * Cross-Site Request Forgery usando Redis para persistencia.
 * 
 * Ventajas de usar Redis:
 * - Persistencia entre reinicios del servidor
 * - Funciona con múltiples instancias (escalabilidad horizontal)
 * - TTL automático para expiración de tokens
 * - Alto rendimiento
 */
export class ValidateCsrfToken {
  private redis: Redis;
  private readonly TOKEN_PREFIX = 'csrf:';
  private readonly TOKEN_EXPIRY_SECONDS = 24 * 60 * 60; // 24 horas

  constructor() {
    this.redis = getRedisClient();
  }

  /**
   * Genera un token CSRF para una sesión y lo almacena en Redis
   */
  async generateToken(sessionId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const key = `${this.TOKEN_PREFIX}${sessionId}`;

    try {
      // Almacenar en Redis con TTL automático
      await this.redis.setex(key, this.TOKEN_EXPIRY_SECONDS, token);
      
      logger.debug('CSRF token generated', {
        sessionId,
        expiresIn: `${this.TOKEN_EXPIRY_SECONDS}s`,
      });

      return token;
    } catch (error) {
      logger.error('Error generating CSRF token in Redis:', error);
      throw new Error('Failed to generate CSRF token');
    }
  }

  /**
   * Valida el token CSRF de una petición consultando Redis
   */
  async execute(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Omitir CSRF para peticiones GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      next();
      return;
    }

    const sessionId = req.headers['x-session-id'] as string;
    const csrfToken = req.headers['x-csrf-token'] as string;

    if (!sessionId || !csrfToken) {
      logger.warn('CSRF protection: Missing session ID or CSRF token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url
      });
      res.status(403).json({
        error: 'CSRF token required',
        code: 'CSRF_TOKEN_MISSING'
      });
      return;
    }

    try {
      const key = `${this.TOKEN_PREFIX}${sessionId}`;
      const storedToken = await this.redis.get(key);

      if (!storedToken) {
        logger.warn('CSRF protection: Invalid or expired token', {
          ip: req.ip,
          sessionId,
          url: req.url
        });
        res.status(403).json({
          error: 'Invalid or expired CSRF token',
          code: 'CSRF_TOKEN_INVALID'
        });
        return;
      }

      if (storedToken !== csrfToken) {
        logger.warn('CSRF protection: Token mismatch', {
          ip: req.ip,
          sessionId,
          url: req.url
        });
        res.status(403).json({
          error: 'CSRF token mismatch',
          code: 'CSRF_TOKEN_MISMATCH'
        });
        return;
      }

      // Token válido - continuar
      next();
    } catch (error) {
      logger.error('Error validating CSRF token:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'CSRF_VALIDATION_ERROR'
      });
    }
  }

  /**
   * Elimina un token CSRF específico (útil para logout)
   */
  async deleteToken(sessionId: string): Promise<void> {
    try {
      const key = `${this.TOKEN_PREFIX}${sessionId}`;
      await this.redis.del(key);
      logger.debug('CSRF token deleted', { sessionId });
    } catch (error) {
      logger.error('Error deleting CSRF token:', error);
    }
  }

  /**
   * Obtiene el número de tokens activos (para testing y monitoreo)
   */
  async getActiveTokensCount(): Promise<number> {
    try {
      const keys = await this.redis.keys(`${this.TOKEN_PREFIX}*`);
      return keys.length;
    } catch (error) {
      logger.error('Error getting active tokens count:', error);
      return 0;
    }
  }

  /**
   * Limpia todos los tokens (para testing)
   */
  async clearAllTokens(): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.TOKEN_PREFIX}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      logger.debug('All CSRF tokens cleared');
    } catch (error) {
      logger.error('Error clearing all tokens:', error);
    }
  }

  /**
   * Renueva el TTL de un token existente (útil para sesiones activas)
   */
  async renewToken(sessionId: string): Promise<boolean> {
    try {
      const key = `${this.TOKEN_PREFIX}${sessionId}`;
      const exists = await this.redis.exists(key);
      
      if (exists) {
        await this.redis.expire(key, this.TOKEN_EXPIRY_SECONDS);
        logger.debug('CSRF token TTL renewed', { sessionId });
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Error renewing CSRF token:', error);
      return false;
    }
  }
}
