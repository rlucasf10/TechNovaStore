import { Request, Response, NextFunction } from 'express';
import DOMPurify from 'isomorphic-dompurify';
import { logger } from '../shared/utils/logger';

/**
 * Caso de uso: Sanitize Input
 * 
 * Sanitiza la entrada del usuario para prevenir ataques XSS
 * y otros tipos de inyección de código malicioso.
 */
export class SanitizeInput {
  /**
   * Sanitiza la petición completa (body, query, params)
   */
  execute(req: Request, res: Response, next: NextFunction): void {
    // Sanitizar body
    if (req.body && typeof req.body === 'object') {
      req.body = this.sanitizeObject(req.body);
    }

    // Sanitizar query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = this.sanitizeObject(req.query);
    }

    // Sanitizar params
    if (req.params && typeof req.params === 'object') {
      req.params = this.sanitizeObject(req.params);
    }

    // Establecer headers de protección XSS
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    next();
  }

  /**
   * Sanitiza recursivamente un objeto
   */
  sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitizar nombres de claves también
        const sanitizedKey = this.sanitizeString(key);
        sanitized[sanitizedKey] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Sanitiza una cadena de texto
   */
  sanitizeString(str: string): string {
    return DOMPurify.sanitize(str, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
  }

  /**
   * Detecta patrones sospechosos en el contenido
   */
  detectSuspiciousPatterns(content: string): SuspiciousPattern[] {
    const patterns: SuspiciousPattern[] = [];

    // Detectar SQL injection
    const sqlPattern = /(\b(union|select|insert|delete|update|drop|create|alter|exec|execute)\b)|('|(\\x27)|(\\x2D\\x2D))/gi;
    if (sqlPattern.test(content)) {
      patterns.push({
        type: 'SQL_INJECTION',
        severity: 'HIGH',
        pattern: 'SQL injection attempt detected'
      });
    }

    // Detectar XSS
    const xssPattern = /<script[^>]*>.*?<\/script>|javascript:|on\w+\s*=/gi;
    if (xssPattern.test(content)) {
      patterns.push({
        type: 'XSS',
        severity: 'HIGH',
        pattern: 'XSS attempt detected'
      });
    }

    // Detectar path traversal
    const pathTraversalPattern = /\.\.[\/\\]/g;
    if (pathTraversalPattern.test(content)) {
      patterns.push({
        type: 'PATH_TRAVERSAL',
        severity: 'MEDIUM',
        pattern: 'Path traversal attempt detected'
      });
    }

    // Detectar command injection
    const commandPattern = /[;&|`$()]/g;
    if (commandPattern.test(content)) {
      patterns.push({
        type: 'COMMAND_INJECTION',
        severity: 'HIGH',
        pattern: 'Command injection attempt detected'
      });
    }

    return patterns;
  }

  /**
   * Valida el contenido de la petición
   */
  validateContent(req: Request, res: Response, next: NextFunction): void {
    if (req.body && typeof req.body === 'object') {
      const bodyString = JSON.stringify(req.body);
      const suspiciousPatterns = this.detectSuspiciousPatterns(bodyString);

      if (suspiciousPatterns.length > 0) {
        logger.warn('Suspicious content detected', {
          ip: req.ip,
          url: req.url,
          userAgent: req.get('User-Agent'),
          patterns: suspiciousPatterns
        });

        res.status(400).json({
          error: 'Invalid request content',
          code: 'INVALID_CONTENT'
        });
        return;
      }
    }

    next();
  }
}

export interface SuspiciousPattern {
  type: 'SQL_INJECTION' | 'XSS' | 'PATH_TRAVERSAL' | 'COMMAND_INJECTION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  pattern: string;
}
