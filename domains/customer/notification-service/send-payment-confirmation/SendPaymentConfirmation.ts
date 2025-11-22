/**
 * Caso de uso: Enviar confirmación de pago
 * Extraído del método sendPaymentConfirmation() del NotificationService original
 */

import { EmailService } from '../shared/email/EmailService';
import { TemplateService } from '../shared/templates/TemplateService';

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
      
      console.log(`Payment confirmation sent to ${data.customerEmail} for order ${data.orderId}`);
    } catch (error) {
      console.error(`Failed to send payment confirmation for ${data.orderId}:`, error);
      throw error;
    }
  }
}
