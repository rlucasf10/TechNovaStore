/**
 * Caso de uso: Marcar Pedido para Procesamiento
 * 
 * Marca un pedido como "en procesamiento" si la transición es válida.
 */

import { Order } from '../shared/models/Order';
import { logger } from '../shared/utils/logger';

export class MarkOrderForProcessing {
  async execute(orderId: number): Promise<Order | null> {
    const order = await Order.findByPk(orderId);
    
    if (!order) {
      return null;
    }

    if (order.canTransitionTo('processing')) {
      await order.updateStatus('processing');
      
      logger.info(`Order marked for processing: ${order.order_number}`, {
        orderId: order.id,
      });
    }

    return order;
  }
}
