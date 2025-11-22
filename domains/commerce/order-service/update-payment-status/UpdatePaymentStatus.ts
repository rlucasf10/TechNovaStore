/**
 * Caso de uso: Actualizar Estado de Pago
 * 
 * Actualiza el estado de pago de un pedido.
 * Este caso de uso es llamado por el Payment Service.
 */

import { Order } from '../shared/models/Order';
import { Invoice } from '../shared/models/Invoice';
import { logger } from '../shared/utils/logger';
import { orderEventService } from '../shared/services/eventService';

export class UpdatePaymentStatus {
  async execute(
    orderId: number,
    paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded',
    transactionId?: string
  ): Promise<Order | null> {
    try {
      const order = await Order.findByPk(orderId);
      
      if (!order) {
        logger.warn(`Order ${orderId} not found`);
        return null;
      }

      logger.info(`Updating payment status for order ${orderId}`, {
        orderId,
        oldStatus: order.payment_status,
        newStatus: paymentStatus,
        transactionId,
      });

      // Actualizar estado de pago
      order.payment_status = paymentStatus;
      
      // Si el pago se completa, actualizar estado del pedido a confirmado
      if (paymentStatus === 'completed') {
        if (order.canTransitionTo('confirmed')) {
          order.status = 'confirmed';
          logger.info(`Order ${orderId} status updated to confirmed`);
        }
        
        // Actualizar estado de factura a pagada
        await this.updateInvoiceStatus(orderId, 'paid');
        
        // Emitir evento de pago completado
        if (transactionId) {
          orderEventService.emitPaymentCompleted(order, transactionId);
        }
      }
      
      // Si el pago es reembolsado, actualizar estado del pedido
      if (paymentStatus === 'refunded') {
        await order.updateStatus('refunded');
        
        // Actualizar estado de factura a cancelada
        await this.updateInvoiceStatus(orderId, 'cancelled');
        
        // Emitir evento de reembolso
        if (transactionId) {
          orderEventService.emitOrderRefunded(order, order.total_amount, transactionId);
        }
      }
      
      await order.save();

      logger.info(`Payment status updated successfully for order ${orderId}`);

      return order;
    } catch (error) {
      logger.error(`Error updating payment status for order ${orderId}:`, error);
      throw error;
    }
  }

  private async updateInvoiceStatus(
    orderId: number, 
    status: 'draft' | 'issued' | 'paid' | 'cancelled'
  ): Promise<void> {
    try {
      const invoice = await Invoice.findOne({ where: { order_id: orderId } });
      
      if (invoice) {
        invoice.status = status;
        await invoice.save();
        logger.info(`Invoice status updated to ${status} for order ${orderId}`);
      }
    } catch (error) {
      logger.error(`Error updating invoice status for order ${orderId}:`, error);
      // No lanzar error, solo loguear
    }
  }
}
