/**
 * Controlador HTTP para el servicio de usuarios
 * Expone los casos de uso a través de endpoints REST
 * Consolidado de authController, userController y gdprController
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { asyncHandler } from '@technovastore/shared-utils';
import { AuthenticatedRequest } from '@technovastore/shared-types';

// Casos de uso
import { RegisterUser } from '../register-user/RegisterUser';
import { AuthenticateUser } from '../authenticate-user/AuthenticateUser';
import { RefreshTokenUseCase } from '../refresh-token/RefreshToken';
import { RequestPasswordReset } from '../request-password-reset/RequestPasswordReset';
import { ConfirmPasswordReset } from '../confirm-password-reset/ConfirmPasswordReset';
import { ValidateAccessToken } from '../validate-access-token/ValidateAccessToken';
import { OAuthAuthentication } from '../oauth-authentication/OAuthAuthentication';
import { GetUserProfile } from '../get-user-profile/GetUserProfile';
import { UpdateUserProfile } from '../update-user-profile/UpdateUserProfile';
import { ChangePassword } from '../change-password/ChangePassword';
import { DeactivateAccount } from '../deactivate-account/DeactivateAccount';
import { ExportPersonalData } from '../export-personal-data/ExportPersonalData';
import { RequestAccountDeletion } from '../request-account-deletion/RequestAccountDeletion';
import { CancelAccountDeletion } from '../cancel-account-deletion/CancelAccountDeletion';
import { ManageConsent } from '../manage-consent/ManageConsent';

export class UserController {
  constructor(
    private registerUser: RegisterUser,
    private authenticateUser: AuthenticateUser,
    private refreshTokenUseCase: RefreshTokenUseCase,
    private requestPasswordReset: RequestPasswordReset,
    private confirmPasswordReset: ConfirmPasswordReset,
    private validateAccessToken: ValidateAccessToken,
    private oauthAuthentication: OAuthAuthentication,
    private getUserProfile: GetUserProfile,
    private updateUserProfile: UpdateUserProfile,
    private changePassword: ChangePassword,
    private deactivateAccount: DeactivateAccount,
    private exportPersonalData: ExportPersonalData,
    private requestAccountDeletion: RequestAccountDeletion,
    private cancelAccountDeletion: CancelAccountDeletion,
    private manageConsent: ManageConsent
  ) {}

  // Auth endpoints
  register = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    try {
      const result = await this.registerUser.execute(req.body);

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

  login = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    try {
      const result = await this.authenticateUser.execute(req.body);

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

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token is required',
      });
    }

    try {
      const tokens = await this.refreshTokenUseCase.execute(refreshToken);

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

  requestPasswordResetHandler = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    try {
      const { email } = req.body;
      await this.requestPasswordReset.execute(email);

      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });
    } catch (error: any) {
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });
    }
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    try {
      const { token, newPassword } = req.body;
      await this.confirmPasswordReset.execute(token, newPassword);

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

  validateToken = asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No token provided',
      });
    }

    const token = authHeader.substring(7);
    const result = await this.validateAccessToken.execute(token);

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

  oauthCallback = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    try {
      const result = await this.oauthAuthentication.execute(req.body);

      return res.json({
        success: true,
        message: 'OAuth authentication successful',
        data: result,
      });
    } catch (error: any) {
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

  // User profile endpoints
  getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated',
      });
    }

    const user = await this.getUserProfile.execute(parseInt(userId));
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    return res.json({
      success: true,
      data: user,
    });
  });

  updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

    const user = await this.updateUserProfile.execute(parseInt(userId), req.body);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  });

  changePasswordHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

    try {
      await this.changePassword.execute(parseInt(userId), currentPassword, newPassword);

      return res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      if (error.message === 'Current password is incorrect') {
        return res.status(400).json({
          error: error.message,
        });
      }
      throw error;
    }
  });

  deleteAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated',
      });
    }

    const success = await this.deactivateAccount.execute(parseInt(userId));
    
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

  // GDPR endpoints
  exportPersonalDataHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated',
      });
    }

    const personalData = await this.exportPersonalData.execute(parseInt(userId));
    
    if (!personalData) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="personal-data-${userId}-${Date.now()}.json"`);
    
    return res.json({
      success: true,
      message: 'Personal data exported successfully',
      data: personalData,
      exported_at: new Date().toISOString(),
      user_id: userId,
    });
  });

  requestAccountDeletionHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const userId = req.headers['x-user-id'] as string;
    const { reason, confirm_deletion } = req.body;
    
    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated',
      });
    }

    if (!confirm_deletion) {
      return res.status(400).json({
        error: 'Account deletion must be explicitly confirmed',
      });
    }

    const deletionRequest = await this.requestAccountDeletion.execute(parseInt(userId), reason);
    
    if (!deletionRequest) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    return res.json({
      success: true,
      message: 'Account deletion request submitted successfully. Your account will be deleted within 30 days as required by GDPR.',
      deletion_request_id: deletionRequest.id,
      scheduled_deletion_date: deletionRequest.scheduled_deletion_date,
    });
  });

  cancelAccountDeletionHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated',
      });
    }

    const cancelled = await this.cancelAccountDeletion.execute(parseInt(userId));
    
    if (!cancelled) {
      return res.status(404).json({
        error: 'No active deletion request found or cancellation period expired',
      });
    }

    return res.json({
      success: true,
      message: 'Account deletion request cancelled successfully',
    });
  });

  getConsentStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated',
      });
    }

    const consentStatus = await this.manageConsent.getConsentStatus(parseInt(userId));
    
    return res.json({
      success: true,
      data: consentStatus,
    });
  });

  updateConsent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const userId = req.headers['x-user-id'] as string;
    const { consent_data } = req.body;
    
    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated',
      });
    }

    const updatedConsent = await this.manageConsent.updateConsent(parseInt(userId), consent_data);

    return res.json({
      success: true,
      message: 'Consent preferences updated successfully',
      data: updatedConsent,
    });
  });
}
