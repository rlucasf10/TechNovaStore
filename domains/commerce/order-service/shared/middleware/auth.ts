import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@technovastore/shared-types';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

/**
 * Middleware de autenticación con JWT
 * Implementa Defense in Depth - valida tokens directamente sin depender del API Gateway
 */
export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Intentar obtener el token del header Authorization (Bearer token)
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      logger.info('Token encontrado en Authorization header', {
        endpoint: req.path,
        method: req.method
      });
    }

    // Si no hay token, verificar headers del API Gateway (fallback para compatibilidad)
    if (!token) {
      const userId = req.headers['x-user-id'] as string;
      const userRole = req.headers['x-user-role'] as string;
      
      if (userId && userRole) {
        logger.info('Usando headers del API Gateway', {
          userId,
          userRole,
          endpoint: req.path
        });
        req.user = {
          id: userId,
          email: '',
          role: userRole,
        };
        return next();
      }
      
      logger.warn('No se encontró token ni headers del API Gateway', {
        endpoint: req.path,
        method: req.method,
        ip: req.ip
      });
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    // Validar el token JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET no está configurado', {
        service: 'auth-middleware',
        critical: true
      });
      return res.status(500).json({
        error: 'Server configuration error',
      });
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    
    req.user = {
      id: decoded.id,
      email: decoded.email || '',
      role: decoded.role,
    };

    logger.info('Usuario autenticado', {
      userId: decoded.id,
      role: decoded.role,
      endpoint: req.path
    });
    return next();
  } catch (error: any) {
    logger.error('Error de autenticación', {
      error: error.message,
      endpoint: req.path,
      ip: req.ip
    });
    return res.status(401).json({
      error: 'Invalid or expired token',
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }
    
    return next();
  };
};