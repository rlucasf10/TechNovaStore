/**
 * Caso de uso: Marcar Factura como Pagada
 * 
 * Marca una factura como pagada (solo si no está cancelada).
 */

import { Invoice } from '../shared/models/Invoice';
import { logger } from '../shared/utils/logger';

export class MarkInvoiceAsPaid {
  async execute(id: number): Promise<Invoice | null> {
    const invoice = await Invoice.findByPk(id);

    if (!invoice) {
      return null;
    }

    if (invoice.status === 'cancelled') {
      throw new Error('Cannot mark a cancelled invoice as paid');
    }

    invoice.status = 'paid';
    await invoice.save();

    logger.info(`Invoice marked as paid: ${invoice.invoice_number}`, {
      invoiceId: invoice.id,
    });

    return invoice;
  }
}
