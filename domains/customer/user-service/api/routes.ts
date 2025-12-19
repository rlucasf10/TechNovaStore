/**
 * Rutas HTTP consolidadas para el servicio de usuarios
 * Consolidado de authRoutes, userRoutes y gdprRoutes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { UserController } from './UserController';
import { authMiddleware, requireRole } from '../shared/middleware/auth';
import {
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateOAuthCallback,
} from '../shared/validators/authValidator';
import {
  validateUpdateProfile,
  validateChangePassword,
  validateUserId,
  validateUserQuery,
  validateUpdateRole,
} from '../shared/validators/userValidator';

// Instanciar casos de uso
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
import { GetWishlist } from '../get-wishlist/GetWishlist';
import { AddToWishlist } from '../add-to-wishlist/AddToWishlist';
import { RemoveFromWishlist } from '../remove-from-wishlist/RemoveFromWishlist';
import { LogoutUser } from '../logout-user/LogoutUser';

// Crear instancias de casos de uso
const registerUser = new RegisterUser();
const authenticateUser = new AuthenticateUser();
const logoutUser = new LogoutUser();
const refreshTokenUseCase = new RefreshTokenUseCase();
const requestPasswordReset = new RequestPasswordReset();
const confirmPasswordReset = new ConfirmPasswordReset();
const validateAccessToken = new ValidateAccessToken();
const oauthAuthentication = new OAuthAuthentication();
const getUserProfile = new GetUserProfile();
const updateUserProfile = new UpdateUserProfile();
const changePassword = new ChangePassword();
const deactivateAccount = new DeactivateAccount();
const exportPersonalData = new ExportPersonalData();
const requestAccountDeletion = new RequestAccountDeletion();
const cancelAccountDeletion = new CancelAccountDeletion();
const manageConsent = new ManageConsent();
const getWishlist = new GetWishlist();
const addToWishlist = new AddToWishlist();
const removeFromWishlist = new RemoveFromWishlist();

// Crear controlador
const controller = new UserController(
  registerUser,
  authenticateUser,
  refreshTokenUseCase,
  requestPasswordReset,
  confirmPasswordReset,
  validateAccessToken,
  oauthAuthentication,
  getUserProfile,
  updateUserProfile,
  changePassword,
  deactivateAccount,
  exportPersonalData,
  requestAccountDeletion,
  cancelAccountDeletion,
  manageConsent,
  getWishlist,
  addToWishlist,
  removeFromWishlist
);

export const authRoutes = Router();
export const userRoutes = Router();
export const gdprRoutes = Router();
export const wishlistRoutes = Router();

// ============ AUTH ROUTES ============
// Public routes
authRoutes.post('/register', validateRegister, controller.register);
authRoutes.post('/login', validateLogin, controller.login);
authRoutes.post('/logout', (req, res) => logoutUser.execute(req, res));
authRoutes.post('/refresh', validateRefreshToken, controller.refreshToken);
authRoutes.post('/password-reset/request', validatePasswordResetRequest, controller.requestPasswordResetHandler);
authRoutes.post('/password-reset/confirm', validatePasswordReset, controller.resetPassword);

// OAuth routes
authRoutes.post('/oauth/callback', validateOAuthCallback, controller.oauthCallback);

// Token validation
authRoutes.post('/validate', controller.validateToken);

// Get current user (requires authentication)
authRoutes.get('/me', authMiddleware, controller.getProfile);

// ============ USER ROUTES ============
// All user routes require authentication
userRoutes.use(authMiddleware);

// User profile management
userRoutes.get('/profile', controller.getProfile);
userRoutes.put('/profile', validateUpdateProfile, controller.updateProfile);
userRoutes.post('/change-password', validateChangePassword, controller.changePasswordHandler);
userRoutes.delete('/account', controller.deleteAccount);

// ============ GDPR ROUTES ============
// All GDPR routes require authentication
gdprRoutes.use(authMiddleware);

// Export personal data
gdprRoutes.get('/export', controller.exportPersonalDataHandler);

// Account deletion
gdprRoutes.post(
  '/delete-account',
  [
    body('confirm_deletion')
      .isBoolean()
      .withMessage('Confirmation is required'),
    body('reason')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Reason must be less than 1000 characters'),
  ],
  controller.requestAccountDeletionHandler
);

gdprRoutes.post('/cancel-deletion', controller.cancelAccountDeletionHandler);

// Consent management
gdprRoutes.get('/consent', controller.getConsentStatus);
gdprRoutes.post(
  '/consent',
  [
    body('consent_data.necessary_cookies')
      .isBoolean()
      .withMessage('Necessary cookies consent must be boolean'),
    body('consent_data.analytics_cookies')
      .isBoolean()
      .withMessage('Analytics cookies consent must be boolean'),
    body('consent_data.marketing_cookies')
      .isBoolean()
      .withMessage('Marketing cookies consent must be boolean'),
    body('consent_data.data_processing')
      .isBoolean()
      .withMessage('Data processing consent must be boolean'),
    body('consent_data.email_marketing')
      .isBoolean()
      .withMessage('Email marketing consent must be boolean'),
    body('consent_data.third_party_sharing')
      .isBoolean()
      .withMessage('Third party sharing consent must be boolean'),
  ],
  controller.updateConsent
);

// ============ WISHLIST ROUTES ============
// All wishlist routes require authentication
wishlistRoutes.use(authMiddleware);

// Get user's wishlist
wishlistRoutes.get('/', controller.getWishlistHandler);

// Add product to wishlist
wishlistRoutes.post('/', controller.addToWishlistHandler);

// Remove product from wishlist
wishlistRoutes.delete('/:productId', controller.removeFromWishlistHandler);
