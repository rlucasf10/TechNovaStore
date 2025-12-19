/**
 * Caso de uso: Enviar alerta de retraso en entrega
 * Extraído del método sendDelayAlert() del NotificationService original
 */

import { EmailService } from '../shared/email/EmailService';
import { TemplateService } from '../shared/templates/TemplateService';
import { DelayAlertData } from '../shared/types/index';
import { logger } from '../shared/utils/logger';

export class SendDelayAlert {
  constructor(
    private emailService: EmailService,
    private templateService: TemplateService
  ) {}

  async execute(data: DelayAlertData): Promise<void> {
    try {
      // Lógica original del método sendDelayAlert
      const notificationData = {
        orderId: data.orderId,
        originalDelivery: data.originalDelivery,
        newEstimatedDelivery: data.newEstimatedDelivery,
        reason: data.reason
      };

      const template = this.templateService.getTemplate('delivery_delay', notificationData);
      await this.emailService.sendEmail(data.customerEmail, template);
      
      logger.info('Delay alert sent', { customerEmail: data.customerEmail, orderId: data.orderId });
    } catch (error) {
      logger.error('Failed to send delay alert', { orderId: data.orderId, error: error instanceof Error ? error.message : error });
      throw error;
    }
  }
}
