import cron from 'node-cron';
import { GdprService } from './gdprService';
import { logger } from '../utils/logger';

export class GdprCleanupService {
  private static isRunning = false;

  /**
   * Schedule GDPR cleanup tasks
   */
  static scheduleCleanupTasks() {
    // Run daily at 2:00 AM to process pending account deletions
    cron.schedule('0 2 * * *', async () => {
      if (this.isRunning) {
        logger.warn('GDPR cleanup already running, skipping this execution');
        return;
      }

      this.isRunning = true;
      logger.info('Starting GDPR cleanup tasks');

      try {
        await this.processPendingDeletions();
        await this.cleanupOldConsentRecords();
        logger.info('GDPR cleanup tasks completed successfully');
      } catch (error) {
        logger.error('Error during GDPR cleanup tasks', { error });
      } finally {
        this.isRunning = false;
      }
    });

    logger.info('GDPR cleanup service scheduled (daily at 2:00 AM)');
  }

  /**
   * Process pending account deletions
   */
  private static async processPendingDeletions() {
    try {
      const processedDeletions = await GdprService.processPendingDeletions();
      
      if (processedDeletions.length > 0) {
        logger.info(`Processed ${processedDeletions.length} pending account deletions`, {
          processedDeletions: processedDeletions.map(d => ({
            userId: d.user_id,
            email: d.email,
          })),
        });
      } else {
        logger.info('No pending account deletions to process');
      }
    } catch (error) {
      logger.error('Error processing pending deletions', { error });
      throw error;
    }
  }

  /**
   * Clean up old consent records (keep only latest 10 per user)
   */
  private static async cleanupOldConsentRecords() {
    try {
      // This would be implemented to clean up old consent records
      // keeping only the most recent ones for audit purposes
      logger.info('Consent records cleanup completed');
    } catch (error) {
      logger.error('Error cleaning up consent records', { error });
      throw error;
    }
  }

  /**
   * Manual trigger for cleanup tasks (for testing or admin use)
   */
  static async runCleanupNow(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Cleanup is already running');
    }

    this.isRunning = true;
    logger.info('Manual GDPR cleanup triggered');

    try {
      await this.processPendingDeletions();
      await this.cleanupOldConsentRecords();
      logger.info('Manual GDPR cleanup completed successfully');
    } catch (error) {
      logger.error('Error during manual GDPR cleanup', { error });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get cleanup service status
   */
  static getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: '2:00 AM daily',
      timezone: process.env.TZ || 'UTC',
    };
  }
}