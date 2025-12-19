import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { Order } from '../models/Order';
import { userNotificationClient } from '../clients/UserNotificationClient';

export interface OrderEvent {
  type: 'order.created' | 'order.status_changed' | 'order.payment_completed' | 'order.cancelled' | 'order.refunded';
  orderId: number;
  orderNumber: string;
  userId: number;
  data: any;
  timestamp: Date;
}

class OrderEventService extends EventEmitter {
  constructor() {
    super();
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Log all events
    this.on('order.*', (event: OrderEvent) => {
      logger.info(`Order event: ${event.type}`, {
        orderId: event.orderId,
        orderNumber: event.orderNumber,
        userId: event.userId,
        timestamp: event.timestamp,
      });
    });

    // Handle order creation
    this.on('order.created', async (event: OrderEvent) => {
      logger.info(`New order created: ${event.orderNumber}`, {
        orderId: event.orderId,
        userId: event.userId,
        totalAmount: event.data.totalAmount,
      });

      // Crear notificación para el usuario
      await userNotificationClient.notifyOrderCreated(
        event.userId,
        event.orderNumber,
        event.data.totalAmount
      );
    });

    // Handle payment completion
    this.on('order.payment_completed', async (event: OrderEvent) => {
      logger.info(`Payment completed for order: ${event.orderNumber}`, {
        orderId: event.orderId,
        transactionId: event.data.transactionId,
      });

      // Crear notificación de pago completado
      await userNotificationClient.notifyPaymentCompleted(
        event.userId,
        event.orderNumber,
        event.data.amount
      );
    });

    // Handle order status changes
    this.on('order.status_changed', async (event: OrderEvent) => {
      const { previousStatus, newStatus } = event.data;
      
      logger.info(`Order status changed: ${event.orderNumber} (${previousStatus} -> ${newStatus})`, {
        orderId: event.orderId,
        previousStatus,
        newStatus,
      });

      // Handle specific status transitions
      switch (newStatus) {
        case 'confirmed':
          // Order is ready for auto-purchase
          await this.handleOrderConfirmed(event);
          break;
        
        case 'processing':
          // Order is being processed by provider
          await this.handleOrderProcessing(event);
          break;
        
        case 'shipped':
          // Order has been shipped
          await this.handleOrderShipped(event);
          break;
        
        case 'delivered':
          // Order has been delivered
          await this.handleOrderDelivered(event);
          break;
        
        case 'cancelled':
          // Order has been cancelled
          await this.handleOrderCancelled(event);
          break;
      }
    });

    // Handle order refunded
    this.on('order.refunded', async (event: OrderEvent) => {
      logger.info(`Order refunded: ${event.orderNumber}`, {
        orderId: event.orderId,
        refundAmount: event.data.refundAmount,
      });

      // Crear notificación de reembolso
      await userNotificationClient.notifyRefundProcessed(
        event.userId,
        event.orderNumber,
        event.data.refundAmount
      );
    });
  }

  private async handleOrderConfirmed(event: OrderEvent) {
    logger.info(`Order confirmed, ready for auto-purchase: ${event.orderNumber}`);
    
    // Crear notificación de pedido confirmado
    await userNotificationClient.notifyOrderConfirmed(
      event.userId,
      event.orderNumber
    );
  }

  private async handleOrderProcessing(event: OrderEvent) {
    logger.info(`Order processing started: ${event.orderNumber}`);
    
    // Notificación de procesamiento (opcional, puede ser muy frecuente)
    // Se puede habilitar si se desea
  }

  private async handleOrderShipped(event: OrderEvent) {
    logger.info(`Order shipped: ${event.orderNumber}`);
    
    // La notificación de envío la maneja el shipment-tracker
    // para incluir información de tracking
  }

  private async handleOrderDelivered(event: OrderEvent) {
    logger.info(`Order delivered: ${event.orderNumber}`);
    
    // La notificación de entrega la maneja el shipment-tracker
  }

  private async handleOrderCancelled(event: OrderEvent) {
    logger.info(`Order cancelled: ${event.orderNumber}`);
    
    // Crear notificación de cancelación
    await userNotificationClient.notifyOrderCancelled(
      event.userId,
      event.orderNumber,
      event.data.reason
    );
  }

  public emitOrderCreated(order: Order) {
    const event: OrderEvent = {
      type: 'order.created',
      orderId: order.id,
      orderNumber: order.order_number,
      userId: order.user_id,
      data: {
        totalAmount: order.total_amount,
        paymentMethod: order.payment_method,
        itemCount: 0, // Would be populated from order items
      },
      timestamp: new Date(),
    };

    this.emit('order.created', event);
    this.emit('order.*', event);
  }

  public emitOrderStatusChanged(order: Order, previousStatus: string) {
    const event: OrderEvent = {
      type: 'order.status_changed',
      orderId: order.id,
      orderNumber: order.order_number,
      userId: order.user_id,
      data: {
        previousStatus,
        newStatus: order.status,
      },
      timestamp: new Date(),
    };

    this.emit('order.status_changed', event);
    this.emit('order.*', event);
  }

  public emitPaymentCompleted(order: Order, transactionId: string) {
    const event: OrderEvent = {
      type: 'order.payment_completed',
      orderId: order.id,
      orderNumber: order.order_number,
      userId: order.user_id,
      data: {
        transactionId,
        amount: order.total_amount,
        paymentMethod: order.payment_method,
      },
      timestamp: new Date(),
    };

    this.emit('order.payment_completed', event);
    this.emit('order.*', event);
  }

  public emitOrderCancelled(order: Order, reason?: string) {
    const event: OrderEvent = {
      type: 'order.cancelled',
      orderId: order.id,
      orderNumber: order.order_number,
      userId: order.user_id,
      data: {
        reason,
        cancelledAt: new Date(),
      },
      timestamp: new Date(),
    };

    this.emit('order.cancelled', event);
    this.emit('order.*', event);
  }

  public emitOrderRefunded(order: Order, refundAmount: number, transactionId: string) {
    const event: OrderEvent = {
      type: 'order.refunded',
      orderId: order.id,
      orderNumber: order.order_number,
      userId: order.user_id,
      data: {
        refundAmount,
        transactionId,
        refundedAt: new Date(),
      },
      timestamp: new Date(),
    };

    this.emit('order.refunded', event);
    this.emit('order.*', event);
  }
}

// Export singleton instance
export const orderEventService = new OrderEventService();