/**
 * Middleware de autenticación para Auto-Purchase Service
 * Valida tokens JWT y verifica permisos de usuario
 * 
 * Este servicio es CRÍTICO ya que maneja compras automáticas.
 * Todas las rutas de negocio deben estar protegidas.
 */

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '@technovastore/shared-types';
import { logger } from '../utils/logger';
import { getAuthToken } from '@technovastore/shared-utils';

// Validación de JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  logger.error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not set');
  throw new Error('JWT_SECRET must be configured. Application cannot start.');
}

if (JWT_SECRET.length < 32) {
  logger.warn('WARNING: JWT_SECRET is shorter than 32 characters. Consider using a longer secret for better security.');
}

/**
 * Middleware de autenticación
 * Valida el token JWT y añade información del usuario al request
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
      logger.warn('Authentication failed - No token provided', {
        ip: req.ip,
        endpoint: req.path,
        method: req.method,
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
    logger.error('Authentication error', {
      message: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      endpoint: req.path,
    });
    
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
 * @param roles - Array de roles permitidos
 */
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }
    
    if (!roles.includes(req.user.role)) {
      logger.warn('Unauthorized access attempt - Insufficient role', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        endpoint: req.path,
        method: req.method,
      });
      
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }
    
    return next();
  };
};
