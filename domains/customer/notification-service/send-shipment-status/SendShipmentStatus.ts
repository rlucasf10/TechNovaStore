/**
 * Caso de uso: Enviar actualización de estado de envío
 * Extraído del método sendShipmentStatusNotification() del NotificationService original
 */

import { EmailService } from '../shared/email/EmailService';
import { TemplateService } from '../shared/templates/TemplateService';
import { ShipmentStatusData } from '../shared/types/index';
import { logger } from '../shared/utils/logger';

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
      
      logger.info('Shipment status sent', { customerEmail: data.customerEmail, orderId: data.orderId });
    } catch (error) {
      logger.error('Failed to send shipment status', { orderId: data.orderId, error: error instanceof Error ? error.message : error });
      throw error;
    }
  }
}
