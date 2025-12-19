import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../shared/utils/logger';
import { AuthenticatedRequest } from '@technovastore/shared-types';
import axios from 'axios';
import { getAuthToken } from '@technovastore/shared-utils';

/**
 * Caso de uso: Authenticate Request
 * 
 * Autentica peticiones HTTP usando tokens JWT.
 * Valida el token con el servicio de usuarios y extrae información del usuario.
 * 
 * AUTENTICACIÓN CON HTTPONLY COOKIES:
 * Este middleware lee tokens JWT desde httpOnly cookies como método principal,
 * manteniendo el header Authorization como fallback para compatibilidad.
 * 
 * Las httpOnly cookies son más seguras que localStorage ya que:
 * - No son accesibles desde JavaScript (protección contra XSS)
 * - Se envían automáticamente en cada request
 * - Pueden configurarse con flags Secure y SameSite para mayor seguridad
 * 
 * El fallback a Authorization header permite:
 * - Migración gradual desde tokens en headers a cookies
 * - Compatibilidad con clientes que no soportan cookies (APIs, mobile apps)
 */
export class AuthenticateRequest {
  private userServiceUrl: string;

  constructor(userServiceUrl?: string) {
    this.userServiceUrl = userServiceUrl || process.env.USER_SERVICE_URL || 'http://localhost:3002';
  }

  /**
   * Ejecuta la autenticación de la petición
   * 
   * Lee el token desde:
   * 1. Cookie httpOnly (prioridad)
   * 2. Authorization header (fallback)
   */
  async execute(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Leer token desde cookie (con fallback a Authorization header)
      const token = getAuthToken(req);

      if (!token) {
        logger.debug('[Auth] No se encontró token en cookie ni en Authorization header');
        res.status(401).json({
          error: 'Access denied. No token provided.',
        });
        return;
      }

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
      // Manejar errores de JWT específicamente
      if (error instanceof jwt.TokenExpiredError) {
        logger.debug('Token expired');
        res.status(401).json({
          error: 'Token expired',
        });
        return;
      }

      if (error instanceof jwt.JsonWebTokenError) {
        logger.debug('Invalid token:', error.message);
        res.status(401).json({
          error: 'Invalid token',
        });
        return;
      }

      // Para otros errores, loguear de forma segura (solo mensaje, no objeto completo)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Authentication error:', { message: errorMessage });

      res.status(401).json({
        error: 'Authentication failed',
      });
    }
  }

  /**
   * Autenticación opcional - no falla si no hay token
   * 
   * Lee el token desde:
   * 1. Cookie httpOnly (prioridad)
   * 2. Authorization header (fallback)
   */
  async executeOptional(req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> {
    try {
      // Leer token desde cookie (con fallback a Authorization header)
      const token = getAuthToken(req);

      if (!token) {
        logger.debug('[Auth] Autenticación opcional: no se encontró token');
        next();
        return;
      }

      const decoded = jwt.verify(token, config.jwt.secret) as any;
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (error) {
      // Para autenticación opcional, no fallamos en tokens inválidos
      logger.warn('[Auth] Autenticación opcional falló:', error);
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
