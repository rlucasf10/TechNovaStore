/**
 * Rutas HTTP para el servicio de notificaciones
 * 
 * ✅ SEGURIDAD: Todas las rutas de negocio requieren autenticación (Defense in Depth)
 * - Valida tokens JWT independientemente del API Gateway
 * - Protege contra bypass del gateway, ataques internos y misconfiguraciones
 * ✅ SEGURIDAD: Validación de entrada con express-validator (Requirements: 6.1, 6.2, 6.3, 6.4)
 */

import { Router, Request, Response } from 'express';
import { NotificationController } from './NotificationController';
import { authMiddleware } from '../shared/middleware/auth';
import { validateRequest } from '../shared/middleware/validateRequest';
import {
  validateUserId,
  validateNotificationId,
  validateCreateUserNotification,
  validateOrderConfirmation,
  validatePaymentConfirmation,
  validateShipmentStatus,
  validateDelayAlert,
  validateOrderCancellation,
  validateInvoiceGenerated,
} from '../shared/validators/notificationValidator';

export function createNotificationRoutes(controller: NotificationController): Router {
  const router = Router();

  // ============================================================================
  // Endpoints de envío de notificaciones (requieren autenticación y validación)
  // ============================================================================

  // Endpoint para enviar confirmación de pedido
  router.post('/order-confirmation', 
    authMiddleware, 
    validateOrderConfirmation,
    validateRequest,
    (req: Request, res: Response) => controller.sendOrderConfirmationHandler(req, res)
  );

  // Endpoint para enviar confirmación de pago
  router.post('/payment-confirmation', 
    authMiddleware, 
    validatePaymentConfirmation,
    validateRequest,
    (req: Request, res: Response) => controller.sendPaymentConfirmationHandler(req, res)
  );

  // Endpoint para enviar estado de envío
  router.post('/shipment-status', 
    authMiddleware, 
    validateShipmentStatus,
    validateRequest,
    (req: Request, res: Response) => controller.sendShipmentStatusHandler(req, res)
  );

  // Endpoint para enviar alerta de retraso
  router.post('/delay-alert', 
    authMiddleware, 
    validateDelayAlert,
    validateRequest,
    (req: Request, res: Response) => controller.sendDelayAlertHandler(req, res)
  );

  // Endpoint para enviar cancelación de pedido
  router.post('/order-cancellation', 
    authMiddleware, 
    validateOrderCancellation,
    validateRequest,
    (req: Request, res: Response) => controller.sendOrderCancellationHandler(req, res)
  );

  // Endpoint para enviar notificación de factura generada
  router.post('/invoice-generated', 
    authMiddleware, 
    validateInvoiceGenerated,
    validateRequest,
    (req: Request, res: Response) => controller.sendInvoiceGeneratedHandler(req, res)
  );

  // Endpoint para verificar retrasos en entregas
  router.post('/check-delays', 
    authMiddleware, 
    (req: Request, res: Response) => controller.checkDeliveryDelaysHandler(req, res)
  );

  // ============================================================================
  // Endpoints para gestión de notificaciones de usuario (requieren autenticación y validación)
  // ============================================================================

  // Obtener notificaciones de un usuario
  router.get('/user/:userId', 
    authMiddleware, 
    validateUserId,
    validateRequest,
    (req: Request, res: Response) => controller.getUserNotificationsHandler(req, res)
  );

  // Crear una notificación para un usuario
  router.post('/user', 
    authMiddleware, 
    validateCreateUserNotification,
    validateRequest,
    (req: Request, res: Response) => controller.createUserNotificationHandler(req, res)
  );

  // Marcar una notificación como leída
  router.put('/:notificationId/read', 
    authMiddleware, 
    validateNotificationId,
    validateRequest,
    (req: Request, res: Response) => controller.markNotificationReadHandler(req, res)
  );

  // Marcar todas las notificaciones de un usuario como leídas
  router.put('/user/:userId/mark-all-read', 
    authMiddleware, 
    validateUserId,
    validateRequest,
    (req: Request, res: Response) => controller.markAllNotificationsReadHandler(req, res)
  );

  // Eliminar una notificación
  router.delete('/:notificationId', 
    authMiddleware, 
    validateNotificationId,
    validateRequest,
    (req: Request, res: Response) => controller.deleteNotificationHandler(req, res)
  );

  return router;
}
