/**
 * Caso de uso: Verificar retrasos en entregas
 * Extraído del método checkForDelays() del NotificationService original
 */

import { SendDelayAlert } from '../send-delay-alert/SendDelayAlert';
import { logger } from '../shared/utils/logger';

export interface OrderForDelayCheck {
  orderId: string;
  customerEmail: string;
  estimatedDelivery: Date;
  currentStatus: string;
}

export class CheckDeliveryDelays {
  constructor(private sendDelayAlert: SendDelayAlert) {}

  async execute(orders: OrderForDelayCheck[]): Promise<void> {
    try {
      // Lógica original del método checkForDelays
      const now = new Date();
      const delayedOrders = orders.filter(order => {
        const estimatedDelivery = new Date(order.estimatedDelivery);
        return estimatedDelivery < now && !['delivered', 'cancelled'].includes(order.currentStatus);
      });

      logger.info('Checking for delayed orders...');
      
      if (delayedOrders.length > 0) {
        logger.info('Found delayed orders', { count: delayedOrders.length });
        
        for (const order of delayedOrders) {
          const newEstimatedDelivery = new Date(order.estimatedDelivery);
          newEstimatedDelivery.setDate(newEstimatedDelivery.getDate() + 3); // Add 3 days as default

          await this.sendDelayAlert.execute({
            orderId: order.orderId,
            originalDelivery: new Date(order.estimatedDelivery),
            newEstimatedDelivery,
            customerEmail: order.customerEmail,
            reason: 'Retraso en el procesamiento del proveedor'
          });
        }
      } else {
        logger.info('No delayed orders found');
      }
    } catch (error) {
      logger.error('Error checking for delays', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }
}
