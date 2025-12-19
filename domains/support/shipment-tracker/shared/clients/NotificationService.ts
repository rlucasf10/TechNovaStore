import { Order } from '../models/Order';
import { TrackingInfo } from '../types/tracking';
import { userNotificationClient } from './UserNotificationClient';
import { logger } from '../utils/logger';

export class NotificationService {
  async sendShipmentUpdate(order: Order, trackingInfo: TrackingInfo): Promise<void> {
    try {
      logger.info('Sending shipment update notification', { 
        orderNumber: order.orderNumber,
        status: trackingInfo.status,
        trackingNumber: trackingInfo.trackingNumber
      });
      
      // Crear notificación en la base de datos para el dashboard del usuario
      await userNotificationClient.notifyShipmentUpdate(
        order.userId,
        order.orderNumber,
        trackingInfo.status,
        trackingInfo.trackingNumber
      );

      // Si el pedido fue entregado, enviar notificación especial
      if (trackingInfo.status === 'delivered') {
        await userNotificationClient.notifyOrderDelivered(
          order.userId,
          order.orderNumber
        );
      }
      
      logger.info('Shipment notification sent successfully', { 
        orderNumber: order.orderNumber 
      });
    } catch (error) {
      logger.error('Error sending shipment update notification', { 
        orderNumber: order.orderNumber,
        error: String(error) 
      });
    }
  }

  async sendDelayNotification(order: Order, originalEstimate: Date, newEstimate: Date): Promise<void> {
    try {
      logger.info('Sending delay notification', { 
        orderNumber: order.orderNumber,
        originalEstimate: originalEstimate.toISOString(),
        newEstimate: newEstimate.toISOString()
      });
      
      // Crear notificación de retraso en la base de datos
      await userNotificationClient.notifyDeliveryDelay(
        order.userId,
        order.orderNumber,
        originalEstimate,
        newEstimate
      );
      
      logger.info('Delay notification sent successfully', { 
        orderNumber: order.orderNumber 
      });
    } catch (error) {
      logger.error('Error sending delay notification', { 
        orderNumber: order.orderNumber,
        error: String(error) 
      });
    }
  }

  private getStatusMessage(status: string): string {
    const messages: { [key: string]: string } = {
      'label_created': 'Se ha creado la etiqueta de envío para tu pedido.',
      'picked_up': 'El transportista ha recogido tu pedido.',
      'in_transit': 'Tu pedido está en camino.',
      'out_for_delivery': 'Tu pedido saldrá para entrega hoy.',
      'delivered': 'Tu pedido ha sido entregado correctamente.',
      'exception': 'Hay un problema con tu envío. Estamos trabajando para resolverlo.',
      'returned': 'Tu pedido está siendo devuelto al remitente.',
      'cancelled': 'El envío ha sido cancelado.'
    };

    return messages[status] || 'El estado de tu pedido ha sido actualizado.';
  }
}