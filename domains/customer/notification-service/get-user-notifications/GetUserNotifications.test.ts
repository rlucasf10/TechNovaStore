/**
 * Tests para el caso de uso GetUserNotifications
 */

import { GetUserNotifications } from './GetUserNotifications'
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

describe('GetUserNotifications', () => {
  let useCase: GetUserNotifications

  beforeEach(() => {
    jest.clearAllMocks()
    useCase = new GetUserNotifications(mockRepository)
  })

  it('debe obtener notificaciones de un usuario', async () => {
    // Arrange
    const mockNotifications = [
      {
        id: '1',
        user_id: 'user-123',
        type: 'order',
        title: 'Pedido confirmado',
        message: 'Tu pedido ha sido confirmado',
        read: false,
        timestamp: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '2',
        user_id: 'user-123',
        type: 'shipping',
        title: 'Pedido enviado',
        message: 'Tu pedido está en camino',
        read: true,
        timestamp: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }
    ]

    ;(mockRepository.findByUserId as jest.Mock).mockResolvedValue(mockNotifications)
    ;(mockRepository.countUnread as jest.Mock).mockResolvedValue(1)

    // Act
    const result = await useCase.execute({ user_id: 'user-123' })

    // Assert
    expect(result.notifications).toHaveLength(2)
    expect(result.unreadCount).toBe(1)
    expect(mockRepository.findByUserId).toHaveBeenCalledWith({ user_id: 'user-123' })
    expect(mockRepository.countUnread).toHaveBeenCalledWith('user-123')
  })

  it('debe filtrar por tipo de notificación', async () => {
    // Arrange
    const mockNotifications = [
      {
        id: '1',
        user_id: 'user-123',
        type: 'order',
        title: 'Pedido confirmado',
        message: 'Tu pedido ha sido confirmado',
        read: false,
        timestamp: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }
    ]

    ;(mockRepository.findByUserId as jest.Mock).mockResolvedValue(mockNotifications)
    ;(mockRepository.countUnread as jest.Mock).mockResolvedValue(1)

    // Act
    const result = await useCase.execute({ 
      user_id: 'user-123',
      type: 'order'
    })

    // Assert
    expect(result.notifications).toHaveLength(1)
    expect(mockRepository.findByUserId).toHaveBeenCalledWith({ 
      user_id: 'user-123',
      type: 'order'
    })
  })

  it('debe filtrar por estado de lectura', async () => {
    // Arrange
    ;(mockRepository.findByUserId as jest.Mock).mockResolvedValue([])
    ;(mockRepository.countUnread as jest.Mock).mockResolvedValue(0)

    // Act
    await useCase.execute({ 
      user_id: 'user-123',
      read: false
    })

    // Assert
    expect(mockRepository.findByUserId).toHaveBeenCalledWith({ 
      user_id: 'user-123',
      read: false
    })
  })

  it('debe aplicar paginación', async () => {
    // Arrange
    ;(mockRepository.findByUserId as jest.Mock).mockResolvedValue([])
    ;(mockRepository.countUnread as jest.Mock).mockResolvedValue(0)

    // Act
    await useCase.execute({ 
      user_id: 'user-123',
      limit: 10,
      offset: 20
    })

    // Assert
    expect(mockRepository.findByUserId).toHaveBeenCalledWith({ 
      user_id: 'user-123',
      limit: 10,
      offset: 20
    })
  })

  it('debe retornar lista vacía si no hay notificaciones', async () => {
    // Arrange
    ;(mockRepository.findByUserId as jest.Mock).mockResolvedValue([])
    ;(mockRepository.countUnread as jest.Mock).mockResolvedValue(0)

    // Act
    const result = await useCase.execute({ user_id: 'user-123' })

    // Assert
    expect(result.notifications).toHaveLength(0)
    expect(result.unreadCount).toBe(0)
  })
})
