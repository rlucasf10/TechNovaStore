/**
 * Cliente HTTP para comunicarse con el Order Service
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

export interface PaymentStatusInfo {
  paymentStatus: string;
  transactionId?: string;
  amount: number;
}

export class OrderServiceClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || process.env.ORDER_SERVICE_URL || 'http://order-service:3000';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Actualiza el estado de pago de un pedido
   */
  async updatePaymentStatus(
    orderId: number,
    paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded',
    transactionId?: string
  ): Promise<void> {
    try {
      logger.info(`Updating payment status for order ${orderId}`, {
        orderId,
        paymentStatus,
        transactionId,
      });

      await this.client.patch(`/orders/${orderId}/payment-status`, {
        paymentStatus,
        transactionId,
      });

      logger.info(`Payment status updated successfully for order ${orderId}`);
    } catch (error) {
      logger.error(`Failed to update payment status for order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene el estado de pago de un pedido
   */
  async getPaymentStatus(orderId: number): Promise<PaymentStatusInfo | null> {
    try {
      logger.debug(`Getting payment status for order ${orderId}`);

      const response = await this.client.get(`/orders/${orderId}/payment-status`);

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.warn(`Order ${orderId} not found`);
        return null;
      }

      logger.error(`Failed to get payment status for order ${orderId}:`, error);
      throw error;
    }
  }
}
