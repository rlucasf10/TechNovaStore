/**
 * Caso de uso: Obtener Estado de Pago
 * 
 * Obtiene el estado actual del pago de un pedido desde el Order Service.
 */

import { OrderServiceClient } from '../shared/clients/OrderServiceClient';

export interface PaymentStatusInfo {
  paymentStatus: string;
  transactionId?: string;
  amount: number;
}

export class GetPaymentStatus {
  private orderServiceClient: OrderServiceClient;

  constructor(orderServiceClient?: OrderServiceClient) {
    this.orderServiceClient = orderServiceClient || new OrderServiceClient();
  }

  async execute(orderId: number): Promise<PaymentStatusInfo | null> {
    return await this.orderServiceClient.getPaymentStatus(orderId);
  }
}
