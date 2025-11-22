/**
 * Caso de uso: Generar PDF de Factura
 * 
 * Genera un archivo PDF para una factura existente en formato español.
 */

import { Invoice } from '../shared/models/Invoice';
import { Order } from '../shared/models/Order';
import { OrderItem } from '../shared/models/OrderItem';
import { logger } from '../shared/utils/logger';
import * as PDFGenerator from '../shared/utils/pdfGenerator';
import { SpanishTaxCalculator } from '../shared/utils/spanishTaxCalculator';
import {
  CompanyInfo,
  CustomerInfo,
  InvoiceLineItem,
  SpanishInvoiceData,
} from '../shared/types/invoice';

export class GenerateInvoicePDF {
  private static readonly DEFAULT_COMPANY_INFO: CompanyInfo = {
    name: 'TechNovaStore S.L.',
    cif: 'B12345678', // Esto debería configurarse en variables de entorno
    address: {
      street: 'Calle Tecnología, 123',
      city: 'Madrid',
      postal_code: '28001',
      province: 'Madrid',
      country: 'España',
    },
    phone: '+34 91 123 45 67',
    email: 'facturacion@technovastore.com',
    website: 'www.technovastore.com',
  };

  async execute(invoiceId: number): Promise<string> {
    const invoice = await Invoice.findByPk(invoiceId, {
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

    if (!invoice) {
      throw new Error(`Invoice not found: ${invoiceId}`);
    }

    const invoiceData = await this.prepareSpanishInvoiceData(invoice);
    const pdfPath = await PDFGenerator.generateInvoicePDF(invoiceData);

    // Actualizar factura con URL del PDF
    invoice.pdf_url = pdfPath;
    await invoice.save();

    logger.info(`Invoice PDF generated: ${invoice.invoice_number}`, {
      invoiceId,
      pdfPath,
    });

    return pdfPath;
  }

  private async prepareSpanishInvoiceData(invoice: Invoice): Promise<SpanishInvoiceData> {
    const invoiceWithOrder = invoice as any;
    const order = invoiceWithOrder.order;

    if (!order) {
      throw new Error('Order not found for invoice');
    }

    // Preparar información del cliente desde el pedido
    const customerInfo: CustomerInfo = {
      name: `${order.billing_address.name || 'Cliente'}`,
      address: {
        street: order.billing_address.street,
        city: order.billing_address.city,
        postal_code: order.billing_address.postal_code,
        province: order.billing_address.state || order.billing_address.city,
        country: order.billing_address.country,
      },
    };

    // Preparar líneas de items
    const lineItems: InvoiceLineItem[] = (order.items || []).map((item: any) => {
      const taxRate = SpanishTaxCalculator.getTaxRateForProduct(item.product_name);
      const taxAmount = item.total_price * taxRate;

      return {
        description: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        tax_rate: taxRate,
        tax_amount: taxAmount,
      };
    });

    return {
      invoice_number: invoice.invoice_number,
      issue_date: invoice.issued_date,
      due_date: invoice.due_date,
      company_info: GenerateInvoicePDF.DEFAULT_COMPANY_INFO,
      customer_info: customerInfo,
      line_items: lineItems,
      subtotal: invoice.subtotal,
      total_tax: invoice.tax_amount,
      total_amount: invoice.total_amount,
      currency: invoice.currency,
      payment_method: order.payment_method,
      notes: order.notes,
    };
  }
}
