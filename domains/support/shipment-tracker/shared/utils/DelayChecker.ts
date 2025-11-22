/**
 * Utilidad para verificar retrasos en entregas
 * Extraído del método privado checkForDelays() de ShipmentTracker
 */

import { Order } from '../models/Order';
import { TrackingInfo } from '../types/tracking';
import { NotificationService } from '../clients/NotificationService';

export class DelayChecker {
  static async checkForDelays(
    order: Order,
    trackingInfo: TrackingInfo,
    notificationService: NotificationService
  ): Promise<void> {
    if (!order.estimatedDelivery || !trackingInfo.estimatedDeliveryDate) {
      return;
    }

    const now = new Date();
    const originalEstimate = order.estimatedDelivery;
    const newEstimate = trackingInfo.estimatedDeliveryDate;

    // Check if delivery is delayed beyond original estimate
    if (newEstimate > originalEstimate && now > originalEstimate) {
      console.log(`Delivery delay detected for order ${order.orderNumber}`);
      await notificationService.sendDelayNotification(order, originalEstimate, newEstimate);
    }
  }
}
