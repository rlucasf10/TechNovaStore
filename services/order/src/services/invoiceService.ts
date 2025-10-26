import { Invoice } from '../models/Invoice';
import { Order } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { logger } from '../utils/logger';
import { sequelize } from '../config/database';
import * as PDFGenerator from '../utils/pdfGenerator';
import { SpanishTaxCalculator } from '../utils/spanishTaxCalculator';
import { InvoiceNumberGenerator } from '../utils/invoiceNumberGenerator';
import {
  CompanyInfo,
  CustomerInfo,
  InvoiceLineItem,
  SpanishInvoiceData,
} from '../types/invoice';

export class InvoiceService {
  private static readonly DEFAULT_COMPANY_INFO: CompanyInfo = {
    name: 'TechNovaStore S.L.',
    cif: 'B12345678', // This should be configured in environment
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

  /**
   * Generates an automatic invoice for a completed order
   * Complies with Spanish fiscal regulations (Real Decreto 1619/2012)
   */
  static async generateAutomaticInvoice(orderId: number): Promise<Invoice> {
    const transaction = await sequelize.transaction();

    try {
      // Get order with items
      const order = await Order.findByPk(orderId, {
        include: [
          {
            model: OrderItem,
            as: 'items',
          },
        ],
        transaction,
      });

      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }

      // Check if invoice already exists
      const existingInvoice = await Invoice.findOne({
        where: { order_id: orderId },
        transaction,
      });

      if (existingInvoice) {
        logger.warn(`Invoice already exists for order ${orderId}`, {
          invoiceId: existingInvoice.id,
          invoiceNumber: existingInvoice.invoice_number,
        });
        return existingInvoice;
      }

      // Generate sequential invoice number
      const invoiceNumber = await InvoiceNumberGenerator.generateNext();

      // Calculate Spanish taxes
      const orderWithItems = order as any;
      const taxCalculation = SpanishTaxCalculator.calculateTaxes(
        orderWithItems.items || [],
        order.billing_address.country === 'España'
      );

      // Create invoice
      const invoice = await Invoice.create({
        order_id: orderId,
        invoice_number: invoiceNumber,
        subtotal: taxCalculation.subtotal,
        tax_amount: taxCalculation.totalTax,
        total_amount: taxCalculation.totalWithTax,
        tax_rate: taxCalculation.averageTaxRate,
        currency: 'EUR',
        issued_date: new Date(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: 'issued',
      }, { transaction });

      await transaction.commit();

      logger.info(`Invoice generated automatically: ${invoiceNumber}`, {
        invoiceId: invoice.id,
        orderId,
        totalAmount: invoice.total_amount,
      });

      // Generate PDF asynchronously
      this.generateInvoicePDFAsync(invoice.id);

      return invoice;
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to generate automatic invoice:', error);
      throw error;
    }
  }

  /**
   * Generates a PDF for an existing invoice
   */
  static async generateInvoicePDF(invoiceId: number): Promise<string> {
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

    // Update invoice with PDF URL
    invoice.pdf_url = pdfPath;
    await invoice.save();

    logger.info(`Invoice PDF generated: ${invoice.invoice_number}`, {
      invoiceId,
      pdfPath,
    });

    return pdfPath;
  }

  /**
   * Generates PDF asynchronously without blocking
   */
  private static async generateInvoicePDFAsync(invoiceId: number): Promise<void> {
    try {
      await this.generateInvoicePDF(invoiceId);
    } catch (error) {
      logger.error(`Failed to generate PDF for invoice ${invoiceId}:`, error);
    }
  }

  /**
   * Prepares invoice data in Spanish format for PDF generation
   */
  private static async prepareSpanishInvoiceData(invoice: Invoice): Promise<SpanishInvoiceData> {
    const invoiceWithOrder = invoice as any;
    const order = invoiceWithOrder.order;

    if (!order) {
      throw new Error('Order not found for invoice');
    }

    // Prepare customer info from order
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

    // Prepare line items
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
      company_info: this.DEFAULT_COMPANY_INFO,
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

  /**
   * Gets invoice by ID with full order details
   */
  static async getInvoiceById(id: number): Promise<Invoice | null> {
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

  /**
   * Gets invoice by invoice number
   */
  static async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null> {
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

  /**
   * Updates invoice status
   */
  static async updateInvoiceStatus(
    id: number,
    status: 'draft' | 'issued' | 'paid' | 'cancelled'
  ): Promise<Invoice | null> {
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

  /**
   * Gets all invoices with pagination
   */
  static async getInvoices(options: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<{
    invoices: Invoice[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
    } = options;

    const where: any = {};
    if (status) where.status = status;
    if (startDate || endDate) {
      where.issued_date = {};
      if (startDate) where.issued_date.gte = startDate;
      if (endDate) where.issued_date.lte = endDate;
    }

    const offset = (page - 1) * limit;

    const { count, rows: invoices } = await Invoice.findAndCountAll({
      where,
      include: [
        {
          model: Order,
          as: 'order',
        },
      ],
      order: [['issued_date', 'DESC']],
      limit,
      offset,
    });

    return {
      invoices,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Cancels an invoice (only if not paid)
   */
  static async cancelInvoice(id: number, reason?: string): Promise<Invoice | null> {
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

  /**
   * Marks invoice as paid
   */
  static async markInvoiceAsPaid(id: number): Promise<Invoice | null> {
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