/**
 * Tests para el caso de uso MarkNotificationRead
 */

import { MarkNotificationRead } from './MarkNotificationRead'
import { UserNotificationRepository } from '../shared/repositories/UserNotificationRepository'

// Mock del repositorio
const mockRepository = {
  findByUserId: jest.fn(),
  countUnread: jest.fn(),
  create: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  delete: jest.fn(),
  deleteOld: jest.fn()
} as unknown as UserNotificationRepository

describe('MarkNotificationRead', () => {
  let useCase: MarkNotificationRead

  beforeEach(() => {
    jest.clearAllMocks()
    useCase = new MarkNotificationRead(mockRepository)
  })

  it('debe marcar una notificación como leída', async () => {
    // Arrange
    ;(mockRepository.markAsRead as jest.Mock).mockResolvedValue(true)

    // Act
    const result = await useCase.execute({
      notification_id: 'notif-123',
      user_id: 'user-123'
    })

    // Assert
    expect(result).toBe(true)
    expect(mockRepository.markAsRead).toHaveBeenCalledWith('notif-123', 'user-123')
  })

  it('debe lanzar error si la notificación no existe', async () => {
    // Arrange
    ;(mockRepository.markAsRead as jest.Mock).mockResolvedValue(false)

    // Act & Assert
    await expect(useCase.execute({
      notification_id: 'notif-invalid',
      user_id: 'user-123'
    })).rejects.toThrow('Notification not found or does not belong to user')
  })

  it('debe lanzar error si la notificación no pertenece al usuario', async () => {
    // Arrange
    ;(mockRepository.markAsRead as jest.Mock).mockResolvedValue(false)

    // Act & Assert
    await expect(useCase.execute({
      notification_id: 'notif-123',
      user_id: 'user-wrong'
    })).rejects.toThrow('Notification not found or does not belong to user')
  })
})
