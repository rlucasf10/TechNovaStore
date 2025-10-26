import { useState, useEffect } from 'react'
import api from '@/lib/api'

interface Notification {
  id: string
  type: 'order' | 'shipping' | 'payment' | 'system' | 'promotion'
  title: string
  message: string
  timestamp: string
  read: boolean
  action_url?: string
  order_id?: number
}

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.get('/notifications')
      setNotifications(response.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar las notificaciones')
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Set up real-time notifications with WebSocket or Server-Sent Events
    const setupRealTimeNotifications = () => {
      const eventSource = new EventSource('/api/notifications/stream')
      
      eventSource.onmessage = (event) => {
        const newNotification = JSON.parse(event.data)
        setNotifications(prev => [newNotification, ...prev])
      }

      eventSource.onerror = (error) => {
        console.error('Notification stream error:', error)
        eventSource.close()
        
        // Retry connection after 5 seconds
        setTimeout(setupRealTimeNotifications, 5000)
      }

      return eventSource
    }

    const eventSource = setupRealTimeNotifications()

    return () => {
      eventSource.close()
    }
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch: fetchNotifications
  }
}