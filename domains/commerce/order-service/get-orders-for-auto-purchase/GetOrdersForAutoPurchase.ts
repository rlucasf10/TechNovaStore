/**
 * Caso de uso: Obtener Pedidos para Compra Automática
 * 
 * Obtiene pedidos confirmados con pago completado que están habilitados
 * para compra automática y aún no tienen ID de proveedor.
 */

import { Order } from '../shared/models/Order';
import { OrderItem } from '../shared/models/OrderItem';

export class GetOrdersForAutoPurchase {
  async execute(): Promise<Order[]> {
    // Obtener pedidos confirmados, pago completado, y habilitados para auto-compra
    return Order.findAll({
      where: {
        status: 'confirmed',
        payment_status: 'completed',
        provider_order_id: null,
        auto_purchase_enabled: true,
      } as any,
      include: [
        {
          model: OrderItem,
          as: 'items',
        },
      ],
      order: [['created_at', 'ASC']], // Procesar pedidos más antiguos primero
      limit: 50, // Limitar para prevenir sobrecarga
    });
  }
}
