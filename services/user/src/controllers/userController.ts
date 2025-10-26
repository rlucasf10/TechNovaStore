import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthService } from '../services/authService';
import { User } from '../models/User';
import { asyncHandler } from '../../../../shared/middleware/errorHandler';
import { AuthenticatedRequest } from '@technovastore/shared-types';
import { logger } from '../utils/logger';

export class UserController {
  static getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated',
      });
    }

    const user = await AuthService.getUserById(parseInt(userId));
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    return res.json({
      success: true,
      data: user.toJSON(),
    });
  });

  static updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated',
      });
    }

    const user = await AuthService.updateUser(parseInt(userId), req.body);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    logger.info(`User profile updated: ${user.email}`, { userId: user.id });

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user.toJSON(),
    });
  });

  static changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const userId = req.headers['x-user-id'] as string;
    const { currentPassword, newPassword } = req.body;
    
    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated',
      });
    }

    const user = await User.findByPk(parseInt(userId));
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    // Validate current password
    const isValidPassword = await user.validatePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({
        error: 'Current password is incorrect',
      });
    }

    // Update password
    const password_hash = await User.hashPassword(newPassword);
    await user.update({ password_hash });

    logger.info(`Password changed for user: ${user.email}`, { userId: user.id });

    return res.json({
      success: true,
      message: 'Password changed successfully',
    });
  });

  static deleteAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated',
      });
    }

    const success = await AuthService.deactivateUser(parseInt(userId));
    
    if (!success) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    return res.json({
      success: true,
      message: 'Account deactivated successfully',
    });
  });

  // Admin only endpoints
  static getAllUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = req.headers['x-user-role'] as string;
    
    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    return res.json({
      success: true,
      data: users.map(user => user.toJSON()),
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  });

  static getUserById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = req.headers['x-user-role'] as string;
    const requestingUserId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    
    // Users can only view their own profile unless they're admin
    if (userRole !== 'admin' && requestingUserId !== id) {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    const user = await AuthService.getUserById(parseInt(id));
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    return res.json({
      success: true,
      data: user.toJSON(),
    });
  });

  static updateUserRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = req.headers['x-user-role'] as string;
    
    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!['customer', 'admin'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
      });
    }

    const user = await AuthService.updateUser(parseInt(id), { role });
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    logger.info(`User role updated: ${user.email} -> ${role}`, { 
      userId: user.id,
      adminId: req.headers['x-user-id'],
    });

    return res.json({
      success: true,
      message: 'User role updated successfully',
      data: user.toJSON(),
    });
  });
}