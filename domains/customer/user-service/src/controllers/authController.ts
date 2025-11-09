import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthService, LoginCredentials, RegisterData } from '../services/authService';
import { OAuthService } from '../services/oauthService';
import { OAuthProvider } from '../config/oauth';
import { asyncHandler } from '@technovastore/shared-utils';
import { logger } from '../utils/logger';

export class AuthController {
  static register = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    try {
      const registerData: RegisterData = req.body;
      const result = await AuthService.register(registerData);

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error: any) {
      if (error.message === 'User already exists with this email') {
        return res.status(409).json({
          error: error.message,
        });
      }
      throw error;
    }
  });

  static login = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    try {
      const credentials: LoginCredentials = req.body;
      const result = await AuthService.login(credentials);

      return res.json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error: any) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({
          error: 'Invalid email or password',
        });
      }
      throw error;
    }
  });

  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token is required',
      });
    }

    try {
      const tokens = await AuthService.refreshToken(refreshToken);

      return res.json({
        success: true,
        data: { tokens },
      });
    } catch (error: any) {
      return res.status(401).json({
        error: 'Invalid refresh token',
      });
    }
  });

  static logout = asyncHandler(async (_req: Request, res: Response) => {
    // In a more complete implementation, you might want to blacklist the token
    // For now, we'll just return success as the client should discard the token
    return res.json({
      success: true,
      message: 'Logged out successfully',
    });
  });

  static me = asyncHandler(async (req: Request, res: Response) => {
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

  static requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    try {
      const { email } = req.body;
      await AuthService.requestPasswordReset(email);

      // Always return success to prevent email enumeration
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });
    } catch (error: any) {
      // Log the actual error but return generic message
      console.error('Password reset request error:', error);
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });
    }
  });

  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    try {
      const { token, newPassword } = req.body;
      await AuthService.resetPassword(token, newPassword);

      return res.json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error: any) {
      return res.status(400).json({
        error: error.message,
      });
    }
  });

  static validateToken = asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No token provided',
      });
    }

    const token = authHeader.substring(7);
    const result = await AuthService.validateAccessToken(token);

    if (!result.valid) {
      return res.status(401).json({
        error: result.error,
      });
    }

    return res.json({
      success: true,
      data: result.user,
    });
  });

  static revokeRefreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token is required',
      });
    }

    try {
      const revoked = await AuthService.revokeRefreshToken(refreshToken);
      
      if (!revoked) {
        return res.status(404).json({
          error: 'Refresh token not found',
        });
      }

      return res.json({
        success: true,
        message: 'Refresh token revoked successfully',
      });
    } catch (error: any) {
      return res.status(400).json({
        error: error.message,
      });
    }
  });

  /**
   * Callback de OAuth 2.0
   * Procesa el código de autorización y crea/actualiza el usuario
   */
  static oauthCallback = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    try {
      const { provider, code, codeVerifier } = req.body;

      logger.info(`OAuth callback received for ${provider}`);

      // 1. Intercambiar código por access token
      const accessToken = await OAuthService.exchangeCodeForToken(
        provider as OAuthProvider,
        code,
        codeVerifier
      );

      // 2. Obtener información del usuario del proveedor
      const userInfo = await OAuthService.getUserInfo(
        provider as OAuthProvider,
        accessToken
      );

      // 3. Crear o actualizar usuario en nuestra base de datos
      const user = await OAuthService.createOrUpdateOAuthUser(
        provider as OAuthProvider,
        userInfo
      );

      // 4. Generar nuestros propios tokens JWT
      const tokens = await AuthService.generateTokensForUser(user);

      logger.info(`OAuth login successful for user: ${user.email}`, { 
        userId: user.id, 
        provider 
      });

      return res.json({
        success: true,
        message: 'OAuth authentication successful',
        data: {
          user: user.toJSON(),
          tokens,
        },
      });
    } catch (error: any) {
      logger.error('OAuth callback error:', error);
      
      if (error.message.includes('No email found')) {
        return res.status(400).json({
          error: 'No email found in OAuth account. Please ensure your account has a verified email.',
        });
      }

      return res.status(400).json({
        error: error.message || 'OAuth authentication failed',
      });
    }
  });

  /**
   * Obtener métodos de autenticación del usuario
   */
  static getAuthMethods = asyncHandler(async (req: Request, res: Response) => {
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
      data: {
        authMethods: user.auth_methods || [],
      },
    });
  });

  /**
   * Desvincular método de autenticación OAuth
   */
  static unlinkAuthMethod = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    const { type } = req.body;
    
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

    // Verificar que no sea el único método
    if (user.auth_methods.length <= 1) {
      return res.status(400).json({
        error: 'Cannot unlink your only authentication method',
      });
    }

    // Remover método
    await user.removeAuthMethod(type);

    // Si es Google o GitHub, limpiar el ID del proveedor
    if (type === 'google') {
      user.google_id = undefined;
    } else if (type === 'github') {
      user.github_id = undefined;
    }
    await user.save();

    logger.info(`Auth method ${type} unlinked for user: ${user.email}`, { userId: user.id });

    return res.json({
      success: true,
      message: 'Authentication method unlinked successfully',
    });
  });
}