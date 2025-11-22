/**
 * Rutas HTTP para el servicio de notificaciones
 */

import { Router } from 'express';
import { NotificationController } from './NotificationController';

export function createNotificationRoutes(controller: NotificationController): Router {
  const router = Router();

  // Endpoint para enviar confirmación de pedido
  router.post('/order-confirmation', (req, res) => 
    controller.sendOrderConfirmationHandler(req, res)
  );

  // Endpoint para enviar confirmación de pago
  router.post('/payment-confirmation', (req, res) => 
    controller.sendPaymentConfirmationHandler(req, res)
  );

  // Endpoint para enviar estado de envío
  router.post('/shipment-status', (req, res) => 
    controller.sendShipmentStatusHandler(req, res)
  );

  // Endpoint para enviar alerta de retraso
  router.post('/delay-alert', (req, res) => 
    controller.sendDelayAlertHandler(req, res)
  );

  // Endpoint para enviar cancelación de pedido
  router.post('/order-cancellation', (req, res) => 
    controller.sendOrderCancellationHandler(req, res)
  );

  // Endpoint para enviar notificación de factura generada
  router.post('/invoice-generated', (req, res) => 
    controller.sendInvoiceGeneratedHandler(req, res)
  );

  // Endpoint para verificar retrasos en entregas
  router.post('/check-delays', (req, res) => 
    controller.checkDeliveryDelaysHandler(req, res)
  );

  return router;
}
