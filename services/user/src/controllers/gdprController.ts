import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthenticatedRequest } from '@technovastore/shared-types';
import { asyncHandler } from '../../../../shared/middleware/errorHandler';
import { GdprService } from '../services/gdprService';
import { logger } from '../utils/logger';

export class GdprController {
  /**
   * Export all personal data for a user (GDPR Article 20 - Right to data portability)
   */
  static exportPersonalData = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated',
      });
    }

    try {
      const personalData = await GdprService.exportUserData(parseInt(userId));
      
      if (!personalData) {
        return res.status(404).json({
          error: 'User not found',
        });
      }

      logger.info(`Personal data export requested by user: ${userId}`, { userId });

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="personal-data-${userId}-${Date.now()}.json"`);
      
      return res.json({
        success: true,
        message: 'Personal data exported successfully',
        data: personalData,
        exported_at: new Date().toISOString(),
        user_id: userId,
      });
    } catch (error) {
      logger.error('Error exporting personal data', { userId, error });
      return res.status(500).json({
        error: 'Failed to export personal data',
      });
    }
  });

  /**
   * Request account deletion (GDPR Article 17 - Right to erasure)
   */
  static requestAccountDeletion = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

    try {
      const deletionRequest = await GdprService.requestAccountDeletion(parseInt(userId), reason);
      
      if (!deletionRequest) {
        return res.status(404).json({
          error: 'User not found',
        });
      }

      logger.info(`Account deletion requested by user: ${userId}`, { 
        userId, 
        reason,
        requestId: deletionRequest.id 
      });

      return res.json({
        success: true,
        message: 'Account deletion request submitted successfully. Your account will be deleted within 30 days as required by GDPR.',
        deletion_request_id: deletionRequest.id,
        scheduled_deletion_date: deletionRequest.scheduled_deletion_date,
      });
    } catch (error) {
      logger.error('Error requesting account deletion', { userId, error });
      return res.status(500).json({
        error: 'Failed to process account deletion request',
      });
    }
  });

  /**
   * Cancel account deletion request (within grace period)
   */
  static cancelAccountDeletion = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated',
      });
    }

    try {
      const cancelled = await GdprService.cancelAccountDeletion(parseInt(userId));
      
      if (!cancelled) {
        return res.status(404).json({
          error: 'No active deletion request found or cancellation period expired',
        });
      }

      logger.info(`Account deletion cancelled by user: ${userId}`, { userId });

      return res.json({
        success: true,
        message: 'Account deletion request cancelled successfully',
      });
    } catch (error) {
      logger.error('Error cancelling account deletion', { userId, error });
      return res.status(500).json({
        error: 'Failed to cancel account deletion request',
      });
    }
  });

  /**
   * Get user's GDPR consent status
   */
  static getConsentStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated',
      });
    }

    try {
      const consentStatus = await GdprService.getConsentStatus(parseInt(userId));
      
      return res.json({
        success: true,
        data: consentStatus,
      });
    } catch (error) {
      logger.error('Error getting consent status', { userId, error });
      return res.status(500).json({
        error: 'Failed to get consent status',
      });
    }
  });

  /**
   * Update user's GDPR consent preferences
   */
  static updateConsent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

    try {
      const updatedConsent = await GdprService.updateConsent(parseInt(userId), consent_data);
      
      logger.info(`GDPR consent updated by user: ${userId}`, { userId, consent_data });

      return res.json({
        success: true,
        message: 'Consent preferences updated successfully',
        data: updatedConsent,
      });
    } catch (error) {
      logger.error('Error updating consent', { userId, error });
      return res.status(500).json({
        error: 'Failed to update consent preferences',
      });
    }
  });

  /**
   * Admin endpoint to process pending deletion requests
   */
  static processPendingDeletions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = req.headers['x-user-role'] as string;
    
    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    try {
      const processedDeletions = await GdprService.processPendingDeletions();
      
      logger.info(`Processed ${processedDeletions.length} pending account deletions`, { 
        adminId: req.headers['x-user-id'],
        processedCount: processedDeletions.length 
      });

      return res.json({
        success: true,
        message: `Processed ${processedDeletions.length} pending account deletions`,
        processed_deletions: processedDeletions,
      });
    } catch (error) {
      logger.error('Error processing pending deletions', { error });
      return res.status(500).json({
        error: 'Failed to process pending deletions',
      });
    }
  });
}