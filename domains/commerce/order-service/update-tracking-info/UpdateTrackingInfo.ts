/**
 * Caso de uso: Actualizar Información de Seguimiento
 * 
 * Actualiza el número de seguimiento y fecha estimada de entrega de un pedido.
 */

import { Order } from '../shared/models/Order';
import { logger } from '../shared/utils/logger';

export class UpdateTrackingInfo {
  async execute(
    id: number,
    trackingNumber: string,
    estimatedDelivery?: Date
  ): Promise<Order | null> {
    const order = await Order.findByPk(id);
    
    if (!order) {
      return null;
    }

    order.tracking_number = trackingNumber;
    if (estimatedDelivery) {
      order.estimated_delivery = estimatedDelivery;
    }

    await order.save();

    logger.info(`Tracking info updated: ${order.order_number}`, {
      orderId: order.id,
      trackingNumber,
      estimatedDelivery,
    });

    return order;
  }
}
