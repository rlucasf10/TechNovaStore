/**
 * Utilidad para verificar retrasos en entregas
 * Extraído del método privado checkForDelays() de ShipmentTracker
 */

import { Order } from '../models/Order';
import { TrackingInfo } from '../types/tracking';
import { NotificationService } from '../clients/NotificationService';
import { logger } from './logger';

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
      logger.info('Delivery delay detected', {
        orderNumber: order.orderNumber,
        originalEstimate: originalEstimate.toISOString(),
        newEstimate: newEstimate.toISOString(),
        delayDays: Math.ceil((newEstimate.getTime() - originalEstimate.getTime()) / (1000 * 60 * 60 * 24))
      });
      await notificationService.sendDelayNotification(order, originalEstimate, newEstimate);
    }
  }
}
