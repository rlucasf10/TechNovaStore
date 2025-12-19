import { useState, useEffect } from 'react'
import { useUser } from './useUser'
import { 
  getUserNotifications, 
  markNotificationAsRead as markAsReadService,
  markAllNotificationsAsRead as markAllAsReadService,
  deleteNotification as deleteNotificationService,
  UserNotification
} from '../services/notification.service'

interface UseNotificationsReturn {
  notifications: UserNotification[]
  unreadCount: number
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
}

export function useNotifications(): UseNotificationsReturn {
  const { user } = useUser()
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = async () => {
    if (!user?.id) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await getUserNotifications({
        userId: String(user.id),
        limit: 50
      })
      
      setNotifications(response.notifications)
      setUnreadCount(response.unreadCount)
    } catch (err: unknown) {
      // Silenciar error 404 (servicio no implementado aún)
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 404) {
        setNotifications([])
        setUnreadCount(0)
        setError(null) // No mostrar error si el servicio no existe
      } else {
        const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al cargar las notificaciones'
        setError(errorMessage)
        setNotifications([])
        setUnreadCount(0)
      }
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    if (!user?.id) return

    try {
      await markAsReadService(notificationId, String(user.id))
      
      // Actualizar estado local
      setNotifications(prev => 
        prev.map(n => String(n.id) === String(notificationId) ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    if (!user?.id) return

    try {
      await markAllAsReadService(String(user.id))
      
      // Actualizar estado local
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      )
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    if (!user?.id) return

    try {
      await deleteNotificationService(notificationId, String(user.id))
      
      // Actualizar estado local
      setNotifications(prev => prev.filter(n => String(n.id) !== String(notificationId)))
      
      // Actualizar contador si era no leída
      const notification = notifications.find(n => String(n.id) === String(notificationId))
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }

  useEffect(() => {
    fetchNotifications()

    // TODO: Set up real-time notifications with WebSocket or Server-Sent Events
    // const setupRealTimeNotifications = () => {
    //   const eventSource = new EventSource('/api/notifications/stream')
    //   
    //   eventSource.onmessage = (event) => {
    //     const newNotification = JSON.parse(event.data)
    //     setNotifications(prev => [newNotification, ...prev])
    //   }
    //
    //   eventSource.onerror = (error) => {
    //     console.error('Notification stream error:', error)
    //     eventSource.close()
    //     
    //     // Retry connection after 5 seconds
    //     setTimeout(setupRealTimeNotifications, 5000)
    //   }
    //
    //   return eventSource
    // }
    //
    // const eventSource = setupRealTimeNotifications()
    //
    // return () => {
    //   eventSource.close()
    // }
  }, [user?.id])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  }
}