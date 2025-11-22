/**
 * Caso de uso: Enviar confirmación de pedido
 * Extraído del método sendOrderConfirmation() del NotificationService original
 */

import { EmailService } from '../shared/email/EmailService';
import { TemplateService } from '../shared/templates/TemplateService';

export interface OrderConfirmationData {
  orderId: string;
  customerEmail: string;
  orderData: {
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    items: any[];
  };
}

export class SendOrderConfirmation {
  constructor(
    private emailService: EmailService,
    private templateService: TemplateService
  ) {}

  async execute(data: OrderConfirmationData): Promise<void> {
    try {
      // Lógica original del método sendOrderConfirmation
      const notificationData = {
        orderId: data.orderId,
        orderNumber: data.orderData.orderNumber,
        customerName: data.orderData.customerName,
        totalAmount: data.orderData.totalAmount,
        items: data.orderData.items
      };

      const template = this.templateService.getTemplate('order_confirmation', notificationData);
      await this.emailService.sendEmail(data.customerEmail, template);
      
      console.log(`Order confirmation sent to ${data.customerEmail} for order ${data.orderId}`);
    } catch (error) {
      console.error(`Failed to send order confirmation for ${data.orderId}:`, error);
      throw error;
    }
  }
}
