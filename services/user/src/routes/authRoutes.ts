import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import {
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validatePasswordResetRequest,
  validatePasswordReset,
} from '../validators/authValidator';

export const authRoutes = Router();

// Public routes
authRoutes.post('/register', validateRegister, AuthController.register);
authRoutes.post('/login', validateLogin, AuthController.login);
authRoutes.post('/refresh', validateRefreshToken, AuthController.refreshToken);
authRoutes.post('/logout', AuthController.logout);
authRoutes.post('/password-reset/request', validatePasswordResetRequest, AuthController.requestPasswordReset);
authRoutes.post('/password-reset/confirm', validatePasswordReset, AuthController.resetPassword);

// Protected routes
authRoutes.get('/me', authMiddleware, AuthController.me);
authRoutes.post('/validate', AuthController.validateToken);
authRoutes.post('/revoke', authMiddleware, AuthController.revokeRefreshToken);