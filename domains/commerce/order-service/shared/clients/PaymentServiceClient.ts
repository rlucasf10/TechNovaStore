/**
 * Cliente HTTP para comunicarse con el Payment Service
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

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

export interface RefundResponse {
  success: boolean;
  transactionId?: string;
  paymentStatus: 'completed' | 'failed' | 'pending' | 'refunded';
  message: string;
  errorCode?: string;
}

export interface PaymentStatusInfo {
  paymentStatus: string;
  transactionId?: string;
  amount: number;
}

export class PaymentServiceClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3000';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 segundos para procesamiento de pagos
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Procesa un pago
   */
  async processPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      logger.info(`Calling Payment Service to process payment for order ${paymentRequest.orderId}`);

      const response = await this.client.post('/api/payments/process', paymentRequest);

      logger.info(`Payment processed successfully for order ${paymentRequest.orderId}`);

      return response.data;
    } catch (error: any) {
      logger.error(`Failed to process payment for order ${paymentRequest.orderId}:`, error);
      
      // Si el Payment Service devuelve un error estructurado, usarlo
      if (error.response?.data) {
        return error.response.data;
      }

      // Error de comunicación
      return {
        success: false,
        paymentStatus: 'failed',
        message: 'Payment service unavailable',
        errorCode: 'SERVICE_UNAVAILABLE',
      };
    }
  }

  /**
   * Procesa un reembolso
   */
  async processRefund(orderId: number, amount?: number): Promise<RefundResponse> {
    try {
      logger.info(`Calling Payment Service to process refund for order ${orderId}`);

      const response = await this.client.post(`/api/payments/${orderId}/refund`, { amount });

      logger.info(`Refund processed successfully for order ${orderId}`);

      return response.data;
    } catch (error: any) {
      logger.error(`Failed to process refund for order ${orderId}:`, error);
      
      if (error.response?.data) {
        return error.response.data;
      }

      return {
        success: false,
        paymentStatus: 'failed',
        message: 'Payment service unavailable',
        errorCode: 'SERVICE_UNAVAILABLE',
      };
    }
  }

  /**
   * Obtiene el estado de pago de un pedido
   */
  async getPaymentStatus(orderId: number): Promise<PaymentStatusInfo | null> {
    try {
      logger.debug(`Getting payment status for order ${orderId} from Payment Service`);

      const response = await this.client.get(`/api/payments/${orderId}/status`);

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.warn(`Payment status not found for order ${orderId}`);
        return null;
      }

      logger.error(`Failed to get payment status for order ${orderId}:`, error);
      throw error;
    }
  }
}
