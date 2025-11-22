/**
 * Caso de uso: Reportar Fallo de Compra Automática
 * 
 * Registra un intento fallido de compra automática y deshabilita
 * la compra automática después de 3 intentos fallidos.
 */

import { Order } from '../shared/models/Order';
import { logger } from '../shared/utils/logger';

export class ReportAutoPurchaseFailure {
  async execute(
    orderId: number,
    errorMessage: string,
    providerAttempts: string[]
  ): Promise<Order | null> {
    const order = await Order.findByPk(orderId);
    
    if (!order) {
      return null;
    }

    // Actualizar información de fallo
    order.auto_purchase_attempts = (order.auto_purchase_attempts || 0) + 1;
    order.auto_purchase_last_error = errorMessage;
    order.auto_purchase_provider_attempts = providerAttempts;

    // Deshabilitar auto-compra después de 3 intentos fallidos
    if (order.auto_purchase_attempts >= 3) {
      order.auto_purchase_enabled = false;
      logger.warn(`Auto-purchase disabled after 3 failed attempts: ${order.order_number}`, {
        orderId: order.id,
        attempts: order.auto_purchase_attempts,
      });
    }

    await order.save();

    logger.error(`Auto-purchase failure reported: ${order.order_number}`, {
      orderId: order.id,
      errorMessage,
      providerAttempts,
      totalAttempts: order.auto_purchase_attempts,
    });

    return order;
  }
}
