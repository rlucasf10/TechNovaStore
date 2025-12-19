/**
 * Controlador HTTP para el servicio de notificaciones
 * Expone los casos de uso a través de endpoints REST
 * 
 * ✅ SEGURIDAD: Implementa verificación de propiedad de recursos
 * - Los usuarios solo pueden acceder a sus propias notificaciones
 * - Los admins pueden acceder a todas las notificaciones
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '@technovastore/shared-types';
import { SendOrderConfirmation } from '../send-order-confirmation/SendOrderConfirmation';
import { SendPaymentConfirmation } from '../send-payment-confirmation/SendPaymentConfirmation';
import { SendShipmentStatus } from '../send-shipment-status/SendShipmentStatus';
import { SendDelayAlert } from '../send-delay-alert/SendDelayAlert';
import { SendOrderCancellation } from '../send-order-cancellation/SendOrderCancellation';
import { SendInvoiceGenerated } from '../send-invoice-generated/SendInvoiceGenerated';
import { CheckDeliveryDelays } from '../check-delivery-delays/CheckDeliveryDelays';
import { GetUserNotifications } from '../get-user-notifications/GetUserNotifications';
import { CreateUserNotification } from '../create-user-notification/CreateUserNotification';
import { MarkNotificationRead } from '../mark-notification-read/MarkNotificationRead';
import { MarkAllNotificationsRead } from '../mark-all-notifications-read/MarkAllNotificationsRead';
import { DeleteNotification } from '../delete-notification/DeleteNotification';
import { logger } from '../shared/utils/logger';

export class NotificationController {
  constructor(
    private sendOrderConfirmation: SendOrderConfirmation,
    private sendPaymentConfirmation: SendPaymentConfirmation,
    private sendShipmentStatus: SendShipmentStatus,
    private sendDelayAlert: SendDelayAlert,
    private sendOrderCancellation: SendOrderCancellation,
    private sendInvoiceGenerated: SendInvoiceGenerated,
    private checkDeliveryDelays: CheckDeliveryDelays,
    private getUserNotifications: GetUserNotifications,
    private createUserNotification: CreateUserNotification,
    private markNotificationRead: MarkNotificationRead,
    private markAllNotificationsRead: MarkAllNotificationsRead,
    private deleteNotification: DeleteNotification
  ) {}

  async sendOrderConfirmationHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      logger.error('Error sending order confirmation:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send order confirmation'
      });
    }
  }

  async sendPaymentConfirmationHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      logger.error('Error sending payment confirmation:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send payment confirmation'
      });
    }
  }

  async sendShipmentStatusHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = req.body;
      
      await this.sendShipmentStatus.execute(data);

      res.json({
        success: true,
        message: 'Shipment status notification sent successfully'
      });
    } catch (error: any) {
      logger.error('Error sending shipment status:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send shipment status'
      });
    }
  }

  async sendDelayAlertHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = req.body;
      
      await this.sendDelayAlert.execute(data);

      res.json({
        success: true,
        message: 'Delay alert sent successfully'
      });
    } catch (error: any) {
      logger.error('Error sending delay alert:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send delay alert'
      });
    }
  }

  async sendOrderCancellationHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      logger.error('Error sending order cancellation:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send order cancellation'
      });
    }
  }

  async sendInvoiceGeneratedHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      logger.error('Error sending invoice notification:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send invoice notification'
      });
    }
  }

  async checkDeliveryDelaysHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { orders } = req.body;
      
      await this.checkDeliveryDelays.execute(orders);

      res.json({
        success: true,
        message: 'Delivery delays checked successfully'
      });
    } catch (error: any) {
      logger.error('Error checking delivery delays:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to check delivery delays'
      });
    }
  }

  // ============================================================================
  // Handlers para gestión de notificaciones de usuario
  // ============================================================================

  /**
   * Obtener notificaciones de un usuario
   * GET /api/notifications/user/:userId
   * 
   * ✅ SEGURIDAD: Verifica que el usuario autenticado es el dueño o es admin
   */
  async getUserNotificationsHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { type, read, limit, offset } = req.query;
      const authenticatedUserId = req.user!.id;
      const userRole = req.user!.role;

      // Verificar propiedad: el usuario solo puede ver sus propias notificaciones (excepto admins)
      if (userId !== authenticatedUserId && userRole !== 'admin') {
        logger.warn('Unauthorized access attempt to user notifications', {
          authenticatedUserId,
          requestedUserId: userId,
          endpoint: req.path,
        });
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }

      const result = await this.getUserNotifications.execute({
        user_id: userId,
        type: type as any,
        read: read === 'true' ? true : read === 'false' ? false : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Error getting user notifications:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get user notifications'
      });
    }
  }

  /**
   * Crear una notificación para un usuario
   * POST /api/notifications/user
   * 
   * ✅ SEGURIDAD: Verifica que el usuario puede crear notificaciones para el target_user
   * - Los usuarios pueden crear notificaciones para sí mismos
   * - Los admins pueden crear notificaciones para cualquier usuario
   */
  async createUserNotificationHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user_id, type, title, message, action_url } = req.body;
      const authenticatedUserId = req.user!.id;
      const userRole = req.user!.role;

      // Verificar permiso: el usuario solo puede crear notificaciones para sí mismo (excepto admins)
      if (user_id !== authenticatedUserId && userRole !== 'admin') {
        logger.warn('Unauthorized attempt to create notification for another user', {
          authenticatedUserId,
          targetUserId: user_id,
          endpoint: req.path,
        });
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }

      const notification = await this.createUserNotification.execute({
        user_id,
        type,
        title,
        message,
        action_url
      });

      res.status(201).json({
        success: true,
        data: notification
      });
    } catch (error: any) {
      logger.error('Error creating user notification:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create user notification'
      });
    }
  }

  /**
   * Marcar una notificación como leída
   * PUT /api/notifications/:notificationId/read
   * 
   * ✅ SEGURIDAD: Verifica que el usuario autenticado es el dueño de la notificación
   */
  async markNotificationReadHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { notificationId } = req.params;
      const { user_id } = req.body;
      const authenticatedUserId = req.user!.id;
      const userRole = req.user!.role;

      if (!user_id) {
        res.status(400).json({
          success: false,
          error: 'user_id is required'
        });
        return;
      }

      // Verificar propiedad: el usuario solo puede marcar sus propias notificaciones (excepto admins)
      if (user_id !== authenticatedUserId && userRole !== 'admin') {
        logger.warn('Unauthorized attempt to mark notification as read', {
          authenticatedUserId,
          targetUserId: user_id,
          notificationId,
          endpoint: req.path,
        });
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }

      await this.markNotificationRead.execute({
        notification_id: notificationId,
        user_id
      });

      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error: any) {
      logger.error('Error marking notification as read:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to mark notification as read'
      });
    }
  }

  /**
   * Marcar todas las notificaciones como leídas
   * PUT /api/notifications/user/:userId/mark-all-read
   * 
   * ✅ SEGURIDAD: Verifica que el usuario autenticado es el dueño
   */
  async markAllNotificationsReadHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const authenticatedUserId = req.user!.id;
      const userRole = req.user!.role;

      // Verificar propiedad: el usuario solo puede marcar sus propias notificaciones (excepto admins)
      if (userId !== authenticatedUserId && userRole !== 'admin') {
        logger.warn('Unauthorized attempt to mark all notifications as read', {
          authenticatedUserId,
          targetUserId: userId,
          endpoint: req.path,
        });
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }

      const count = await this.markAllNotificationsRead.execute({
        user_id: userId
      });

      res.json({
        success: true,
        message: `${count} notifications marked as read`,
        count
      });
    } catch (error: any) {
      logger.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to mark all notifications as read'
      });
    }
  }

  /**
   * Eliminar una notificación
   * DELETE /api/notifications/:notificationId
   * 
   * ✅ SEGURIDAD: Verifica que el usuario autenticado es el dueño de la notificación
   */
  async deleteNotificationHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { notificationId } = req.params;
      const { user_id } = req.body;
      const authenticatedUserId = req.user!.id;
      const userRole = req.user!.role;

      if (!user_id) {
        res.status(400).json({
          success: false,
          error: 'user_id is required'
        });
        return;
      }

      // Verificar propiedad: el usuario solo puede eliminar sus propias notificaciones (excepto admins)
      if (user_id !== authenticatedUserId && userRole !== 'admin') {
        logger.warn('Unauthorized attempt to delete notification', {
          authenticatedUserId,
          targetUserId: user_id,
          notificationId,
          endpoint: req.path,
        });
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }

      await this.deleteNotification.execute({
        notification_id: notificationId,
        user_id
      });

      res.json({
        success: true,
        message: 'Notification deleted'
      });
    } catch (error: any) {
      logger.error('Error deleting notification:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to delete notification'
      });
    }
  }
}
