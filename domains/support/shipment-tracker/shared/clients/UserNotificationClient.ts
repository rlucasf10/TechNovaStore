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
      logger.error('Error creating user notification', { 
        userId: data.user_id, 
        type: data.type,
        error: String(error) 
      });
      // No lanzar error para no afectar el flujo principal
      return { success: false, error: String(error) };
    }
  }

  /**
   * Notificar actualización de envío
   */
  async notifyShipmentUpdate(
    userId: number, 
    orderNumber: string, 
    status: string,
    trackingNumber?: string
  ): Promise<void> {
    const statusMessages: { [key: string]: string } = {
      'label_created': 'Se ha creado la etiqueta de envío',
      'picked_up': 'El transportista ha recogido tu pedido',
      'in_transit': 'Tu pedido está en camino',
      'out_for_delivery': 'Tu pedido saldrá para entrega hoy',
      'delivered': 'Tu pedido ha sido entregado',
      'exception': 'Hay un problema con tu envío',
      'returned': 'Tu pedido está siendo devuelto',
      'cancelled': 'El envío ha sido cancelado'
    };

    const message = statusMessages[status] || 'El estado de tu envío ha sido actualizado';
    const trackingInfo = trackingNumber ? ` Número de seguimiento: ${trackingNumber}` : '';

    await this.createNotification({
      user_id: String(userId),
      type: 'shipping',
      title: this.getShipmentTitle(status),
      message: `${message} para el pedido ${orderNumber}.${trackingInfo}`,
      action_url: `/dashboard/usuario?tab=tracking`
    });
  }

  /**
   * Notificar retraso en la entrega
   */
  async notifyDeliveryDelay(
    userId: number,
    orderNumber: string,
    originalDate: Date,
    newDate: Date
  ): Promise<void> {
    const delayDays = Math.ceil((newDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24));
    
    await this.createNotification({
      user_id: String(userId),
      type: 'shipping',
      title: 'Retraso en la entrega',
      message: `Tu pedido ${orderNumber} tiene un retraso de ${delayDays} día(s). Nueva fecha estimada: ${newDate.toLocaleDateString('es-ES')}.`,
      action_url: `/dashboard/usuario?tab=tracking`
    });
  }

  /**
   * Notificar pedido entregado
   */
  async notifyOrderDelivered(userId: number, orderNumber: string): Promise<void> {
    await this.createNotification({
      user_id: String(userId),
      type: 'shipping',
      title: '¡Pedido entregado!',
      message: `Tu pedido ${orderNumber} ha sido entregado correctamente. ¡Esperamos que lo disfrutes!`,
      action_url: `/dashboard/usuario?tab=orders`
    });
  }

  /**
   * Obtener título según el estado del envío
   */
  private getShipmentTitle(status: string): string {
    const titles: { [key: string]: string } = {
      'label_created': 'Etiqueta de envío creada',
      'picked_up': 'Pedido recogido',
      'in_transit': 'Pedido en tránsito',
      'out_for_delivery': 'En reparto',
      'delivered': '¡Pedido entregado!',
      'exception': 'Incidencia en el envío',
      'returned': 'Pedido en devolución',
      'cancelled': 'Envío cancelado'
    };

    return titles[status] || 'Actualización de envío';
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
        logger.error('Notification request error', { 
          error: error.message,
          path 
        });
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
