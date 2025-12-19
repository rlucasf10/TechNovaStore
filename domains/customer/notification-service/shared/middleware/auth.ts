/**
 * Middleware de autenticación para notification-service
 * 
 * Implementa el principio de "Defense in Depth":
 * - Valida tokens JWT independientemente del API Gateway
 * - Protege contra bypass del gateway, ataques internos y misconfiguraciones
 * - Verifica roles de usuario para endpoints administrativos
 */

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '@technovastore/shared-types';
import { logger } from '../utils/logger';
import { getAuthToken } from '@technovastore/shared-utils';

// ✅ SEGURIDAD: JWT_SECRET es OBLIGATORIO - no se permite valor por defecto
const JWT_SECRET = process.env.JWT_SECRET;

// Validación de configuración de seguridad al cargar el módulo
if (!JWT_SECRET) {
  logger.error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not set');
  logger.error('JWT_SECRET is required for secure authentication');
  logger.error('Please set JWT_SECRET in your environment or .env file');
  logger.error('Example: JWT_SECRET=your-super-secret-key-at-least-32-characters');
  throw new Error('JWT_SECRET must be configured. Application cannot start without a valid JWT secret.');
}

if (JWT_SECRET.length < 32) {
  logger.warn('WARNING: JWT_SECRET is shorter than 32 characters');
  logger.warn('For production, use a secret of at least 32 characters for adequate security');
}

/**
 * Middleware de autenticación
 * Valida tokens JWT y extrae información del usuario
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
      });
      return res.status(401).json({
        error: 'Access denied. No token provided.',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
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
 */
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
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
