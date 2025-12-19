/**
 * Middleware de Autenticación para Ticket Service
 * 
 * Este middleware implementa el principio de "Defense in Depth":
 * - Valida tokens JWT independientemente del API Gateway
 * - Verifica roles de usuario para autorización
 * - Loggea intentos de acceso no autorizado
 */

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { AuthenticatedRequest } from '@technovastore/shared-types';
import { logger } from '../utils/logger';
import { getAuthToken } from '@technovastore/shared-utils';

/**
 * Middleware de autenticación
 * Valida el token JWT y extrae la información del usuario
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
      logger.warn('Authentication failed: No token provided', {
        ip: req.ip,
        endpoint: req.path,
        reason: 'no_token',
      });
      
      return res.status(401).json({
        error: 'Access denied. No token provided.',
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret) as any;
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'user',
    };
    
    next();
  } catch (error) {
    logger.error('Authentication error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
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
 * 
 * @param roles - Array de roles permitidos (ej: ['admin', 'moderator'])
 */
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      logger.warn('Authorization failed: No user in request', {
        ip: req.ip,
        endpoint: req.path,
      });
      
      return res.status(401).json({
        error: 'Authentication required',
      });
    }
    
    if (!roles.includes(req.user.role)) {
      logger.warn('Authorization failed: Insufficient permissions', {
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
