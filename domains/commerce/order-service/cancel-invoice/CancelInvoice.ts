/**
 * Caso de uso: Cancelar Factura
 * 
 * Cancela una factura (solo si no está pagada).
 */

import { Invoice } from '../shared/models/Invoice';
import { logger } from '../shared/utils/logger';

export class CancelInvoice {
  async execute(id: number, reason?: string): Promise<Invoice | null> {
    const invoice = await Invoice.findByPk(id);

    if (!invoice) {
      return null;
    }

    if (invoice.status === 'paid') {
      throw new Error('Cannot cancel a paid invoice');
    }

    invoice.status = 'cancelled';
    await invoice.save();

    logger.info(`Invoice cancelled: ${invoice.invoice_number}`, {
      invoiceId: invoice.id,
      reason,
    });

    return invoice;
  }
}
