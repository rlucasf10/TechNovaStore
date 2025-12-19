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
  async execute(orderId: number, authHeaders?: Record<string, string>): Promise<PaymentStatusInfo | null> {
    // Crear cliente con headers de autenticación si se proporcionan
    const orderServiceClient = new OrderServiceClient(undefined, authHeaders);
    return await orderServiceClient.getPaymentStatus(orderId);
  }
}
