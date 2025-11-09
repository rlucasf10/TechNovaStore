/**
 * Página de Notificaciones
 * 
 * Ruta: /notificaciones
 * 
 * Muestra el historial completo de notificaciones del usuario.
 * Permite filtrar por tipo, marcar como leídas y eliminar notificaciones.
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Bell, 
  Package, 
  CreditCard, 
  Truck, 
  AlertCircle, 
  Tag,
  Check,
  Trash2,
  Filter,
  ArrowLeft
} from 'lucide-react'
import { useNotifications } from '@/customer'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/ui'

// Iconos por tipo de notificación
const NOTIFICATION_ICONS = {
  order: Package,
  shipping: Truck,
  payment: CreditCard,
  system: AlertCircle,
  promotion: Tag,
}

// Colores por tipo de notificación
const NOTIFICATION_COLORS = {
  order: 'text-blue-600 bg-blue-50 border-blue-200',
  shipping: 'text-green-600 bg-green-50 border-green-200',
  payment: 'text-purple-600 bg-purple-50 border-purple-200',
  system: 'text-orange-600 bg-orange-50 border-orange-200',
  promotion: 'text-pink-600 bg-pink-50 border-pink-200',
}

// Labels por tipo
const NOTIFICATION_LABELS = {
  order: 'Pedido',
  shipping: 'Envío',
  payment: 'Pago',
  system: 'Sistema',
  promotion: 'Promoción',
}

type NotificationFilter = 'all' | 'unread' | 'order' | 'shipping' | 'payment' | 'system' | 'promotion'

export default function NotificationsPage() {
  const router = useRouter()
  const { notifications, unreadCount, loading } = useNotifications()
  const [filter, setFilter] = useState<NotificationFilter>('all')
  const [showFilters, setShowFilters] = useState(false)
  
  // Filtrar notificaciones
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true
    if (filter === 'unread') return !notification.read
    return notification.type === filter
  })
  
  const handleNotificationClick = (_notificationId: string, actionUrl?: string) => {
    // TODO: Marcar como leída
    if (actionUrl) {
      router.push(actionUrl)
    }
  }
  
  const handleMarkAsRead = (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    // TODO: Implementar marcar como leída
    console.log('Marcar como leída:', notificationId)
  }
  
  const handleDelete = (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    // TODO: Implementar eliminar notificación
    console.log('Eliminar:', notificationId)
  }
  
  const handleMarkAllAsRead = () => {
    // TODO: Implementar marcar todas como leídas
    console.log('Marcar todas como leídas')
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
                aria-label="Volver"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Notificaciones
                </h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    {unreadCount} sin leer
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Botón de filtros (móvil) */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Filtros"
              >
                <Filter className="w-5 h-5" />
              </button>
              
              {/* Marcar todas como leídas */}
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="hidden sm:flex"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Marcar todas como leídas
                </Button>
              )}
            </div>
          </div>
          
          {/* Filtros (desktop) */}
          <div className="hidden lg:flex items-center gap-2 mt-4">
            <button
              onClick={() => setFilter('all')}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg transition-colors
                ${filter === 'all' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }
              `}
            >
              Todas ({notifications.length})
            </button>
            
            <button
              onClick={() => setFilter('unread')}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg transition-colors
                ${filter === 'unread' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }
              `}
            >
              Sin leer ({unreadCount})
            </button>
            
            {Object.entries(NOTIFICATION_LABELS).map(([type, label]) => {
              const count = notifications.filter(n => n.type === type).length
              if (count === 0) return null
              
              return (
                <button
                  key={type}
                  onClick={() => setFilter(type as NotificationFilter)}
                  className={`
                    px-4 py-2 text-sm font-medium rounded-lg transition-colors
                    ${filter === type 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }
                  `}
                >
                  {label} ({count})
                </button>
              )
            })}
          </div>
          
          {/* Filtros (móvil) */}
          {showFilters && (
            <div className="lg:hidden mt-4 space-y-2">
              <button
                onClick={() => {
                  setFilter('all')
                  setShowFilters(false)
                }}
                className={`
                  w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors text-left
                  ${filter === 'all' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }
                `}
              >
                Todas ({notifications.length})
              </button>
              
              <button
                onClick={() => {
                  setFilter('unread')
                  setShowFilters(false)
                }}
                className={`
                  w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors text-left
                  ${filter === 'unread' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }
                `}
              >
                Sin leer ({unreadCount})
              </button>
              
              {Object.entries(NOTIFICATION_LABELS).map(([type, label]) => {
                const count = notifications.filter(n => n.type === type).length
                if (count === 0) return null
                
                return (
                  <button
                    key={type}
                    onClick={() => {
                      setFilter(type as NotificationFilter)
                      setShowFilters(false)
                    }}
                    className={`
                      w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors text-left
                      ${filter === type 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }
                    `}
                  >
                    {label} ({count})
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Contenido */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-sm text-gray-500">Cargando notificaciones...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'No tienes notificaciones' : 'No hay notificaciones en esta categoría'}
            </h3>
            <p className="text-sm text-gray-500 text-center max-w-md">
              {filter === 'all' 
                ? 'Cuando recibas notificaciones sobre tus pedidos, envíos y promociones, aparecerán aquí.'
                : 'Intenta cambiar el filtro para ver otras notificaciones.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const Icon = NOTIFICATION_ICONS[notification.type] || AlertCircle
              const colorClass = NOTIFICATION_COLORS[notification.type] || 'text-gray-600 bg-gray-50 border-gray-200'
              
              return (
                <div
                  key={notification.id}
                  className={`
                    bg-white rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer
                    ${!notification.read ? 'border-l-4 border-l-primary-600' : 'border-gray-200'}
                  `}
                  onClick={() => handleNotificationClick(notification.id, notification.action_url)}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Icono */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border ${colorClass}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      
                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-base font-semibold text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <p className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(notification.timestamp), {
                                  addSuffix: true,
                                  locale: es,
                                })}
                              </p>
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${colorClass}`}>
                                {NOTIFICATION_LABELS[notification.type]}
                              </span>
                            </div>
                          </div>
                          
                          {/* Indicador de no leída */}
                          {!notification.read && (
                            <div className="flex-shrink-0 w-2 h-2 bg-primary-600 rounded-full mt-1" />
                          )}
                        </div>
                      </div>
                      
                      {/* Acciones */}
                      <div className="flex-shrink-0 flex items-center gap-1">
                        {!notification.read && (
                          <button
                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            aria-label="Marcar como leída"
                            title="Marcar como leída"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        )}
                        
                        <button
                          onClick={(e) => handleDelete(notification.id, e)}
                          className="p-2 text-gray-400 hover:text-error hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Eliminar"
                          title="Eliminar"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
