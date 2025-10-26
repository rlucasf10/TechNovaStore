'use client'

import React, { useState } from 'react'

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

interface NotificationCenterProps {
  notifications: Notification[]
}

const notificationIcons = {
  order: '📦',
  shipping: '🚚',
  payment: '💳',
  system: '⚙️',
  promotion: '🎉'
}

const notificationColors = {
  order: 'border-blue-200 bg-blue-50',
  shipping: 'border-indigo-200 bg-indigo-50',
  payment: 'border-green-200 bg-green-50',
  system: 'border-gray-200 bg-gray-50',
  promotion: 'border-purple-200 bg-purple-50'
}

export function NotificationCenter({ notifications }: NotificationCenterProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const filteredNotifications = notifications
    .filter(notification => {
      if (filter === 'unread' && notification.read) return false
      if (typeFilter !== 'all' && notification.type !== typeFilter) return false
      return true
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const unreadCount = notifications.filter(n => !n.read).length

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffTime / (1000 * 60))

    if (diffMinutes < 1) return 'Ahora mismo'
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays < 7) return `Hace ${diffDays} días`
    
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric'
    })
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      })
      // Update local state or refetch notifications
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      })
      // Update local state or refetch notifications
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Centro de Notificaciones</h2>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} notificación${unreadCount !== 1 ? 'es' : ''} sin leer` : 'Todas las notificaciones leídas'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="mt-4 sm:mt-0 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas</option>
            <option value="unread">Sin leer ({unreadCount})</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los tipos</option>
            <option value="order">Pedidos</option>
            <option value="shipping">Envíos</option>
            <option value="payment">Pagos</option>
            <option value="system">Sistema</option>
            <option value="promotion">Promociones</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔔</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'unread' ? 'No hay notificaciones sin leer' : 'No hay notificaciones'}
          </h3>
          <p className="text-gray-600">
            {filter === 'unread' 
              ? 'Todas tus notificaciones están al día'
              : 'Las notificaciones aparecerán aquí cuando tengas actividad en tu cuenta'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`
                p-4 rounded-lg border transition-all cursor-pointer
                ${notification.read 
                  ? 'border-gray-200 bg-white hover:bg-gray-50' 
                  : `${notificationColors[notification.type]} border-l-4`
                }
              `}
              onClick={() => {
                if (!notification.read) {
                  markAsRead(notification.id)
                }
                if (notification.action_url) {
                  window.location.href = notification.action_url
                }
              }}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <span className="text-2xl">
                    {notificationIcons[notification.type]}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-medium ${
                      notification.read ? 'text-gray-900' : 'text-gray-900 font-semibold'
                    }`}>
                      {notification.title}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <time className="text-xs text-gray-500">
                        {formatDate(notification.timestamp)}
                      </time>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  
                  <p className={`text-sm mt-1 ${
                    notification.read ? 'text-gray-600' : 'text-gray-700'
                  }`}>
                    {notification.message}
                  </p>
                  
                  {notification.order_id && (
                    <div className="mt-2">
                      <a
                        href={`/dashboard?tab=orders&order=${notification.order_id}`}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Ver pedido #{notification.order_id}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Real-time indicator */}
      <div className="mt-6 text-center">
        <div className="inline-flex items-center text-xs text-gray-500">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
          Actualizaciones en tiempo real activadas
        </div>
      </div>
    </div>
  )
}