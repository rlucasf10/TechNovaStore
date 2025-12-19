/**
 * Middleware de autenticación para sync-engine
 * 
 * Implementa el principio de "Defense in Depth":
 * - Valida tokens JWT independientemente del API Gateway
 * - Verifica roles de usuario para endpoints administrativos
 * - Loggea intentos de acceso no autorizado
 */

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '@technovastore/shared-types';
import { createLogger } from '@technovastore/shared-config';
import { getAuthToken } from '@technovastore/shared-utils';

const logger = createLogger('sync-engine-auth');

// Obtener JWT_SECRET de las variables de entorno
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  logger.error('JWT_SECRET no está configurado en las variables de entorno');
  throw new Error('JWT_SECRET is required');
}

/**
 * Middleware de autenticación
 * 
 * Valida el token JWT y extrae la información del usuario.
 * Soporta dos flujos:
 * 1. Headers del API Gateway (x-user-id, x-user-role) - ya validados
 * 2. Token JWT directo (cookie httpOnly o Authorization header) - validación local
 */
export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Verificar si la información del usuario viene del API Gateway
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    
    if (userId && userRole) {
      req.user = {
        id: userId,
        email: '',
        role: userRole,
      };
      return next();
    }

    // ✅ SEGURIDAD: Leer token desde cookie httpOnly (prioridad) o Authorization header (fallback)
    const token = getAuthToken(req);
    
    if (!token) {
      logger.warn('Intento de acceso sin token', {
        ip: req.ip,
        endpoint: req.path,
      });
      return res.status(401).json({
        error: 'Access denied. No token provided.',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    
    next();
  } catch (error) {
    logger.error('Error de autenticación:', error);
    
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
 * 
 * Verifica que el usuario tenga uno de los roles requeridos.
 * Debe usarse después de authMiddleware.
 * 
 * @param roles - Array de roles permitidos (ej: ['admin', 'moderator'])
 * @returns Middleware de Express
 */
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      logger.warn('Intento de acceso sin autenticación', {
        endpoint: req.path,
      });
      return res.status(401).json({
        error: 'Authentication required',
      });
    }
    
    if (!roles.includes(req.user.role)) {
      logger.warn('Intento de acceso sin permisos suficientes', {
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
