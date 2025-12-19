/**
 * Tests para el caso de uso MarkAllNotificationsRead
 */

import { MarkAllNotificationsRead } from './MarkAllNotificationsRead'
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

describe('MarkAllNotificationsRead', () => {
  let useCase: MarkAllNotificationsRead

  beforeEach(() => {
    jest.clearAllMocks()
    useCase = new MarkAllNotificationsRead(mockRepository)
  })

  it('debe marcar todas las notificaciones como leídas', async () => {
    // Arrange
    const userId = 'user-123'
    ;(mockRepository.markAllAsRead as jest.Mock).mockResolvedValue(5)

    // Act
    const result = await useCase.execute({ user_id: userId })

    // Assert
    expect(result).toBe(5)
    expect(mockRepository.markAllAsRead).toHaveBeenCalledWith(userId)
  })

  it('debe retornar 0 si no hay notificaciones sin leer', async () => {
    // Arrange
    const userId = 'user-456'
    ;(mockRepository.markAllAsRead as jest.Mock).mockResolvedValue(0)

    // Act
    const result = await useCase.execute({ user_id: userId })

    // Assert
    expect(result).toBe(0)
    expect(mockRepository.markAllAsRead).toHaveBeenCalledWith(userId)
  })

  it('debe manejar múltiples notificaciones correctamente', async () => {
    // Arrange
    const userId = 'user-789'
    ;(mockRepository.markAllAsRead as jest.Mock).mockResolvedValue(15)

    // Act
    const result = await useCase.execute({ user_id: userId })

    // Assert
    expect(result).toBe(15)
    expect(mockRepository.markAllAsRead).toHaveBeenCalledTimes(1)
  })

  it('debe propagar errores del repositorio', async () => {
    // Arrange
    const userId = 'user-error'
    const error = new Error('Database connection failed')
    ;(mockRepository.markAllAsRead as jest.Mock).mockRejectedValue(error)

    // Act & Assert
    await expect(useCase.execute({ user_id: userId })).rejects.toThrow(
      'Database connection failed'
    )
  })

  it('debe funcionar con diferentes formatos de user_id', async () => {
    // Arrange - UUID format
    const uuidUserId = '550e8400-e29b-41d4-a716-446655440000'
    ;(mockRepository.markAllAsRead as jest.Mock).mockResolvedValue(3)

    // Act
    const result = await useCase.execute({ user_id: uuidUserId })

    // Assert
    expect(result).toBe(3)
    expect(mockRepository.markAllAsRead).toHaveBeenCalledWith(uuidUserId)
  })
})
