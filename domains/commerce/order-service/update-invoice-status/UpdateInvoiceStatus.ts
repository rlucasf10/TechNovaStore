/**
 * Caso de uso: Actualizar Estado de Factura
 * 
 * Actualiza el estado de una factura (borrador, emitida, pagada, cancelada).
 */

import { Invoice } from '../shared/models/Invoice';
import { logger } from '../shared/utils/logger';

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled';

export class UpdateInvoiceStatus {
  async execute(id: number, status: InvoiceStatus): Promise<Invoice | null> {
    const invoice = await Invoice.findByPk(id);

    if (!invoice) {
      return null;
    }

    const previousStatus = invoice.status;
    invoice.status = status;
    await invoice.save();

    logger.info(`Invoice status updated: ${invoice.invoice_number} -> ${status}`, {
      invoiceId: invoice.id,
      previousStatus,
      newStatus: status,
    });

    return invoice;
  }
}
