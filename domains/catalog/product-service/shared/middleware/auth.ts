import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '@technovastore/shared-types';
import { logger } from '../infrastructure/logger';
import { getAuthToken } from '@technovastore/shared-utils';

/**
 * Configuración JWT
 * IMPORTANTE: Debe usar el mismo JWT_SECRET que user-service
 * La variable de entorno JWT_SECRET está definida en .env.shared
 */
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware de autenticación
 * Valida tokens JWT desde cookies httpOnly o Authorization header
 * Implementa defense in depth - valida tokens incluso si vienen del API Gateway
 */
export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // ✅ DEFENSE IN DEPTH: Siempre verificar el token JWT
    // NO confiar en headers x-user-id/x-user-role del API Gateway
    // porque podrían ser falsificados si el Gateway es comprometido
    
    // ✅ SEGURIDAD: Leer token desde cookie httpOnly (prioridad) o Authorization header (fallback)
    const token = getAuthToken(req);
    
    if (!token) {
      logger.warn('No token provided', { ip: req.ip, endpoint: req.path });
      return res.status(401).json({
        error: 'Access denied. No token provided.',
      });
    }

    // Log para debug: mostrar de dónde viene el token
    if (req.cookies?.auth_token) {
      logger.debug('Token found in cookie');
    } else if (req.headers.authorization) {
      logger.debug('Token found in Authorization header (fallback)');
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Log para debug: mostrar el contenido decodificado
    logger.debug('Token decoded', { userId: decoded.id, role: decoded.role });
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    
    return next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Token expired',
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Invalid token',
      });
    }
    
    return res.status(500).json({
      error: 'Authentication service error',
    });
  }
};

/**
 * Middleware de autorización por rol
 * Verifica que el usuario tenga uno de los roles requeridos
 * @param roles - Array de roles permitidos (ej: ['admin', 'moderator'])
 */
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    logger.debug('Verifying role', { user: req.user?.id, requiredRoles: roles });
    
    if (!req.user) {
      logger.warn('No user in request', { endpoint: req.path });
      return res.status(401).json({
        error: 'Authentication required',
      });
    }
    
    logger.debug('Role comparison', { userRole: req.user?.role, requiredRoles: roles });
    
    if (!roles.includes(req.user.role)) {
      logger.warn('Unauthorized access attempt', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        endpoint: req.path,
      });
      
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }
    
    return next();
  };
};
