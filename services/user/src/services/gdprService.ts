import { User, UserConsent, AccountDeletionRequest } from '../models';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';

export interface PersonalDataExport {
  user_profile: any;
  consent_history: any[];
  deletion_requests: any[];
  export_metadata: {
    exported_at: string;
    data_retention_policy: string;
    contact_info: string;
  };
}

export interface ConsentData {
  necessary_cookies: boolean;
  analytics_cookies: boolean;
  marketing_cookies: boolean;
  data_processing: boolean;
  email_marketing: boolean;
  third_party_sharing: boolean;
}

export class GdprService {
  /**
   * Export all personal data for a user (GDPR Article 20)
   */
  static async exportUserData(userId: number): Promise<PersonalDataExport | null> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return null;
      }

      // Get user consent history
      const consentHistory = await UserConsent.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
      });

      // Get deletion request history
      const deletionRequests = await AccountDeletionRequest.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
      });

      const personalData: PersonalDataExport = {
        user_profile: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          address: user.address,
          role: user.role,
          email_verified: user.email_verified,
          last_login: user.last_login,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
        consent_history: consentHistory.map(consent => ({
          id: consent.id,
          consent_data: consent.consent_data,
          ip_address: consent.ip_address,
          user_agent: consent.user_agent,
          created_at: consent.created_at,
        })),
        deletion_requests: deletionRequests.map(request => ({
          id: request.id,
          reason: request.reason,
          status: request.status,
          scheduled_deletion_date: request.scheduled_deletion_date,
          processed_at: request.processed_at,
          created_at: request.created_at,
        })),
        export_metadata: {
          exported_at: new Date().toISOString(),
          data_retention_policy: 'Data is retained as per our privacy policy and GDPR requirements',
          contact_info: 'For questions about your data, contact: privacy@technovastore.com',
        },
      };

      return personalData;
    } catch (error) {
      logger.error('Error exporting user data', { userId, error });
      throw error;
    }
  }

  /**
   * Request account deletion (GDPR Article 17)
   */
  static async requestAccountDeletion(userId: number, reason?: string): Promise<AccountDeletionRequest | null> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return null;
      }

      // Check if there's already a pending deletion request
      const existingRequest = await AccountDeletionRequest.findOne({
        where: {
          user_id: userId,
          status: 'pending',
        },
      });

      if (existingRequest) {
        return existingRequest;
      }

      // Create new deletion request with 30-day grace period
      const scheduledDeletionDate = new Date();
      scheduledDeletionDate.setDate(scheduledDeletionDate.getDate() + 30);

      const deletionRequest = await AccountDeletionRequest.create({
        user_id: userId,
        reason: reason || 'User requested account deletion',
        status: 'pending',
        scheduled_deletion_date: scheduledDeletionDate,
      });

      // Deactivate user account immediately but don't delete data yet
      await user.update({ is_active: false });

      return deletionRequest;
    } catch (error) {
      logger.error('Error requesting account deletion', { userId, error });
      throw error;
    }
  }

  /**
   * Cancel account deletion request (within grace period)
   */
  static async cancelAccountDeletion(userId: number): Promise<boolean> {
    try {
      const deletionRequest = await AccountDeletionRequest.findOne({
        where: {
          user_id: userId,
          status: 'pending',
          scheduled_deletion_date: {
            [Op.gt]: new Date(),
          },
        },
      });

      if (!deletionRequest) {
        return false;
      }

      // Cancel the deletion request
      await deletionRequest.update({ status: 'cancelled' });

      // Reactivate user account
      const user = await User.findByPk(userId);
      if (user) {
        await user.update({ is_active: true });
      }

      return true;
    } catch (error) {
      logger.error('Error cancelling account deletion', { userId, error });
      throw error;
    }
  }

  /**
   * Get user's consent status
   */
  static async getConsentStatus(userId: number): Promise<any> {
    try {
      const latestConsent = await UserConsent.findOne({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
      });

      if (!latestConsent) {
        return {
          has_consent: false,
          consent_data: null,
          last_updated: null,
        };
      }

      return {
        has_consent: true,
        consent_data: latestConsent.consent_data,
        last_updated: latestConsent.created_at,
        ip_address: latestConsent.ip_address,
      };
    } catch (error) {
      logger.error('Error getting consent status', { userId, error });
      throw error;
    }
  }

  /**
   * Update user's consent preferences
   */
  static async updateConsent(userId: number, consentData: ConsentData, ipAddress?: string, userAgent?: string): Promise<UserConsent> {
    try {
      const consent = await UserConsent.create({
        user_id: userId,
        consent_data: consentData,
        ip_address: ipAddress,
        user_agent: userAgent,
      });

      return consent;
    } catch (error) {
      logger.error('Error updating consent', { userId, error });
      throw error;
    }
  }

  /**
   * Process pending account deletions (admin function)
   */
  static async processPendingDeletions(): Promise<any[]> {
    try {
      const pendingDeletions = await AccountDeletionRequest.findAll({
        where: {
          status: 'pending',
          scheduled_deletion_date: {
            [Op.lte]: new Date(),
          },
        },
        include: [User],
      });

      const processedDeletions: Array<{ user_id: number; email: string; processed_at: Date }> = [];

      for (const deletionRequest of pendingDeletions) {
        try {
          // Delete user data permanently
          const user = await User.findByPk(deletionRequest.user_id);
          if (user) {
            // Delete related consent records
            await UserConsent.destroy({
              where: { user_id: deletionRequest.user_id },
            });

            // Delete the user record
            await user.destroy();

            // Mark deletion request as processed
            await deletionRequest.update({
              status: 'processed',
              processed_at: new Date(),
            });

            processedDeletions.push({
              user_id: deletionRequest.user_id,
              email: user.email,
              processed_at: new Date(),
            });

            logger.info(`Account permanently deleted for user: ${deletionRequest.user_id}`, {
              userId: deletionRequest.user_id,
              email: user.email,
            });
          }
        } catch (error) {
          logger.error('Error processing individual deletion', {
            userId: deletionRequest.user_id,
            error,
          });

          // Mark as failed
          await deletionRequest.update({
            status: 'failed',
            processed_at: new Date(),
          });
        }
      }

      return processedDeletions;
    } catch (error) {
      logger.error('Error processing pending deletions', { error });
      throw error;
    }
  }

  /**
   * Anonymize user data instead of deletion (alternative to full deletion)
   */
  static async anonymizeUserData(userId: number): Promise<boolean> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return false;
      }

      // Anonymize personal data
      await user.update({
        email: `anonymized_${userId}@deleted.local`,
        first_name: 'Anonymized',
        last_name: 'User',
        phone: undefined,
        address: undefined,
        is_active: false,
      });

      // Keep consent records for legal compliance but anonymize IP
      await UserConsent.update(
        { ip_address: undefined, user_agent: undefined },
        { where: { user_id: userId } }
      );

      return true;
    } catch (error) {
      logger.error('Error anonymizing user data', { userId, error });
      throw error;
    }
  }
}