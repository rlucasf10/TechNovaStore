import { Order } from '../models/Order';
import { TrackingInfo } from '../types/tracking';

export class NotificationService {
  async sendShipmentUpdate(order: Order, trackingInfo: TrackingInfo): Promise<void> {
    try {
      // This would integrate with the notification service
      // For now, we'll log the notification
      console.log(`Sending shipment update notification for order ${order.orderNumber}`);
      
      const notification = {
        type: 'shipment_update',
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        status: trackingInfo.status,
        trackingNumber: trackingInfo.trackingNumber,
        provider: trackingInfo.provider,
        estimatedDelivery: trackingInfo.estimatedDeliveryDate,
        message: this.getStatusMessage(trackingInfo.status),
        timestamp: new Date()
      };

      // TODO: Integrate with actual notification service
      // await notificationService.send(notification);
      
      console.log('Shipment notification sent:', notification);
    } catch (error) {
      console.error('Error sending shipment update notification:', error);
    }
  }

  async sendDelayNotification(order: Order, originalEstimate: Date, newEstimate: Date): Promise<void> {
    try {
      console.log(`Sending delay notification for order ${order.orderNumber}`);
      
      const delayDays = Math.ceil((newEstimate.getTime() - originalEstimate.getTime()) / (1000 * 60 * 60 * 24));
      
      const notification = {
        type: 'delivery_delay',
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        originalEstimate,
        newEstimate,
        delayDays,
        message: `Your order delivery has been delayed by ${delayDays} day(s). New estimated delivery: ${newEstimate.toLocaleDateString()}`,
        timestamp: new Date()
      };

      // TODO: Integrate with actual notification service
      // await notificationService.send(notification);
      
      console.log('Delay notification sent:', notification);
    } catch (error) {
      console.error('Error sending delay notification:', error);
    }
  }

  private getStatusMessage(status: string): string {
    const messages: { [key: string]: string } = {
      'label_created': 'Your order has been processed and a shipping label has been created.',
      'picked_up': 'Your order has been picked up by the carrier.',
      'in_transit': 'Your order is on its way to you.',
      'out_for_delivery': 'Your order is out for delivery and should arrive today.',
      'delivered': 'Your order has been delivered successfully.',
      'exception': 'There was an issue with your shipment. We are working to resolve it.',
      'returned': 'Your order is being returned to the sender.',
      'cancelled': 'Your shipment has been cancelled.'
    };

    return messages[status] || 'Your order status has been updated.';
  }
}