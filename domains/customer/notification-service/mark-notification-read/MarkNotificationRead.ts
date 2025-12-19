/**
 * Caso de uso: Marcar notificación como leída
 * 
 * Permite marcar una notificación específica como leída
 */

import { UserNotificationRepository } from '../shared/repositories/UserNotificationRepository'
import { MarkNotificationAsReadData } from '../shared/types/user-notification.types'

export class MarkNotificationRead {
  constructor(private repository: UserNotificationRepository) {}

  async execute(data: MarkNotificationAsReadData): Promise<boolean> {
    const success = await this.repository.markAsRead(
      data.notification_id,
      data.user_id
    )

    if (!success) {
      throw new Error('Notification not found or does not belong to user')
    }

    return true
  }
}
