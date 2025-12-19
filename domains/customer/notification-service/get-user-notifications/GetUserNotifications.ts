/**
 * Caso de uso: Obtener notificaciones de un usuario
 * 
 * Permite obtener las notificaciones de un usuario con filtros opcionales
 */

import { UserNotificationRepository } from '../shared/repositories/UserNotificationRepository'
import { 
  UserNotification, 
  GetUserNotificationsQuery 
} from '../shared/types/user-notification.types'

export class GetUserNotifications {
  constructor(private repository: UserNotificationRepository) {}

  async execute(query: GetUserNotificationsQuery): Promise<{
    notifications: UserNotification[]
    unreadCount: number
  }> {
    // Obtener notificaciones con filtros
    const notifications = await this.repository.findByUserId(query)

    // Obtener contador de no leídas
    const unreadCount = await this.repository.countUnread(query.user_id)

    return {
      notifications,
      unreadCount
    }
  }
}
