/**
 * Caso de uso: Procesar Reembolso
 * 
 * Procesa un reembolso para un pedido pagado.
 */

import { logger } from '../shared/utils/logger';
import { OrderServiceClient } from '../shared/clients/OrderServiceClient';

export interface RefundResponse {
  success: boolean;
  transactionId?: string;
  paymentStatus: 'completed' | 'failed' | 'pending' | 'refunded';
  message: string;
  errorCode?: string;
}

export class ProcessRefund {
  async execute(orderId: number, amount?: number, authHeaders?: Record<string, string>): Promise<RefundResponse> {
    try {
      // Crear cliente con headers de autenticación si se proporcionan
      const orderServiceClient = new OrderServiceClient(undefined, authHeaders);

      // Obtener información del pedido
      const orderInfo = await orderServiceClient.getPaymentStatus(orderId);
      
      if (!orderInfo) {
        return {
          success: false,
          paymentStatus: 'failed',
          message: 'Order not found',
          errorCode: 'ORDER_NOT_FOUND',
        };
      }

      if (orderInfo.paymentStatus !== 'completed') {
        return {
          success: false,
          paymentStatus: 'failed',
          message: 'Cannot refund order that was not paid',
          errorCode: 'INVALID_PAYMENT_STATUS',
        };
      }

      const refundAmount = amount || orderInfo.amount;
      
      logger.info(`Processing refund for order ${orderId}`, {
        orderId,
        refundAmount,
        originalAmount: orderInfo.amount,
      });

      // Simular procesamiento de reembolso
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const transactionId = `REF-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Notificar al Order Service sobre el reembolso
      await orderServiceClient.updatePaymentStatus(orderId, 'refunded', transactionId);

      logger.info(`Refund completed for order ${orderId}`, {
        orderId,
        transactionId,
        refundAmount,
      });

      return {
        success: true,
        transactionId,
        paymentStatus: 'refunded',
        message: 'Refund processed successfully',
      };
    } catch (error) {
      logger.error('Refund processing error', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      return {
        success: false,
        paymentStatus: 'failed',
        message: 'Refund processing failed',
        errorCode: 'REFUND_ERROR',
      };
    }
  }
}
