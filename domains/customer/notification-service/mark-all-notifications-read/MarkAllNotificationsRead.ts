/**
 * Caso de uso: Marcar todas las notificaciones como leídas
 * 
 * Permite marcar todas las notificaciones de un usuario como leídas
 */

import { UserNotificationRepository } from '../shared/repositories/UserNotificationRepository'
import { MarkAllAsReadData } from '../shared/types/user-notification.types'

export class MarkAllNotificationsRead {
  constructor(private repository: UserNotificationRepository) {}

  async execute(data: MarkAllAsReadData): Promise<number> {
    const count = await this.repository.markAllAsRead(data.user_id)
    return count
  }
}
