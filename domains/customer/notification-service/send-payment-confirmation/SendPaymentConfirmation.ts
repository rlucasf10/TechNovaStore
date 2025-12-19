/**
 * Caso de uso: Enviar confirmación de pago
 * Extraído del método sendPaymentConfirmation() del NotificationService original
 */

import { EmailService } from '../shared/email/EmailService';
import { TemplateService } from '../shared/templates/TemplateService';
import { logger } from '../shared/utils/logger';

export interface PaymentConfirmationData {
  orderId: string;
  customerEmail: string;
  paymentData: {
    amount: number;
    method: string;
    transactionId: string;
  };
}

export class SendPaymentConfirmation {
  constructor(
    private emailService: EmailService,
    private templateService: TemplateService
  ) {}

  async execute(data: PaymentConfirmationData): Promise<void> {
    try {
      // Lógica original del método sendPaymentConfirmation
      const notificationData = {
        orderId: data.orderId,
        amount: data.paymentData.amount,
        paymentMethod: data.paymentData.method,
        transactionId: data.paymentData.transactionId
      };

      const template = this.templateService.getTemplate('payment_confirmation', notificationData);
      await this.emailService.sendEmail(data.customerEmail, template);
      
      logger.info('Payment confirmation sent', { customerEmail: data.customerEmail, orderId: data.orderId });
    } catch (error) {
      logger.error('Failed to send payment confirmation', { orderId: data.orderId, error: error instanceof Error ? error.message : error });
      throw error;
    }
  }
}
