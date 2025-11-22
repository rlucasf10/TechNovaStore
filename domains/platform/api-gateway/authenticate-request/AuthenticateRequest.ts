import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../shared/utils/logger';
import { AuthenticatedRequest } from '@technovastore/shared-types';
import axios from 'axios';

/**
 * Caso de uso: Authenticate Request
 * 
 * Autentica peticiones HTTP usando tokens JWT.
 * Valida el token con el servicio de usuarios y extrae información del usuario.
 */
export class AuthenticateRequest {
  private userServiceUrl: string;

  constructor(userServiceUrl?: string) {
    this.userServiceUrl = userServiceUrl || process.env.USER_SERVICE_URL || 'http://localhost:3002';
  }

  /**
   * Ejecuta la autenticación de la petición
   */
  async execute(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          error: 'Access denied. No token provided.',
        });
        return;
      }

      const token = authHeader.substring(7); // Remover prefijo 'Bearer '

      // Validar token con el servicio de usuarios para seguridad mejorada
      try {
        const response = await axios.post(`${this.userServiceUrl}/auth/validate`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          timeout: 5000, // 5 segundos de timeout
        });

        if (response.data.success && response.data.data) {
          const userData = response.data.data;
          req.user = userData;
          // Agregar información del usuario a los headers para servicios downstream
          req.headers['x-user-id'] = userData.id.toString();
          req.headers['x-user-email'] = userData.email;
          req.headers['x-user-role'] = userData.role;
          next();
          return;
        }
      } catch (serviceError) {
        // Fallback a validación JWT local si el servicio de usuarios no está disponible
        logger.warn('User service unavailable, falling back to local JWT validation', serviceError);
      }

      // Validación JWT de fallback
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };

      // Agregar información del usuario a los headers para servicios downstream
      req.headers['x-user-id'] = req.user.id.toString();
      req.headers['x-user-email'] = req.user.email;
      req.headers['x-user-role'] = req.user.role;

      next();
    } catch (error) {
      logger.error('Authentication error:', error);

      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          error: 'Token expired',
        });
        return;
      }

      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          error: 'Invalid token',
        });
        return;
      }

      res.status(500).json({
        error: 'Authentication service error',
      });
    }
  }

  /**
   * Autenticación opcional - no falla si no hay token
   */
  async executeOptional(req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next();
        return;
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (error) {
      // Para autenticación opcional, no fallamos en tokens inválidos
      logger.warn('Optional auth failed:', error);
      next();
    }
  }

  /**
   * Verifica que el usuario tenga uno de los roles requeridos
   */
  requireRole(roles: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        res.status(401).json({
          error: 'Authentication required',
        });
        return;
      }

      if (!roles.includes(req.user.role)) {
        res.status(403).json({
          error: 'Insufficient permissions',
        });
        return;
      }

      next();
    };
  }
}

// Exportar instancia singleton y funciones middleware para compatibilidad
const authenticateRequestInstance = new AuthenticateRequest();

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => 
  authenticateRequestInstance.execute(req, res, next);

export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => 
  authenticateRequestInstance.executeOptional(req, res, next);

export const requireRole = (roles: string[]) => 
  authenticateRequestInstance.requireRole(roles);
