/**
 * Caso de uso: Generar Factura Automática
 * 
 * Genera una factura automática para un pedido completado,
 * cumpliendo con las regulaciones fiscales españolas (Real Decreto 1619/2012).
 */

import { Invoice } from '../shared/models/Invoice';
import { Order } from '../shared/models/Order';
import { OrderItem } from '../shared/models/OrderItem';
import { logger } from '../shared/utils/logger';
import { sequelize } from '../config/database';
import { SpanishTaxCalculator } from '../shared/utils/spanishTaxCalculator';
import { InvoiceNumberGenerator } from '../shared/utils/invoiceNumberGenerator';
import { GenerateInvoicePDF } from '../generate-invoice-pdf/GenerateInvoicePDF';

export class GenerateAutomaticInvoice {
  private generatePDF: GenerateInvoicePDF;

  constructor() {
    this.generatePDF = new GenerateInvoicePDF();
  }

  async execute(orderId: number): Promise<Invoice> {
    const transaction = await sequelize.transaction();

    try {
      // Obtener pedido con items
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

      // Verificar si ya existe una factura
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

      // Generar número de factura secuencial
      const invoiceNumber = await InvoiceNumberGenerator.generateNext();

      // Calcular impuestos españoles
      const orderWithItems = order as any;
      const taxCalculation = SpanishTaxCalculator.calculateTaxes(
        orderWithItems.items || [],
        order.billing_address.country === 'España'
      );

      // Crear factura
      const invoice = await Invoice.create({
        order_id: orderId,
        invoice_number: invoiceNumber,
        subtotal: taxCalculation.subtotal,
        tax_amount: taxCalculation.totalTax,
        total_amount: taxCalculation.totalWithTax,
        tax_rate: taxCalculation.averageTaxRate,
        currency: 'EUR',
        issued_date: new Date(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        status: 'issued',
      }, { transaction });

      await transaction.commit();

      logger.info(`Invoice generated automatically: ${invoiceNumber}`, {
        invoiceId: invoice.id,
        orderId,
        totalAmount: invoice.total_amount,
      });

      // Generar PDF de forma asíncrona
      this.generatePDFAsync(invoice.id);

      return invoice;
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to generate automatic invoice:', error);
      throw error;
    }
  }

  private async generatePDFAsync(invoiceId: number): Promise<void> {
    try {
      await this.generatePDF.execute(invoiceId);
    } catch (error) {
      logger.error(`Failed to generate PDF for invoice ${invoiceId}:`, error);
    }
  }
}
