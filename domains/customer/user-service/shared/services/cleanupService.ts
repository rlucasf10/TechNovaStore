import { RefreshToken } from '../models/RefreshToken';
import { PasswordReset } from '../models/PasswordReset';
import { logger } from '../utils/logger';

export class CleanupService {
  /**
   * Clean up expired refresh tokens and password reset tokens
   */
  static async cleanupExpiredTokens(): Promise<{
    refreshTokensDeleted: number;
    passwordResetsDeleted: number;
  }> {
    try {
      logger.info('Starting token cleanup process');

      // Clean up expired refresh tokens
      const refreshTokensDeleted = await RefreshToken.cleanupExpiredTokens();
      
      // Clean up expired password reset tokens (older than 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);
      
      const { Op } = require('sequelize');
      const passwordResetsDeleted = await PasswordReset.destroy({
        where: {
          expires_at: {
            [Op.lt]: new Date(),
          },
        },
      });

      logger.info('Token cleanup completed', {
        refreshTokensDeleted,
        passwordResetsDeleted,
      });

      return {
        refreshTokensDeleted,
        passwordResetsDeleted,
      };
    } catch (error) {
      logger.error('Error during token cleanup:', error);
      throw error;
    }
  }

  /**
   * Clean up used password reset tokens older than specified days
   */
  static async cleanupUsedPasswordResets(daysOld: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { Op } = require('sequelize');
      const deletedCount = await PasswordReset.destroy({
        where: {
          used: true,
          created_at: {
            [Op.lt]: cutoffDate,
          },
        },
      });

      logger.info(`Cleaned up ${deletedCount} used password reset tokens older than ${daysOld} days`);
      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up used password reset tokens:', error);
      throw error;
    }
  }

  /**
   * Clean up revoked refresh tokens older than specified days
   */
  static async cleanupRevokedRefreshTokens(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { Op } = require('sequelize');
      const deletedCount = await RefreshToken.destroy({
        where: {
          revoked: true,
          created_at: {
            [Op.lt]: cutoffDate,
          },
        },
      });

      logger.info(`Cleaned up ${deletedCount} revoked refresh tokens older than ${daysOld} days`);
      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up revoked refresh tokens:', error);
      throw error;
    }
  }

  /**
   * Get token statistics
   */
  static async getTokenStatistics(): Promise<{
    activeRefreshTokens: number;
    expiredRefreshTokens: number;
    revokedRefreshTokens: number;
    pendingPasswordResets: number;
    expiredPasswordResets: number;
    usedPasswordResets: number;
  }> {
    try {
      const { Op } = require('sequelize');
      const now = new Date();

      const [
        activeRefreshTokens,
        expiredRefreshTokens,
        revokedRefreshTokens,
        pendingPasswordResets,
        expiredPasswordResets,
        usedPasswordResets,
      ] = await Promise.all([
        RefreshToken.count({
          where: {
            revoked: false,
            expires_at: {
              [Op.gt]: now,
            },
          },
        }),
        RefreshToken.count({
          where: {
            revoked: false,
            expires_at: {
              [Op.lte]: now,
            },
          },
        }),
        RefreshToken.count({
          where: {
            revoked: true,
          },
        }),
        PasswordReset.count({
          where: {
            used: false,
            expires_at: {
              [Op.gt]: now,
            },
          },
        }),
        PasswordReset.count({
          where: {
            used: false,
            expires_at: {
              [Op.lte]: now,
            },
          },
        }),
        PasswordReset.count({
          where: {
            used: true,
          },
        }),
      ]);

      return {
        activeRefreshTokens,
        expiredRefreshTokens,
        revokedRefreshTokens,
        pendingPasswordResets,
        expiredPasswordResets,
        usedPasswordResets,
      };
    } catch (error) {
      logger.error('Error getting token statistics:', error);
      throw error;
    }
  }
}

// Schedule cleanup to run periodically (if needed)
export const scheduleTokenCleanup = (intervalHours: number = 24): NodeJS.Timeout => {
  const intervalMs = intervalHours * 60 * 60 * 1000; // Convert hours to milliseconds
  
  return setInterval(async () => {
    try {
      await CleanupService.cleanupExpiredTokens();
      await CleanupService.cleanupUsedPasswordResets();
      await CleanupService.cleanupRevokedRefreshTokens();
    } catch (error) {
      logger.error('Scheduled token cleanup failed:', error);
    }
  }, intervalMs);
};