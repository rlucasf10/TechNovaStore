/**
 * Caso de uso: Obtener Factura por Número
 * 
 * Obtiene una factura específica por su número de factura.
 */

import { Invoice } from '../shared/models/Invoice';
import { Order } from '../shared/models/Order';
import { OrderItem } from '../shared/models/OrderItem';

export class GetInvoiceByNumber {
  async execute(invoiceNumber: string): Promise<Invoice | null> {
    return Invoice.findOne({
      where: { invoice_number: invoiceNumber },
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