import { Order } from '../models/Order';
import { Invoice } from '../models/Invoice';
import { logger } from '../utils/logger';
import { orderEventService } from './eventService';

export interface PaymentRequest {
  orderId: number;
  amount: number;
  currency: string;
  paymentMethod: string;
  customerInfo: {
    email: string;
    name: string;
  };
  billingAddress: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  paymentStatus: 'completed' | 'failed' | 'pending' | 'refunded';
  message: string;
  errorCode?: string;
}

export class PaymentService {
  /**
   * Process payment for an order
   * This is a simplified implementation that simulates payment processing
   * In a real implementation, this would integrate with payment providers
   */
  static async processPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      logger.info(`Processing payment for order ${paymentRequest.orderId}`, {
        orderId: paymentRequest.orderId,
        amount: paymentRequest.amount,
        paymentMethod: paymentRequest.paymentMethod,
      });

      // Simulate payment processing based on payment method
      const response = await this.simulatePaymentProcessing(paymentRequest);

      if (response.success) {
        // Update order payment status
        await this.updateOrderPaymentStatus(paymentRequest.orderId, 'completed', response.transactionId);
        
        // Update invoice status
        await this.updateInvoiceStatus(paymentRequest.orderId, 'paid');
        
        logger.info(`Payment completed for order ${paymentRequest.orderId}`, {
          orderId: paymentRequest.orderId,
          transactionId: response.transactionId,
        });

        // Emit payment completed event
        const order = await Order.findByPk(paymentRequest.orderId);
        if (order && response.transactionId) {
          orderEventService.emitPaymentCompleted(order, response.transactionId);
        }
      } else {
        // Update order payment status to failed
        await this.updateOrderPaymentStatus(paymentRequest.orderId, 'failed');
        
        logger.error(`Payment failed for order ${paymentRequest.orderId}`, {
          orderId: paymentRequest.orderId,
          errorCode: response.errorCode,
          message: response.message,
        });
      }

      return response;
    } catch (error) {
      logger.error('Payment processing error:', error);
      
      // Update order payment status to failed
      await this.updateOrderPaymentStatus(paymentRequest.orderId, 'failed');
      
      return {
        success: false,
        paymentStatus: 'failed',
        message: 'Payment processing failed due to system error',
        errorCode: 'SYSTEM_ERROR',
      };
    }
  }

  /**
   * Simulate payment processing for different payment methods
   * In a real implementation, this would call actual payment provider APIs
   */
  private static async simulatePaymentProcessing(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { paymentMethod, amount } = paymentRequest;

    // Simulate different payment method behaviors
    switch (paymentMethod) {
      case 'credit_card':
      case 'debit_card':
        return this.simulateCardPayment(amount);
      
      case 'paypal':
        return this.simulatePayPalPayment(amount);
      
      case 'bank_transfer':
        return this.simulateBankTransfer(amount);
      
      case 'cash_on_delivery':
        return {
          success: true,
          transactionId: `COD-${Date.now()}`,
          paymentStatus: 'pending',
          message: 'Cash on delivery order created successfully',
        };
      
      default:
        return {
          success: false,
          paymentStatus: 'failed',
          message: 'Unsupported payment method',
          errorCode: 'UNSUPPORTED_METHOD',
        };
    }
  }

  private static simulateCardPayment(_amount: number): PaymentResponse {
    // Simulate 95% success rate for card payments
    const success = Math.random() > 0.05;
    
    if (success) {
      return {
        success: true,
        transactionId: `CARD-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        paymentStatus: 'completed',
        message: 'Card payment processed successfully',
      };
    } else {
      const errorCodes = ['INSUFFICIENT_FUNDS', 'CARD_DECLINED', 'EXPIRED_CARD'];
      const errorCode = errorCodes[Math.floor(Math.random() * errorCodes.length)];
      
      return {
        success: false,
        paymentStatus: 'failed',
        message: 'Card payment failed',
        errorCode,
      };
    }
  }

  private static simulatePayPalPayment(_amount: number): PaymentResponse {
    // Simulate 98% success rate for PayPal
    const success = Math.random() > 0.02;
    
    if (success) {
      return {
        success: true,
        transactionId: `PP-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        paymentStatus: 'completed',
        message: 'PayPal payment processed successfully',
      };
    } else {
      return {
        success: false,
        paymentStatus: 'failed',
        message: 'PayPal payment failed',
        errorCode: 'PAYPAL_ERROR',
      };
    }
  }

  private static simulateBankTransfer(_amount: number): PaymentResponse {
    // Bank transfers are always pending initially
    return {
      success: true,
      transactionId: `BT-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      paymentStatus: 'pending',
      message: 'Bank transfer initiated successfully',
    };
  }

  /**
   * Update order payment status
   */
  private static async updateOrderPaymentStatus(
    orderId: number, 
    paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded',
    _transactionId?: string
  ): Promise<void> {
    const order = await Order.findByPk(orderId);
    
    if (order) {
      order.payment_status = paymentStatus;
      
      // If payment is completed, update order status to confirmed
      if (paymentStatus === 'completed') {
        if (order.canTransitionTo('confirmed')) {
          order.status = 'confirmed';
        }
      }
      
      await order.save();
    }
  }

  /**
   * Update invoice status
   */
  private static async updateInvoiceStatus(
    orderId: number, 
    status: 'draft' | 'issued' | 'paid' | 'cancelled'
  ): Promise<void> {
    const invoice = await Invoice.findOne({ where: { order_id: orderId } });
    
    if (invoice) {
      invoice.status = status;
      await invoice.save();
    }
  }

  /**
   * Process refund for an order
   */
  static async processRefund(orderId: number, amount?: number): Promise<PaymentResponse> {
    try {
      const order = await Order.findByPk(orderId);
      
      if (!order) {
        return {
          success: false,
          paymentStatus: 'failed',
          message: 'Order not found',
          errorCode: 'ORDER_NOT_FOUND',
        };
      }

      if (order.payment_status !== 'completed') {
        return {
          success: false,
          paymentStatus: 'failed',
          message: 'Cannot refund order that was not paid',
          errorCode: 'INVALID_PAYMENT_STATUS',
        };
      }

      const refundAmount = amount || order.total_amount;
      
      logger.info(`Processing refund for order ${orderId}`, {
        orderId,
        refundAmount,
        originalAmount: order.total_amount,
      });

      // Simulate refund processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update order status
      await order.updateStatus('refunded');
      order.payment_status = 'refunded';
      await order.save();

      // Update invoice status
      await this.updateInvoiceStatus(orderId, 'cancelled');

      const transactionId = `REF-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      logger.info(`Refund completed for order ${orderId}`, {
        orderId,
        transactionId,
        refundAmount,
      });

      // Emit refund event
      orderEventService.emitOrderRefunded(order, refundAmount, transactionId);

      return {
        success: true,
        transactionId,
        paymentStatus: 'refunded',
        message: 'Refund processed successfully',
      };
    } catch (error) {
      logger.error('Refund processing error:', error);
      
      return {
        success: false,
        paymentStatus: 'failed',
        message: 'Refund processing failed',
        errorCode: 'REFUND_ERROR',
      };
    }
  }

  /**
   * Get payment status for an order
   */
  static async getPaymentStatus(orderId: number): Promise<{
    paymentStatus: string;
    transactionId?: string;
    amount: number;
  } | null> {
    const order = await Order.findByPk(orderId);
    
    if (!order) {
      return null;
    }

    return {
      paymentStatus: order.payment_status,
      amount: order.total_amount,
    };
  }

  /**
   * Validate payment method
   */
  static isValidPaymentMethod(paymentMethod: string): boolean {
    const validMethods = ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'];
    return validMethods.includes(paymentMethod);
  }
}