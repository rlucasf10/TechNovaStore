/**
 * Caso de uso: Enviar actualización de estado de envío
 * Extraído del método sendShipmentStatusNotification() del NotificationService original
 */

import { EmailService } from '../shared/email/EmailService';
import { TemplateService } from '../shared/templates/TemplateService';
import { ShipmentStatusData } from '../shared/types/index';

export class SendShipmentStatus {
  constructor(
    private emailService: EmailService,
    private templateService: TemplateService
  ) {}

  async execute(data: ShipmentStatusData): Promise<void> {
    try {
      // Lógica original del método sendShipmentStatusNotification
      const notificationData = {
        orderId: data.orderId,
        status: data.status,
        trackingNumber: data.trackingNumber,
        estimatedDelivery: data.estimatedDelivery
      };

      const template = this.templateService.getTemplate('shipment_status_update', notificationData);
      await this.emailService.sendEmail(data.customerEmail, template);
      
      console.log(`Shipment status sent to ${data.customerEmail} for order ${data.orderId}`);
    } catch (error) {
      console.error(`Failed to send shipment status for ${data.orderId}:`, error);
      throw error;
    }
  }
}
