/**
 * Caso de uso: Enviar alerta de retraso en entrega
 * Extraído del método sendDelayAlert() del NotificationService original
 */

import { EmailService } from '../shared/email/EmailService';
import { TemplateService } from '../shared/templates/TemplateService';
import { DelayAlertData } from '../shared/types/index';

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
      
      console.log(`Delay alert sent to ${data.customerEmail} for order ${data.orderId}`);
    } catch (error) {
      console.error(`Failed to send delay alert for ${data.orderId}:`, error);
      throw error;
    }
  }
}
