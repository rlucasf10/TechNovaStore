/**
 * Caso de uso: Actualizar Información del Proveedor
 * 
 * Actualiza la información del proveedor para un pedido (usado por auto-purchase).
 */

import { Order } from '../shared/models/Order';
import { logger } from '../shared/utils/logger';

export interface ProviderInfoData {
  provider_order_id?: string;
  provider_name?: string;
  tracking_number?: string;
  estimated_delivery?: Date;
  actual_cost?: number;
}

export class UpdateProviderInfo {
  async execute(orderId: number, data: ProviderInfoData): Promise<Order | null> {
    const order = await Order.findByPk(orderId);
    
    if (!order) {
      return null;
    }

    // Actualizar campos si se proporcionan
    if (data.provider_order_id) order.provider_order_id = data.provider_order_id;
    if (data.provider_name) order.provider_name = data.provider_name;
    if (data.tracking_number) order.tracking_number = data.tracking_number;
    if (data.estimated_delivery) order.estimated_delivery = data.estimated_delivery;
    if (data.actual_cost !== undefined) order.actual_cost = data.actual_cost;

    await order.save();

    logger.info(`Provider info updated: ${order.order_number}`, {
      orderId: order.id,
      data,
    });

    return order;
  }
}
