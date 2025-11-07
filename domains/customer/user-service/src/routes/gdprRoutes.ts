import { Router } from 'express';
import { body } from 'express-validator';
import { GdprController } from '../controllers/gdprController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route GET /api/gdpr/export
 * @desc Export all personal data for the authenticated user
 * @access Private
 */
router.get('/export', GdprController.exportPersonalData);

/**
 * @route POST /api/gdpr/delete-account
 * @desc Request account deletion (GDPR Right to Erasure)
 * @access Private
 */
router.post(
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
  GdprController.requestAccountDeletion
);

/**
 * @route POST /api/gdpr/cancel-deletion
 * @desc Cancel account deletion request
 * @access Private
 */
router.post('/cancel-deletion', GdprController.cancelAccountDeletion);

/**
 * @route GET /api/gdpr/consent
 * @desc Get user's current consent status
 * @access Private
 */
router.get('/consent', GdprController.getConsentStatus);

/**
 * @route POST /api/gdpr/consent
 * @desc Update user's consent preferences
 * @access Private
 */
router.post(
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
  GdprController.updateConsent
);

/**
 * @route POST /api/gdpr/admin/process-deletions
 * @desc Process pending account deletions (Admin only)
 * @access Private (Admin)
 */
router.post('/admin/process-deletions', GdprController.processPendingDeletions);

export { router as gdprRoutes };