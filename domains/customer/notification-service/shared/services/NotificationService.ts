/**
 * Servicio de notificaciones legacy
 * Mantiene compatibilidad con código existente
 */

import { EmailService } from '../email/EmailService';
import { TemplateService } from '../templates/TemplateService';

export class NotificationService {
  constructor(
    private emailService: EmailService,
    private templateService: TemplateService
  ) {}

  async sendNotification(type: string, recipient: string, data: any): Promise<void> {
    // Map legacy type names to NotificationType
    const typeMap: Record<string, any> = {
      'order_confirmation': 'order_confirmation',
      'payment_confirmation': 'payment_confirmation',
      'shipment_status': 'shipment_status_update',
      'delay_alert': 'delivery_delay',
      'order_cancellation': 'order_cancelled',
      'invoice_generated': 'invoice_generated'
    };

    const notificationType = typeMap[type];
    if (!notificationType) {
      throw new Error(`Unknown notification type: ${type}`);
    }

    const template = this.templateService.getTemplate(notificationType, data);

    await this.emailService.sendEmail(recipient, template);
  }
}
