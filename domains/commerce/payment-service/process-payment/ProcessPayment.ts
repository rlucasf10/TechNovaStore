/**
 * Caso de uso: Procesar Pago
 * 
 * Procesa el pago de un pedido y actualiza su estado.
 * Esta es una implementación simplificada que simula el procesamiento de pagos.
 * En una implementación real, esto se integraría con proveedores de pago.
 */

import { logger } from '../shared/utils/logger';
import { OrderServiceClient } from '../shared/clients/OrderServiceClient';

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

export class ProcessPayment {
  private orderServiceClient: OrderServiceClient;

  constructor(orderServiceClient?: OrderServiceClient) {
    this.orderServiceClient = orderServiceClient || new OrderServiceClient();
  }

  async execute(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      logger.info(`Processing payment for order ${paymentRequest.orderId}`, {
        orderId: paymentRequest.orderId,
        amount: paymentRequest.amount,
        paymentMethod: paymentRequest.paymentMethod,
      });

      // Simular procesamiento de pago basado en el método de pago
      const response = await this.simulatePaymentProcessing(paymentRequest);

      if (response.success) {
        // Notificar al Order Service sobre el pago exitoso
        await this.orderServiceClient.updatePaymentStatus(
          paymentRequest.orderId,
          'completed',
          response.transactionId
        );
        
        logger.info(`Payment completed for order ${paymentRequest.orderId}`, {
          orderId: paymentRequest.orderId,
          transactionId: response.transactionId,
        });
      } else {
        // Notificar al Order Service sobre el pago fallido
        await this.orderServiceClient.updatePaymentStatus(
          paymentRequest.orderId,
          'failed'
        );
        
        logger.error(`Payment failed for order ${paymentRequest.orderId}`, {
          orderId: paymentRequest.orderId,
          errorCode: response.errorCode,
          message: response.message,
        });
      }

      return response;
    } catch (error) {
      logger.error('Payment processing error:', error);
      
      // Notificar al Order Service sobre el error
      try {
        await this.orderServiceClient.updatePaymentStatus(paymentRequest.orderId, 'failed');
      } catch (notifyError) {
        logger.error('Failed to notify order service:', notifyError);
      }
      
      return {
        success: false,
        paymentStatus: 'failed',
        message: 'Payment processing failed due to system error',
        errorCode: 'SYSTEM_ERROR',
      };
    }
  }

  private async simulatePaymentProcessing(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    // Simular delay de procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { paymentMethod, amount } = paymentRequest;

    // Simular diferentes comportamientos según el método de pago
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

  private simulateCardPayment(_amount: number): PaymentResponse {
    // Simular 95% de tasa de éxito para pagos con tarjeta
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

  private simulatePayPalPayment(_amount: number): PaymentResponse {
    // Simular 98% de tasa de éxito para PayPal
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

  private simulateBankTransfer(_amount: number): PaymentResponse {
    // Las transferencias bancarias siempre están pendientes inicialmente
    return {
      success: true,
      transactionId: `BT-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      paymentStatus: 'pending',
      message: 'Bank transfer initiated successfully',
    };
  }
}
