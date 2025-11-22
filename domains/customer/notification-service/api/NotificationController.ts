/**
 * Controlador HTTP para el servicio de notificaciones
 * Expone los casos de uso a través de endpoints REST
 */

import { Request, Response } from 'express';
import { SendOrderConfirmation } from '../send-order-confirmation/SendOrderConfirmation';
import { SendPaymentConfirmation } from '../send-payment-confirmation/SendPaymentConfirmation';
import { SendShipmentStatus } from '../send-shipment-status/SendShipmentStatus';
import { SendDelayAlert } from '../send-delay-alert/SendDelayAlert';
import { SendOrderCancellation } from '../send-order-cancellation/SendOrderCancellation';
import { SendInvoiceGenerated } from '../send-invoice-generated/SendInvoiceGenerated';
import { CheckDeliveryDelays } from '../check-delivery-delays/CheckDeliveryDelays';

export class NotificationController {
  constructor(
    private sendOrderConfirmation: SendOrderConfirmation,
    private sendPaymentConfirmation: SendPaymentConfirmation,
    private sendShipmentStatus: SendShipmentStatus,
    private sendDelayAlert: SendDelayAlert,
    private sendOrderCancellation: SendOrderCancellation,
    private sendInvoiceGenerated: SendInvoiceGenerated,
    private checkDeliveryDelays: CheckDeliveryDelays
  ) {}

  async sendOrderConfirmationHandler(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, customerEmail, orderData } = req.body;
      
      await this.sendOrderConfirmation.execute({
        orderId,
        customerEmail,
        orderData
      });

      res.json({
        success: true,
        message: 'Order confirmation sent successfully'
      });
    } catch (error: any) {
      console.error('Error sending order confirmation:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send order confirmation'
      });
    }
  }

  async sendPaymentConfirmationHandler(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, customerEmail, paymentData } = req.body;
      
      await this.sendPaymentConfirmation.execute({
        orderId,
        customerEmail,
        paymentData
      });

      res.json({
        success: true,
        message: 'Payment confirmation sent successfully'
      });
    } catch (error: any) {
      console.error('Error sending payment confirmation:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send payment confirmation'
      });
    }
  }

  async sendShipmentStatusHandler(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body;
      
      await this.sendShipmentStatus.execute(data);

      res.json({
        success: true,
        message: 'Shipment status notification sent successfully'
      });
    } catch (error: any) {
      console.error('Error sending shipment status:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send shipment status'
      });
    }
  }

  async sendDelayAlertHandler(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body;
      
      await this.sendDelayAlert.execute(data);

      res.json({
        success: true,
        message: 'Delay alert sent successfully'
      });
    } catch (error: any) {
      console.error('Error sending delay alert:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send delay alert'
      });
    }
  }

  async sendOrderCancellationHandler(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, customerEmail, reason } = req.body;
      
      await this.sendOrderCancellation.execute({
        orderId,
        customerEmail,
        reason
      });

      res.json({
        success: true,
        message: 'Order cancellation notification sent successfully'
      });
    } catch (error: any) {
      console.error('Error sending order cancellation:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send order cancellation'
      });
    }
  }

  async sendInvoiceGeneratedHandler(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, customerEmail, invoiceData } = req.body;
      
      await this.sendInvoiceGenerated.execute({
        orderId,
        customerEmail,
        invoiceData
      });

      res.json({
        success: true,
        message: 'Invoice notification sent successfully'
      });
    } catch (error: any) {
      console.error('Error sending invoice notification:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send invoice notification'
      });
    }
  }

  async checkDeliveryDelaysHandler(req: Request, res: Response): Promise<void> {
    try {
      const { orders } = req.body;
      
      await this.checkDeliveryDelays.execute(orders);

      res.json({
        success: true,
        message: 'Delivery delays checked successfully'
      });
    } catch (error: any) {
      console.error('Error checking delivery delays:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to check delivery delays'
      });
    }
  }
}
