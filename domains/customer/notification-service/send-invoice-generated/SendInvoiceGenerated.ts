/**
 * Caso de uso: Enviar notificación de factura generada
 * Extraído del método sendInvoiceGenerated() del NotificationService original
 */

import { EmailService } from '../shared/email/EmailService';
import { TemplateService } from '../shared/templates/TemplateService';
import { logger } from '../shared/utils/logger';

export interface InvoiceGeneratedData {
  orderId: string;
  customerEmail: string;
  invoiceData: {
    invoiceNumber: string;
    totalAmount: number;
    pdfUrl: string;
  };
}

export class SendInvoiceGenerated {
  constructor(
    private emailService: EmailService,
    private templateService: TemplateService
  ) {}

  async execute(data: InvoiceGeneratedData): Promise<void> {
    try {
      // Lógica original del método sendInvoiceGenerated
      const notificationData = {
        orderId: data.orderId,
        invoiceNumber: data.invoiceData.invoiceNumber,
        totalAmount: data.invoiceData.totalAmount,
        pdfUrl: data.invoiceData.pdfUrl
      };

      const template = this.templateService.getTemplate('invoice_generated', notificationData);
      await this.emailService.sendEmail(data.customerEmail, template);
      
      logger.info('Invoice notification sent', { customerEmail: data.customerEmail, orderId: data.orderId });
    } catch (error) {
      logger.error('Failed to send invoice notification', { orderId: data.orderId, error: error instanceof Error ? error.message : error });
      throw error;
    }
  }
}
