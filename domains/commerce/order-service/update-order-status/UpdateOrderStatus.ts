/**
 * Caso de uso: Actualizar Estado del Pedido
 * 
 * Actualiza el estado de un pedido validando transiciones permitidas
 * y generando factura automática cuando se confirma.
 */

import { Order, OrderStatus } from '../shared/models/Order';
import { logger } from '../shared/utils/logger';
import { orderEventService } from '../shared/services/eventService';
import { InvoiceService } from '../shared/services/invoiceService';

export class UpdateOrderStatus {
  async execute(id: number, status: OrderStatus): Promise<Order | null> {
    const order = await Order.findByPk(id);
    
    if (!order) {
      return null;
    }

    if (!order.canTransitionTo(status)) {
      throw new Error(`Cannot transition from ${order.status} to ${status}`);
    }

    const previousStatus = order.status;
    await order.updateStatus(status);

    logger.info(`Order status updated: ${order.order_number} -> ${status}`, {
      orderId: order.id,
      previousStatus,
      newStatus: status,
    });

    // Emitir evento de cambio de estado
    orderEventService.emitOrderStatusChanged(order, previousStatus);

    // Generar factura automática cuando el pedido se confirma
    if (status === 'confirmed' && previousStatus !== 'confirmed') {
      try {
        await InvoiceService.generateAutomaticInvoice(order.id);
        logger.info(`Automatic invoice generated for confirmed order: ${order.order_number}`, {
          orderId: order.id,
        });
      } catch (error) {
        logger.error(`Failed to generate automatic invoice for order ${order.id}:`, error);
        // No fallar la actualización del estado si falla la generación de factura
      }
    }

    return order;
  }
}
