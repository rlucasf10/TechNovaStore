/**
 * Caso de uso: Obtener Pedido por ID
 * 
 * Obtiene un pedido específico por su ID con todos sus detalles.
 */

import { Order } from '../shared/models/Order';
import { OrderItem } from '../shared/models/OrderItem';
import { Invoice } from '../shared/models/Invoice';

export class GetOrderById {
  async execute(id: number): Promise<Order | null> {
    return Order.findByPk(id, {
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
