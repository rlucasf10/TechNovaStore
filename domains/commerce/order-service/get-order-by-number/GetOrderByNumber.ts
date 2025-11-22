/**
 * Caso de uso: Obtener Pedido por Número
 * 
 * Obtiene un pedido específico por su número de pedido.
 */

import { Order } from '../shared/models/Order';
import { OrderItem } from '../shared/models/OrderItem';
import { Invoice } from '../shared/models/Invoice';

export class GetOrderByNumber {
  async execute(orderNumber: string): Promise<Order | null> {
    return Order.findOne({
      where: { order_number: orderNumber },
      include: [
        {
          model: OrderItem,
          as: 'items',
        },
        {
          model: Invoice,
          as: 'invoice',
        },
      ],
    });
  }
}
