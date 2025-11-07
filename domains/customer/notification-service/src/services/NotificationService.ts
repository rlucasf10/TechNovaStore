import { EmailService } from './EmailService';
import { TemplateService } from './TemplateService';
import { NotificationType, NotificationData, ShipmentStatusData, DelayAlertData } from '../types';

export class NotificationService {
  private emailService: EmailService;
  private templateService: TemplateService;

  constructor(emailService: EmailService, templateService: TemplateService) {
    this.emailService = emailService;
    this.templateService = templateService;
  }

  async sendNotification(type: NotificationType, recipient: string, data: NotificationData): Promise<void> {
    try {
      const template = this.templateService.getTemplate(type, data);
      await this.emailService.sendEmail(recipient, template);
      
      console.log(`Notification sent successfully: ${type} to ${recipient}`);
    } catch (error) {
      console.error(`Failed to send notification: ${type} to ${recipient}`, error);
      throw error;
    }
  }

  async sendShipmentStatusNotification(data: ShipmentStatusData): Promise<void> {
    const notificationData = {
      orderId: data.orderId,
      status: data.status,
      trackingNumber: data.trackingNumber,
      estimatedDelivery: data.estimatedDelivery
    };

    await this.sendNotification('shipment_status_update', data.customerEmail, notificationData);
  }

  async sendDelayAlert(data: DelayAlertData): Promise<void> {
    const notificationData = {
      orderId: data.orderId,
      originalDelivery: data.originalDelivery,
      newEstimatedDelivery: data.newEstimatedDelivery,
      reason: data.reason
    };

    await this.sendNotification('delivery_delay', data.customerEmail, notificationData);
  }

  async sendOrderConfirmation(orderId: string, customerEmail: string, orderData: any): Promise<void> {
    const notificationData = {
      orderId,
      orderNumber: orderData.orderNumber,
      customerName: orderData.customerName,
      totalAmount: orderData.totalAmount,
      items: orderData.items
    };

    await this.sendNotification('order_confirmation', customerEmail, notificationData);
  }

  async sendPaymentConfirmation(orderId: string, customerEmail: string, paymentData: any): Promise<void> {
    const notificationData = {
      orderId,
      amount: paymentData.amount,
      paymentMethod: paymentData.method,
      transactionId: paymentData.transactionId
    };

    await this.sendNotification('payment_confirmation', customerEmail, notificationData);
  }

  async sendOrderCancellation(orderId: string, customerEmail: string, reason?: string): Promise<void> {
    const notificationData = {
      orderId,
      reason
    };

    await this.sendNotification('order_cancelled', customerEmail, notificationData);
  }

  async sendInvoiceGenerated(orderId: string, customerEmail: string, invoiceData: any): Promise<void> {
    const notificationData = {
      orderId,
      invoiceNumber: invoiceData.invoiceNumber,
      totalAmount: invoiceData.totalAmount,
      pdfUrl: invoiceData.pdfUrl
    };

    await this.sendNotification('invoice_generated', customerEmail, notificationData);
  }

  // Batch notification methods for efficiency
  async sendBulkNotifications(notifications: Array<{
    type: NotificationType;
    recipient: string;
    data: NotificationData;
  }>): Promise<void> {
    const promises = notifications.map(notification => 
      this.sendNotification(notification.type, notification.recipient, notification.data)
    );

    try {
      await Promise.allSettled(promises);
      console.log(`Bulk notifications processed: ${notifications.length} notifications`);
    } catch (error) {
      console.error('Error in bulk notification processing:', error);
      throw error;
    }
  }

  // Delay detection and alert system
  async checkForDelays(orders: Array<{
    orderId: string;
    customerEmail: string;
    estimatedDelivery: Date;
    currentStatus: string;
  }>): Promise<void> {
    const now = new Date();
    const delayedOrders = orders.filter(order => {
      const estimatedDelivery = new Date(order.estimatedDelivery);
      return estimatedDelivery < now && !['delivered', 'cancelled'].includes(order.currentStatus);
    });

    for (const order of delayedOrders) {
      const newEstimatedDelivery = new Date(order.estimatedDelivery);
      newEstimatedDelivery.setDate(newEstimatedDelivery.getDate() + 3); // Add 3 days as default

      await this.sendDelayAlert({
        orderId: order.orderId,
        originalDelivery: new Date(order.estimatedDelivery),
        newEstimatedDelivery,
        customerEmail: order.customerEmail,
        reason: 'Retraso en el procesamiento del proveedor'
      });
    }
  }
}