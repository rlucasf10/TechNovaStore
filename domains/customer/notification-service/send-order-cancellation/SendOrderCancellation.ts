/**
 * Caso de uso: Enviar notificación de cancelación de pedido
 * Extraído del método sendOrderCancellation() del NotificationService original
 */

import { EmailService } from '../shared/email/EmailService';
import { TemplateService } from '../shared/templates/TemplateService';
import { logger } from '../shared/utils/logger';

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
      
      logger.info('Order cancellation sent', { customerEmail: data.customerEmail, orderId: data.orderId });
    } catch (error) {
      logger.error('Failed to send order cancellation', { orderId: data.orderId, error: error instanceof Error ? error.message : error });
      throw error;
    }
  }
}
