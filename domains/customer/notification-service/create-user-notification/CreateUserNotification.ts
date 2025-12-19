/**
 * Caso de uso: Crear notificación de usuario
 * 
 * Permite crear una nueva notificación para un usuario
 */

import { UserNotificationRepository } from '../shared/repositories/UserNotificationRepository'
import { 
  UserNotification,
  CreateUserNotificationData 
} from '../shared/types/user-notification.types'

export class CreateUserNotification {
  constructor(private repository: UserNotificationRepository) {}

  async execute(data: CreateUserNotificationData): Promise<UserNotification> {
    // Validar datos
    if (!data.user_id || !data.type || !data.title || !data.message) {
      throw new Error('Missing required fields: user_id, type, title, message')
    }

    // Crear notificación
    const notification = await this.repository.create(data)

    return notification
  }
}
