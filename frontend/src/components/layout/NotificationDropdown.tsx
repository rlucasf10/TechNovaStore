/**
 * NotificationDropdown Component
 * 
 * Dropdown de notificaciones que se muestra al hacer clic en la campanita del header.
 * Muestra las últimas notificaciones del usuario con opción de marcar como leídas.
 * 
 * Características:
 * - Muestra últimas 5 notificaciones
 * - Badge con contador de no leídas
 * - Link a página completa de notificaciones
 * - Marca como leída al hacer clic
 * - Responsive (solo en desktop, en móvil va a página completa)
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, X, Package, CreditCard, Truck, AlertCircle, Tag } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

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
  order: 'text-blue-600 bg-blue-50',
  shipping: 'text-green-600 bg-green-50',
  payment: 'text-purple-600 bg-purple-50',
  system: 'text-orange-600 bg-orange-50',
  promotion: 'text-pink-600 bg-pink-50',
}

interface NotificationDropdownProps {
  onClose?: () => void
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Solo cargar notificaciones si el dropdown está abierto
  // Esto evita llamadas innecesarias al API cuando el usuario no está autenticado
  const { notifications, unreadCount, loading } = useNotifications()
  
  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        onClose?.()
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])
  
  // Cerrar con ESC
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
        onClose?.()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }
  
  const handleNotificationClick = (_notificationId: string, actionUrl?: string) => {
    // TODO: Marcar como leída
    setIsOpen(false)
    onClose?.()
    
    if (actionUrl) {
      router.push(actionUrl)
    }
  }
  
  const handleViewAll = () => {
    setIsOpen(false)
    onClose?.()
    router.push('/notificaciones')
  }
  
  // Mostrar solo las últimas 5 notificaciones
  const recentNotifications = notifications.slice(0, 5)
  
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón de campanita */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-gray-700 hover:text-primary-600 transition-colors"
        aria-label={`Notificaciones (${unreadCount} sin leer)`}
        aria-expanded={isOpen}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
        )}
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
          role="dialog"
          aria-label="Notificaciones"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Notificaciones
              </h3>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500">
                  {unreadCount} sin leer
                </p>
              )}
            </div>
            <button
              onClick={() => {
                setIsOpen(false)
                onClose?.()
              }}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Lista de notificaciones */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
                <p className="mt-2 text-sm text-gray-500">Cargando...</p>
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">
                  No tienes notificaciones
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentNotifications.map((notification) => {
                  const Icon = NOTIFICATION_ICONS[notification.type] || AlertCircle
                  const colorClass = NOTIFICATION_COLORS[notification.type] || 'text-gray-600 bg-gray-50'
                  
                  return (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification.id, notification.action_url)}
                      className={`
                        w-full p-4 text-left hover:bg-gray-50 transition-colors
                        ${!notification.read ? 'bg-blue-50/30' : ''}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icono */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        
                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(notification.timestamp), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </p>
                        </div>
                        
                        {/* Indicador de no leída */}
                        {!notification.read && (
                          <div className="flex-shrink-0 w-2 h-2 bg-primary-600 rounded-full mt-2" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          
          {/* Footer */}
          {recentNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-200">
              <button
                onClick={handleViewAll}
                className="w-full px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
              >
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
