/**
 * Página de Notificaciones
 * 
 * Vista completa del historial de notificaciones con filtros
 * Requisitos: 11.3
 */

'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Bell, 
  Package, 
  Truck, 
  CreditCard, 
  AlertCircle, 
  Tag,
  Filter,
  Check,
  Trash2,
  ChevronDown,
  X
} from 'lucide-react'
import { useNotifications } from '@/customer'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

// Tipos de notificación
type NotificationType = 'all' | 'order' | 'shipping' | 'payment' | 'system' | 'promotion'
type NotificationFilter = 'all' | 'unread' | NotificationType

// Iconos por tipo
const NOTIFICATION_ICONS = {
  order: Package,
  shipping: Truck,
  payment: CreditCard,
  system: AlertCircle,
  promotion: Tag,
}

// Colores por tipo
const NOTIFICATION_COLORS = {
  order: 'text-blue-600 bg-blue-50 border-blue-200',
  shipping: 'text-green-600 bg-green-50 border-green-200',
  payment: 'text-purple-600 bg-purple-50 border-purple-200',
  system: 'text-orange-600 bg-orange-50 border-orange-200',
  promotion: 'text-pink-600 bg-pink-50 border-pink-200',
}

// Traducciones de tipos
const TYPE_LABELS: Record<NotificationType, string> = {
  all: 'Todas',
  order: 'Pedidos',
  shipping: 'Envíos',
  payment: 'Pagos',
  system: 'Sistema',
  promotion: 'Promociones',
}

export default function NotificationsPage() {
  const router = useRouter()
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications()
  
  const [filter, setFilter] = useState<NotificationFilter>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set())

  // Filtrar notificaciones
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications]

    // Filtro por estado de lectura
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.read)
    }
    // Filtro por tipo
    else if (filter !== 'all') {
      filtered = filtered.filter(n => n.type === filter)
    }

    return filtered
  }, [notifications, filter])

  // Handlers
  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId)
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const handleDelete = async (notificationId: string) => {
    await deleteNotification(notificationId)
  }

  const handleDeleteSelected = async () => {
    for (const notificationId of Array.from(selectedNotifications)) {
      await deleteNotification(notificationId)
    }
    setSelectedNotifications(new Set())
  }

  const toggleSelectNotification = (notificationId: string) => {
    const newSelected = new Set(selectedNotifications)
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId)
    } else {
      newSelected.add(notificationId)
    }
    setSelectedNotifications(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set())
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1"
          >
            ← Volver
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Bell className="w-8 h-8 text-blue-600" />
                Notificaciones
              </h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {unreadCount} sin leer
                </p>
              )}
            </div>

            {/* Botón marcar todas como leídas */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
                Marcar todas como leídas
              </button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Filtros:</span>
            </div>

            {/* Filtros en desktop */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  filter === 'unread'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Sin leer
              </button>
              <div className="w-px h-6 bg-gray-300 mx-1" />
              {(['order', 'shipping', 'payment', 'system', 'promotion'] as NotificationType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    filter === type
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {TYPE_LABELS[type]}
                </button>
              ))}
            </div>

            {/* Dropdown de filtros en móvil */}
            <div className="md:hidden relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {TYPE_LABELS[filter as NotificationType] || 'Filtrar'}
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {showFilters && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowFilters(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
                    <div className="p-2">
                      {(['all', 'unread', 'order', 'shipping', 'payment', 'system', 'promotion'] as NotificationFilter[]).map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            setFilter(type)
                            setShowFilters(false)
                          }}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                            filter === type
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {TYPE_LABELS[type as NotificationType] || (type === 'unread' ? 'Sin leer' : type)}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Acciones de selección */}
          {selectedNotifications.size > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedNotifications.size} seleccionada{selectedNotifications.size !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
                <button
                  onClick={() => setSelectedNotifications(new Set())}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Lista de notificaciones */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-600">Cargando notificaciones...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay notificaciones
              </h3>
              <p className="text-gray-600">
                {filter === 'unread' 
                  ? 'No tienes notificaciones sin leer'
                  : filter !== 'all'
                    ? `No tienes notificaciones de tipo "${TYPE_LABELS[filter as NotificationType]}"`
                    : 'Aún no tienes notificaciones'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Checkbox para seleccionar todas */}
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedNotifications.size === filteredNotifications.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  Seleccionar todas
                </span>
              </div>

              {/* Notificaciones */}
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => {
                  const Icon = NOTIFICATION_ICONS[notification.type] || AlertCircle
                  const colorClass = NOTIFICATION_COLORS[notification.type] || 'text-gray-600 bg-gray-50 border-gray-200'
                  const isSelected = selectedNotifications.has(notification.id)

                  return (
                    <div
                      key={notification.id}
                      className={`p-6 transition-colors ${
                        !notification.read ? 'bg-blue-50/30' : ''
                      } ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectNotification(notification.id)}
                          className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />

                        {/* Icono */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center border ${colorClass}`}>
                          <Icon className="w-6 h-6" />
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <h3 className="text-base font-semibold text-gray-900">
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2" />
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>
                              {formatDistanceToNow(new Date(notification.timestamp), {
                                addSuffix: true,
                                locale: es,
                              })}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="capitalize">{TYPE_LABELS[notification.type]}</span>
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex-shrink-0 flex items-center gap-2">
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Marcar como leída"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Mensaje informativo */}
        {filteredNotifications.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-900 text-center">
              💡 <span className="font-medium">Tip:</span> Las notificaciones se eliminan automáticamente después de 30 días
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
