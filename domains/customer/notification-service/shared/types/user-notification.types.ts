/**
 * Tipos para notificaciones de usuario
 * 
 * Estas notificaciones se almacenan en la base de datos y se muestran
 * en el dashboard del usuario
 */

export type UserNotificationType = 
  | 'order'      // Notificaciones de pedidos
  | 'shipping'   // Notificaciones de envío
  | 'payment'    // Notificaciones de pago
  | 'system'     // Notificaciones del sistema
  | 'promotion'  // Notificaciones de promociones

export interface UserNotification {
  id: string
  user_id: string
  type: UserNotificationType
  title: string
  message: string
  read: boolean
  action_url?: string
  timestamp: Date
  created_at: Date
  updated_at: Date
}

export interface CreateUserNotificationData {
  user_id: string
  type: UserNotificationType
  title: string
  message: string
  action_url?: string
}

export interface GetUserNotificationsQuery {
  user_id: string
  type?: UserNotificationType
  read?: boolean
  limit?: number
  offset?: number
}

export interface MarkNotificationAsReadData {
  notification_id: string
  user_id: string
}

export interface DeleteNotificationData {
  notification_id: string
  user_id: string
}

export interface MarkAllAsReadData {
  user_id: string
}
