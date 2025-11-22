/**
 * Caso de uso: Enviar notificación de cancelación de pedido
 * Extraído del método sendOrderCancellation() del NotificationService original
 */

import { EmailService } from '../shared/email/EmailService';
import { TemplateService } from '../shared/templates/TemplateService';

export interface OrderCancellationData {
  orderId: string;
  customerEmail: string;
  reason?: string;
}

export class SendOrderCancellation {
  constructor(
    private emailService: EmailService,
    private templateService: TemplateService
  ) {}

  async execute(data: OrderCancellationData): Promise<void> {
    try {
      // Lógica original del método sendOrderCancellation
      const notificationData = {
        orderId: data.orderId,
        reason: data.reason
      };

      const template = this.templateService.getTemplate('order_cancelled', notificationData);
      await this.emailService.sendEmail(data.customerEmail, template);
      
      console.log(`Order cancellation sent to ${data.customerEmail} for order ${data.orderId}`);
    } catch (error) {
      console.error(`Failed to send order cancellation for ${data.orderId}:`, error);
      throw error;
    }
  }
}
