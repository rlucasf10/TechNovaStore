/**
 * Cliente HTTP para el servicio de notificaciones de usuario
 * 
 * Permite crear notificaciones en la base de datos del notification-service
 * para que se muestren en el dashboard del usuario
 */

import http from 'http';
import { logger } from '../utils/logger';

// Tipos de notificación soportados
export type NotificationType = 'order' | 'shipping' | 'payment' | 'system' | 'promotion';

export interface CreateNotificationData {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  action_url?: string;
}

export interface NotificationResponse {
  success: boolean;
  data?: any;
  error?: string;
}

class UserNotificationClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    // URL del notification-service (interno en Docker)
    this.baseUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3000';
    this.timeout = 5000; // 5 segundos
  }

  /**
   * Crear una notificación para un usuario
   */
  async createNotification(data: CreateNotificationData): Promise<NotificationResponse> {
    try {
      const response = await this.post('/api/notifications/user', data);
      return response;
    } catch (error) {
      logger.error('Error creating user notification', { error: error instanceof Error ? error.message : error });
      // No lanzar error para no afectar el flujo principal
      return { success: false, error: String(error) };
    }
  }

  /**
   * Notificar pedido creado
   */
  async notifyOrderCreated(userId: number, orderNumber: string, totalAmount: number): Promise<void> {
    // Asegurar que totalAmount es un número
    const amount = Number(totalAmount) || 0;
    await this.createNotification({
      user_id: String(userId),
      type: 'order',
      title: 'Pedido creado',
      message: `Tu pedido ${orderNumber} ha sido creado por un total de ${amount.toFixed(2)}€. Estamos procesando tu solicitud.`,
      action_url: `/dashboard/usuario?tab=orders`
    });
  }

  /**
   * Notificar pedido confirmado
   */
  async notifyOrderConfirmed(userId: number, orderNumber: string): Promise<void> {
    await this.createNotification({
      user_id: String(userId),
      type: 'order',
      title: 'Pedido confirmado',
      message: `Tu pedido ${orderNumber} ha sido confirmado y está siendo preparado para envío.`,
      action_url: `/dashboard/usuario?tab=orders`
    });
  }

  /**
   * Notificar pedido cancelado
   */
  async notifyOrderCancelled(userId: number, orderNumber: string, reason?: string): Promise<void> {
    const reasonText = reason ? ` Motivo: ${reason}` : '';
    await this.createNotification({
      user_id: String(userId),
      type: 'order',
      title: 'Pedido cancelado',
      message: `Tu pedido ${orderNumber} ha sido cancelado.${reasonText}`,
      action_url: `/dashboard/usuario?tab=orders`
    });
  }

  /**
   * Notificar pago completado
   */
  async notifyPaymentCompleted(userId: number, orderNumber: string, amount: number): Promise<void> {
    const amountNum = Number(amount) || 0;
    await this.createNotification({
      user_id: String(userId),
      type: 'payment',
      title: 'Pago confirmado',
      message: `Hemos recibido tu pago de ${amountNum.toFixed(2)}€ para el pedido ${orderNumber}.`,
      action_url: `/dashboard/usuario?tab=orders`
    });
  }

  /**
   * Notificar reembolso procesado
   */
  async notifyRefundProcessed(userId: number, orderNumber: string, amount: number): Promise<void> {
    const amountNum = Number(amount) || 0;
    await this.createNotification({
      user_id: String(userId),
      type: 'payment',
      title: 'Reembolso procesado',
      message: `Se ha procesado un reembolso de ${amountNum.toFixed(2)}€ para el pedido ${orderNumber}. El dinero llegará a tu cuenta en 3-5 días hábiles.`,
      action_url: `/dashboard/usuario?tab=orders`
    });
  }

  /**
   * Realizar petición POST al notification-service
   */
  private post(path: string, data: any): Promise<NotificationResponse> {
    return new Promise((resolve) => {
      const url = new URL(this.baseUrl);
      const postData = JSON.stringify(data);

      const options: http.RequestOptions = {
        hostname: url.hostname,
        port: url.port || 3000,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: this.timeout
      };

      const req = http.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            resolve(parsed);
          } catch {
            resolve({ success: false, error: 'Invalid JSON response' });
          }
        });
      });

      req.on('error', (error) => {
        logger.error('Notification request error', { error: error.message });
        resolve({ success: false, error: error.message });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, error: 'Request timeout' });
      });

      req.write(postData);
      req.end();
    });
  }
}

// Exportar instancia singleton
export const userNotificationClient = new UserNotificationClient();
