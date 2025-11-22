/**
 * Caso de uso: Reportar Éxito de Compra Automática
 * 
 * Actualiza un pedido con la información del proveedor después de una
 * compra automática exitosa.
 */

import { Order } from '../shared/models/Order';
import { OrderItem } from '../shared/models/OrderItem';
import { logger } from '../shared/utils/logger';
import { orderEventService } from '../shared/services/eventService';

export class ReportAutoPurchaseSuccess {
  async execute(
    orderId: number,
    providerOrderId: string,
    providerName: string,
    totalCost: number,
    estimatedDelivery?: Date
  ): Promise<Order | null> {
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          as: 'items',
        },
      ],
    });
    
    if (!order) {
      return null;
    }

    // Actualizar pedido con información del proveedor
    order.provider_order_id = providerOrderId;
    order.provider_name = providerName;
    order.actual_cost = totalCost;
    if (estimatedDelivery) {
      order.estimated_delivery = estimatedDelivery;
    }

    // Transicionar a estado de procesamiento
    if (order.canTransitionTo('processing')) {
      await order.updateStatus('processing');
    }

    await order.save();

    logger.info(`Auto-purchase success reported: ${order.order_number}`, {
      orderId: order.id,
      providerOrderId,
      providerName,
      totalCost,
    });

    // Emitir evento
    orderEventService.emitOrderStatusChanged(order, 'confirmed');

    return order;
  }
}
