import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authMiddleware, requireRole } from '../middleware/auth';
import {
  validateUpdateProfile,
  validateChangePassword,
  validateUserId,
  validateUserQuery,
  validateUpdateRole,
} from '../validators/userValidator';

export const userRoutes = Router();

// All user routes require authentication
userRoutes.use(authMiddleware);

// User profile management
userRoutes.get('/profile', UserController.getProfile);
userRoutes.put('/profile', validateUpdateProfile, UserController.updateProfile);
userRoutes.post('/change-password', validateChangePassword, UserController.changePassword);
userRoutes.delete('/account', UserController.deleteAccount);

// Admin only routes
userRoutes.get('/', requireRole(['admin']), validateUserQuery, UserController.getAllUsers);
userRoutes.get('/:id', validateUserId, UserController.getUserById);
userRoutes.put('/:id/role', requireRole(['admin']), validateUpdateRole, UserController.updateUserRole);