import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { Order } from '../models/Order';

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

      // Here you could trigger notifications, analytics, etc.
      // For example: await NotificationService.sendOrderConfirmation(event);
    });

    // Handle payment completion
    this.on('order.payment_completed', async (event: OrderEvent) => {
      logger.info(`Payment completed for order: ${event.orderNumber}`, {
        orderId: event.orderId,
        transactionId: event.data.transactionId,
      });

      // Trigger auto-purchase process
      // For example: await AutoPurchaseService.processOrder(event.orderId);
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
  }

  private async handleOrderConfirmed(event: OrderEvent) {
    // This would trigger the auto-purchase system
    logger.info(`Order confirmed, ready for auto-purchase: ${event.orderNumber}`);
    
    // In a real implementation, this would send a message to the auto-purchase service
    // await this.notifyAutoPurchaseService(event.orderId);
  }

  private async handleOrderProcessing(event: OrderEvent) {
    // Order is being processed by the provider
    logger.info(`Order processing started: ${event.orderNumber}`);
    
    // Could send customer notification about processing
    // await NotificationService.sendProcessingNotification(event);
  }

  private async handleOrderShipped(event: OrderEvent) {
    // Order has been shipped
    logger.info(`Order shipped: ${event.orderNumber}`);
    
    // Send shipping notification to customer
    // await NotificationService.sendShippingNotification(event);
  }

  private async handleOrderDelivered(event: OrderEvent) {
    // Order has been delivered
    logger.info(`Order delivered: ${event.orderNumber}`);
    
    // Send delivery confirmation and request feedback
    // await NotificationService.sendDeliveryNotification(event);
    // await FeedbackService.requestFeedback(event);
  }

  private async handleOrderCancelled(event: OrderEvent) {
    // Order has been cancelled
    logger.info(`Order cancelled: ${event.orderNumber}`);
    
    // Send cancellation notification
    // await NotificationService.sendCancellationNotification(event);
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