import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@technovastore/shared-config';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '@technovastore/shared-types';
import axios from 'axios';

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Validate token with user service for enhanced security
    try {
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3002';
      const response = await axios.post(`${userServiceUrl}/auth/validate`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        timeout: 5000, // 5 second timeout
      });

      if (response.data.success && response.data.data) {
        const userData = response.data.data;
        req.user = userData;
        // Add user info to headers for downstream services
        req.headers['x-user-id'] = userData.id.toString();
        req.headers['x-user-email'] = userData.email;
        req.headers['x-user-role'] = userData.role;
        return next();
      }
    } catch (serviceError) {
      // Fallback to local JWT validation if user service is unavailable
      logger.warn('User service unavailable, falling back to local JWT validation', serviceError);
    }

    // Fallback JWT validation
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    // Add user info to headers for downstream services
    req.headers['x-user-id'] = req.user.id.toString();
    req.headers['x-user-email'] = req.user.email;
    req.headers['x-user-role'] = req.user.role;

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

export const optionalAuth = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    return next();
  } catch (error) {
    // For optional auth, we don't fail on invalid tokens
    logger.warn('Optional auth failed:', error);
    return next();
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