import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@technovastore/shared-types';

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Get user info from API Gateway headers
  const userId = req.headers['x-user-id'] as string;
  const userRole = req.headers['x-user-role'] as string;
  
  if (!userId || !userRole) {
    return res.status(401).json({
      error: 'Authentication required',
    });
  }

  req.user = {
    id: userId,
    email: '', // Will be populated if needed
    role: userRole,
  };
  
  return next();
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