import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../shared/utils/logger';

/**
 * Caso de uso: Validate CSRF Token
 * 
 * Genera y valida tokens CSRF para proteger contra ataques
 * Cross-Site Request Forgery.
 */
export class ValidateCsrfToken {
  private csrfTokens: Map<string, TokenData>;

  constructor() {
    this.csrfTokens = new Map();
  }

  /**
   * Genera un token CSRF para una sesión
   */
  generateToken(sessionId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + (24 * 60 * 60 * 1000); // 24 horas

    this.csrfTokens.set(sessionId, { token, expires });

    // Limpiar tokens expirados
    this.cleanupExpiredTokens();

    return token;
  }

  /**
   * Valida el token CSRF de una petición
   */
  execute(req: Request, res: Response, next: NextFunction): void {
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

    const tokenData = this.csrfTokens.get(sessionId);

    if (!tokenData || tokenData.expires < Date.now()) {
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

    if (tokenData.token !== csrfToken) {
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

    next();
  }

  /**
   * Limpia tokens CSRF expirados
   */
  private cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [sessionId, tokenData] of this.csrfTokens.entries()) {
      if (tokenData.expires < now) {
        this.csrfTokens.delete(sessionId);
      }
    }
  }

  /**
   * Obtiene el número de tokens activos (para testing)
   */
  getActiveTokensCount(): number {
    this.cleanupExpiredTokens();
    return this.csrfTokens.size;
  }

  /**
   * Limpia todos los tokens (para testing)
   */
  clearAllTokens(): void {
    this.csrfTokens.clear();
  }
}

interface TokenData {
  token: string;
  expires: number;
}
