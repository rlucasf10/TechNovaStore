/**
 * Caso de uso: Obtener Factura por ID
 * 
 * Obtiene una factura específica por su ID con todos los detalles del pedido.
 */

import { Invoice } from '../shared/models/Invoice';
import { Order } from '../shared/models/Order';
import { OrderItem } from '../shared/models/OrderItem';

export class GetInvoiceById {
  async execute(id: number): Promise<Invoice | null> {
    return Invoice.findByPk(id, {
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            {
              model: OrderItem,
              as: 'items',
            },
          ],
        },
      ],
    });
  }
}
