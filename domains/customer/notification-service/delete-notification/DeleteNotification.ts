/**
 * Caso de uso: Eliminar notificación
 * 
 * Permite eliminar una notificación específica
 */

import { UserNotificationRepository } from '../shared/repositories/UserNotificationRepository'
import { DeleteNotificationData } from '../shared/types/user-notification.types'

export class DeleteNotification {
  constructor(private repository: UserNotificationRepository) {}

  async execute(data: DeleteNotificationData): Promise<boolean> {
    const success = await this.repository.delete(
      data.notification_id,
      data.user_id
    )

    if (!success) {
      throw new Error('Notification not found or does not belong to user')
    }

    return true
  }
}
