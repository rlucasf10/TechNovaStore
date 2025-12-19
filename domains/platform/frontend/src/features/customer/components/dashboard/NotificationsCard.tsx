/**
 * Tarjeta de Notificaciones
 * 
 * Muestra las últimas 5 notificaciones con link para ver todas
 * Requisitos: 11.3
 */

'use client'

import { Bell, Package, Truck, CreditCard, AlertCircle, Info, ChevronRight, Clock } from 'lucide-react'

interface Notification {
  id: string
  type: 'order' | 'shipping' | 'payment' | 'system' | 'promotion'
  title: string
  message: string
  read: boolean
  created_at: string
}

interface NotificationsCardProps {
  notifications: Notification[]
  onViewAll: () => void
  onMarkAsRead: (notificationId: string) => void
  onMarkAllAsRead: () => void
}

export function NotificationsCard({ notifications, onViewAll, onMarkAsRead, onMarkAllAsRead }: NotificationsCardProps) {
  // Obtener las últimas 5 notificaciones
  const recentNotifications = notifications.slice(0, 5)

  // Función para obtener el icono según el tipo
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="w-5 h-5 text-blue-600" />
      case 'shipping':
        return <Truck className="w-5 h-5 text-green-600" />
      case 'payment':
        return <CreditCard className="w-5 h-5 text-purple-600" />
      case 'system':
        return <AlertCircle className="w-5 h-5 text-orange-600" />
      case 'promotion':
        return <Info className="w-5 h-5 text-pink-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  // Función para obtener el color de fondo según el tipo
  const getNotificationBgColor = (type: string, read: boolean) => {
    if (read) return 'bg-gray-50 border-gray-200'
    
    switch (type) {
      case 'order':
        return 'bg-blue-50 border-blue-200'
      case 'shipping':
        return 'bg-green-50 border-green-200'
      case 'payment':
        return 'bg-purple-50 border-purple-200'
      case 'system':
        return 'bg-orange-50 border-orange-200'
      case 'promotion':
        return 'bg-pink-50 border-pink-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  // Función para formatear tiempo relativo
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Hace un momento'
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`
    if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)} días`
    
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notificaciones</h3>
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 font-medium">
              {notifications.filter(n => !n.read).length} nuevas
            </span>
          )}
        </div>
        <button
          onClick={onViewAll}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
        >
          Ver todas
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Lista de notificaciones */}
      {recentNotifications.length > 0 ? (
        <div className="space-y-2">
          {recentNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${
                getNotificationBgColor(notification.type, notification.read)
              } ${!notification.read ? 'font-medium' : ''}`}
              onClick={() => {
                if (onMarkAsRead && !notification.read) {
                  onMarkAsRead(notification.id)
                }
              }}
            >
              {/* Icono */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                notification.read ? 'bg-white' : 'bg-white/80'
              }`}>
                {getNotificationIcon(notification.type)}
              </div>

              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className={`text-sm ${notification.read ? 'text-gray-900 dark:text-gray-100' : 'text-gray-900 dark:text-gray-100 font-semibold'}`}>
                    {notification.title}
                  </p>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">
                  {notification.message}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>{getRelativeTime(notification.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <Bell className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-2">No tienes notificaciones</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Te avisaremos cuando haya novedades
          </p>
        </div>
      )}

      {/* Footer con acciones */}
      {recentNotifications.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <button
            onClick={onViewAll}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium transition-colors"
          >
            Ver historial completo
          </button>
          {notifications.filter(n => !n.read).length > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
            >
              Marcar todas como leídas
            </button>
          )}
        </div>
      )}
    </div>
  )
}
