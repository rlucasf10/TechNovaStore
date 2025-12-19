/**
 * Programador de verificaciones automáticas de retrasos
 */

import { CheckDeliveryDelays } from './CheckDeliveryDelays';
import { OrderForDelayCheck } from '../shared/types';
import { logger } from '../shared/utils/logger';

export class DelayScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

  constructor(private checkDeliveryDelays: CheckDeliveryDelays) {}

  start(): void {
    if (this.intervalId) {
      logger.info('Delay scheduler is already running');
      return;
    }

    logger.info('Starting delay detection scheduler...');
    this.intervalId = setInterval(() => {
      this.runCheck().catch(error => {
        logger.error('Error in scheduled delay check', { error: error instanceof Error ? error.message : error });
      });
    }, this.CHECK_INTERVAL_MS);

    // Run initial check
    this.runCheck().catch(error => {
      logger.error('Error in initial delay check', { error: error instanceof Error ? error.message : error });
    });
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Delay detection scheduler stopped');
    }
  }

  async triggerManualCheck(): Promise<void> {
    await this.runCheck();
  }

  private async runCheck(): Promise<void> {
    logger.info('Running scheduled delay check...');
    
    // In a real implementation, this would fetch from the order service
    const orders = await this.fetchOrdersForDelayCheck();
    await this.checkDeliveryDelays.execute(orders);
  }

  private async fetchOrdersForDelayCheck(): Promise<OrderForDelayCheck[]> {
    // Placeholder - in real implementation, fetch from order service
    // Example: const response = await fetch('http://order-service:3002/orders/pending-delivery');
    return [];
  }
}
