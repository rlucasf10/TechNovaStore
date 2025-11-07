import { NotificationService } from './NotificationService';
import { DelayDetector, OrderForDelayCheck } from '../utils/DelayDetector';

export class SchedulerService {
  private notificationService: NotificationService;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours as per requirement

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }

  start(): void {
    if (this.intervalId) {
      console.log('Scheduler is already running');
      return;
    }

    console.log('Starting delay detection scheduler...');
    this.intervalId = setInterval(() => {
      this.checkForDelays().catch(error => {
        console.error('Error in scheduled delay check:', error);
      });
    }, this.CHECK_INTERVAL_MS);

    // Run initial check
    this.checkForDelays().catch(error => {
      console.error('Error in initial delay check:', error);
    });
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Delay detection scheduler stopped');
    }
  }

  private async checkForDelays(): Promise<void> {
    try {
      console.log('Running scheduled delay check...');
      
      // In a real implementation, this would fetch from the order service
      // For now, we'll simulate the process
      const orders = await this.fetchOrdersForDelayCheck();
      const delayedOrders = DelayDetector.getDelayedOrders(orders);

      if (delayedOrders.length > 0) {
        console.log(`Found ${delayedOrders.length} delayed orders`);
        
        for (const order of delayedOrders) {
          const newEstimatedDelivery = DelayDetector.calculateNewEstimatedDelivery(
            order.estimatedDelivery,
            'provider_delay'
          );

          await this.notificationService.sendDelayAlert({
            orderId: order.orderId,
            originalDelivery: order.estimatedDelivery,
            newEstimatedDelivery,
            customerEmail: order.customerEmail,
            reason: DelayDetector.getDelayReasonMessage('provider_delay')
          });
        }
      } else {
        console.log('No delayed orders found');
      }
    } catch (error) {
      console.error('Error checking for delays:', error);
      throw error;
    }
  }

  private async fetchOrdersForDelayCheck(): Promise<OrderForDelayCheck[]> {
    // In a real implementation, this would make an HTTP request to the order service
    // For now, we'll return an empty array as a placeholder
    
    // Example implementation:
    // const response = await fetch('http://order-service:3002/orders/pending-delivery');
    // return response.json();
    
    return [];
  }

  // Manual trigger for testing
  async triggerDelayCheck(): Promise<void> {
    await this.checkForDelays();
  }
}