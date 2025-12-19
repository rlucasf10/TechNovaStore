/**
 * Tests para el caso de uso CreateUserNotification
 */

import { CreateUserNotification } from './CreateUserNotification'
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

describe('CreateUserNotification', () => {
  let useCase: CreateUserNotification

  beforeEach(() => {
    jest.clearAllMocks()
    useCase = new CreateUserNotification(mockRepository)
  })

  it('debe crear una notificación correctamente', async () => {
    // Arrange
    const notificationData = {
      user_id: 'user-123',
      type: 'order' as const,
      title: 'Pedido confirmado',
      message: 'Tu pedido #12345 ha sido confirmado'
    }

    const mockCreatedNotification = {
      id: 'notif-1',
      ...notificationData,
      read: false,
      timestamp: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    }

    ;(mockRepository.create as jest.Mock).mockResolvedValue(mockCreatedNotification)

    // Act
    const result = await useCase.execute(notificationData)

    // Assert
    expect(result).toEqual(mockCreatedNotification)
    expect(mockRepository.create).toHaveBeenCalledWith(notificationData)
  })

  it('debe crear una notificación con action_url', async () => {
    // Arrange
    const notificationData = {
      user_id: 'user-123',
      type: 'shipping' as const,
      title: 'Pedido enviado',
      message: 'Tu pedido está en camino',
      action_url: '/dashboard/usuario?tab=tracking'
    }

    const mockCreatedNotification = {
      id: 'notif-2',
      ...notificationData,
      read: false,
      timestamp: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    }

    ;(mockRepository.create as jest.Mock).mockResolvedValue(mockCreatedNotification)

    // Act
    const result = await useCase.execute(notificationData)

    // Assert
    expect(result.action_url).toBe('/dashboard/usuario?tab=tracking')
    expect(mockRepository.create).toHaveBeenCalledWith(notificationData)
  })

  it('debe lanzar error si falta user_id', async () => {
    // Arrange
    const invalidData = {
      user_id: '',
      type: 'order' as const,
      title: 'Pedido confirmado',
      message: 'Tu pedido ha sido confirmado'
    }

    // Act & Assert
    await expect(useCase.execute(invalidData)).rejects.toThrow(
      'Missing required fields: user_id, type, title, message'
    )
    expect(mockRepository.create).not.toHaveBeenCalled()
  })

  it('debe lanzar error si falta type', async () => {
    // Arrange
    const invalidData = {
      user_id: 'user-123',
      type: '' as any,
      title: 'Pedido confirmado',
      message: 'Tu pedido ha sido confirmado'
    }

    // Act & Assert
    await expect(useCase.execute(invalidData)).rejects.toThrow(
      'Missing required fields: user_id, type, title, message'
    )
  })

  it('debe lanzar error si falta title', async () => {
    // Arrange
    const invalidData = {
      user_id: 'user-123',
      type: 'order' as const,
      title: '',
      message: 'Tu pedido ha sido confirmado'
    }

    // Act & Assert
    await expect(useCase.execute(invalidData)).rejects.toThrow(
      'Missing required fields: user_id, type, title, message'
    )
  })

  it('debe lanzar error si falta message', async () => {
    // Arrange
    const invalidData = {
      user_id: 'user-123',
      type: 'order' as const,
      title: 'Pedido confirmado',
      message: ''
    }

    // Act & Assert
    await expect(useCase.execute(invalidData)).rejects.toThrow(
      'Missing required fields: user_id, type, title, message'
    )
  })

  it('debe crear notificaciones de diferentes tipos', async () => {
    // Arrange
    const types = ['order', 'shipping', 'payment', 'system', 'promotion'] as const

    for (const type of types) {
      const notificationData = {
        user_id: 'user-123',
        type,
        title: `Notificación de ${type}`,
        message: `Mensaje de prueba para ${type}`
      }

      const mockCreatedNotification = {
        id: `notif-${type}`,
        ...notificationData,
        read: false,
        timestamp: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }

      ;(mockRepository.create as jest.Mock).mockResolvedValue(mockCreatedNotification)

      // Act
      const result = await useCase.execute(notificationData)

      // Assert
      expect(result.type).toBe(type)
    }
  })
})
