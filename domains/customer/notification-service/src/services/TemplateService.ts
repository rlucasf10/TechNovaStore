import { EmailTemplate, NotificationType, NotificationData } from '../types';

export class TemplateService {
  private templates: Map<NotificationType, (data: NotificationData) => EmailTemplate>;

  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Order confirmation template
    this.templates.set('order_confirmation', (data) => ({
      subject: `Confirmación de pedido #${data.orderNumber} - TechNovaStore`,
      html: this.getOrderConfirmationTemplate(data),
      text: `Hola ${data.customerName}, tu pedido #${data.orderNumber} ha sido confirmado por un total de €${data.totalAmount}.`
    }));

    // Shipment status update template
    this.templates.set('shipment_status_update', (data) => ({
      subject: `Actualización de envío - Pedido #${data.orderId} - TechNovaStore`,
      html: this.getShipmentStatusTemplate(data),
      text: `Tu pedido #${data.orderId} ha cambiado de estado a: ${data.status}. ${data.trackingNumber ? `Número de seguimiento: ${data.trackingNumber}` : ''}`
    }));

    // Delivery delay template
    this.templates.set('delivery_delay', (data) => ({
      subject: `Retraso en la entrega - Pedido #${data.orderId} - TechNovaStore`,
      html: this.getDelayAlertTemplate(data),
      text: `Lamentamos informarte que tu pedido #${data.orderId} se ha retrasado. Nueva fecha estimada: ${data.newEstimatedDelivery}.`
    }));

    // Order cancelled template
    this.templates.set('order_cancelled', (data) => ({
      subject: `Pedido cancelado #${data.orderId} - TechNovaStore`,
      html: this.getOrderCancelledTemplate(data),
      text: `Tu pedido #${data.orderId} ha sido cancelado. ${data.reason ? `Motivo: ${data.reason}` : ''}`
    }));

    // Payment confirmation template
    this.templates.set('payment_confirmation', (data) => ({
      subject: `Pago confirmado - Pedido #${data.orderId} - TechNovaStore`,
      html: this.getPaymentConfirmationTemplate(data),
      text: `El pago de €${data.amount} para tu pedido #${data.orderId} ha sido procesado exitosamente.`
    }));

    // Invoice generated template
    this.templates.set('invoice_generated', (data) => ({
      subject: `Factura generada - Pedido #${data.orderId} - TechNovaStore`,
      html: this.getInvoiceGeneratedTemplate(data),
      text: `Se ha generado la factura #${data.invoiceNumber} para tu pedido #${data.orderId}.`
    }));
  }

  getTemplate(type: NotificationType, data: NotificationData): EmailTemplate {
    const templateFunction = this.templates.get(type);
    if (!templateFunction) {
      throw new Error(`Template not found for notification type: ${type}`);
    }
    return templateFunction(data);
  }

  private getOrderConfirmationTemplate(data: NotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Confirmación de Pedido</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .order-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TechNovaStore</h1>
            <h2>Confirmación de Pedido</h2>
          </div>
          <div class="content">
            <p>Hola ${data.customerName || 'Cliente'},</p>
            <p>¡Gracias por tu compra! Hemos recibido tu pedido y está siendo procesado.</p>
            
            <div class="order-details">
              <h3>Detalles del Pedido</h3>
              <p><strong>Número de pedido:</strong> #${data.orderNumber}</p>
              <p><strong>Total:</strong> €${data.totalAmount}</p>
              <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
            </div>
            
            <p>Te mantendremos informado sobre el estado de tu pedido por email.</p>
          </div>
          <div class="footer">
            <p>© 2024 TechNovaStore - Tienda de Tecnología</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getShipmentStatusTemplate(data: NotificationData): string {
    const statusMessages = {
      'processing': 'Tu pedido está siendo preparado',
      'shipped': 'Tu pedido ha sido enviado',
      'in_transit': 'Tu pedido está en camino',
      'delivered': 'Tu pedido ha sido entregado',
      'exception': 'Ha ocurrido una incidencia con tu envío'
    };

    const statusMessage = statusMessages[data.status as keyof typeof statusMessages] || `Estado actualizado: ${data.status}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Actualización de Envío</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #27ae60; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .status-update { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #27ae60; }
          .tracking-info { background-color: #ecf0f1; padding: 10px; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TechNovaStore</h1>
            <h2>Actualización de Envío</h2>
          </div>
          <div class="content">
            <p>Hola,</p>
            <p>Tenemos una actualización sobre tu pedido #${data.orderId}.</p>
            
            <div class="status-update">
              <h3>${statusMessage}</h3>
              <p><strong>Estado actual:</strong> ${data.status}</p>
              ${data.trackingNumber ? `
                <div class="tracking-info">
                  <p><strong>Número de seguimiento:</strong> ${data.trackingNumber}</p>
                </div>
              ` : ''}
              ${data.estimatedDelivery ? `
                <p><strong>Fecha estimada de entrega:</strong> ${new Date(data.estimatedDelivery).toLocaleDateString('es-ES')}</p>
              ` : ''}
            </div>
            
            <p>Puedes seguir el estado de tu pedido en tiempo real desde tu cuenta.</p>
          </div>
          <div class="footer">
            <p>© 2024 TechNovaStore - Tienda de Tecnología</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getDelayAlertTemplate(data: NotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Retraso en la Entrega</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #e74c3c; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .delay-info { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #e74c3c; }
          .compensation { background-color: #d5f4e6; padding: 10px; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TechNovaStore</h1>
            <h2>Información sobre Retraso</h2>
          </div>
          <div class="content">
            <p>Estimado cliente,</p>
            <p>Lamentamos informarte que tu pedido #${data.orderId} se ha retrasado.</p>
            
            <div class="delay-info">
              <h3>Detalles del Retraso</h3>
              <p><strong>Fecha original de entrega:</strong> ${new Date(data.originalDelivery).toLocaleDateString('es-ES')}</p>
              <p><strong>Nueva fecha estimada:</strong> ${new Date(data.newEstimatedDelivery).toLocaleDateString('es-ES')}</p>
              ${data.reason ? `<p><strong>Motivo:</strong> ${data.reason}</p>` : ''}
            </div>
            
            <div class="compensation">
              <p><strong>Disculpas por las molestias</strong></p>
              <p>Entendemos que este retraso puede causarte inconvenientes. Nuestro equipo está trabajando para minimizar cualquier demora adicional.</p>
            </div>
            
            <p>Si tienes alguna pregunta o necesitas asistencia, no dudes en contactarnos.</p>
          </div>
          <div class="footer">
            <p>© 2024 TechNovaStore - Tienda de Tecnología</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getOrderCancelledTemplate(data: NotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Pedido Cancelado</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #95a5a6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .cancellation-info { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TechNovaStore</h1>
            <h2>Pedido Cancelado</h2>
          </div>
          <div class="content">
            <p>Hola,</p>
            <p>Tu pedido #${data.orderId} ha sido cancelado.</p>
            
            <div class="cancellation-info">
              <h3>Información de la Cancelación</h3>
              <p><strong>Pedido:</strong> #${data.orderId}</p>
              <p><strong>Fecha de cancelación:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
              ${data.reason ? `<p><strong>Motivo:</strong> ${data.reason}</p>` : ''}
            </div>
            
            <p>Si realizaste un pago, el reembolso será procesado en los próximos 3-5 días hábiles.</p>
          </div>
          <div class="footer">
            <p>© 2024 TechNovaStore - Tienda de Tecnología</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPaymentConfirmationTemplate(data: NotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Pago Confirmado</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #27ae60; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .payment-info { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TechNovaStore</h1>
            <h2>Pago Confirmado</h2>
          </div>
          <div class="content">
            <p>Hola,</p>
            <p>Hemos recibido tu pago correctamente.</p>
            
            <div class="payment-info">
              <h3>Detalles del Pago</h3>
              <p><strong>Pedido:</strong> #${data.orderId}</p>
              <p><strong>Importe:</strong> €${data.amount}</p>
              <p><strong>Método de pago:</strong> ${data.paymentMethod}</p>
              <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
            </div>
            
            <p>Tu pedido será procesado y enviado en breve.</p>
          </div>
          <div class="footer">
            <p>© 2024 TechNovaStore - Tienda de Tecnología</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getInvoiceGeneratedTemplate(data: NotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Factura Generada</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3498db; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .invoice-info { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TechNovaStore</h1>
            <h2>Factura Disponible</h2>
          </div>
          <div class="content">
            <p>Hola,</p>
            <p>Se ha generado la factura para tu pedido.</p>
            
            <div class="invoice-info">
              <h3>Información de la Factura</h3>
              <p><strong>Pedido:</strong> #${data.orderId}</p>
              <p><strong>Número de factura:</strong> ${data.invoiceNumber}</p>
              <p><strong>Importe total:</strong> €${data.totalAmount}</p>
              <p><strong>Fecha de emisión:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
            </div>
            
            <p>Puedes descargar tu factura desde tu cuenta de usuario.</p>
          </div>
          <div class="footer">
            <p>© 2024 TechNovaStore - Tienda de Tecnología</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}