/**
 * Tarjeta de Acciones Rápidas
 * 
 * Botones de acceso rápido a funciones comunes
 * Requisitos: 11.4
 */

'use client'

import React from 'react'
import { Truck, HelpCircle, Tag, Heart, MapPin, CreditCard, FileText, Settings } from 'lucide-react'

interface QuickAction {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  onClick: () => void
  color: string
  bgColor: string
  borderColor: string
}

interface QuickActionsCardProps {
  onTrackOrder: () => void
  onContactSupport: () => void
  onViewOffers: () => void
}

export function QuickActionsCard({ 
  onTrackOrder, 
  onContactSupport, 
  onViewOffers 
}: QuickActionsCardProps) {
  const quickActions: QuickAction[] = [
    {
      id: 'track',
      label: 'Rastrear Pedido',
      description: 'Ver estado de envío',
      icon: <Truck className="w-5 h-5" />,
      onClick: onTrackOrder,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'support',
      label: 'Contactar Soporte',
      description: 'Ayuda y asistencia',
      icon: <HelpCircle className="w-5 h-5" />,
      onClick: onContactSupport,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'offers',
      label: 'Ver Ofertas',
      description: 'Descuentos especiales',
      icon: <Tag className="w-5 h-5" />,
      onClick: onViewOffers,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 'wishlist',
      label: 'Lista de Deseos',
      description: 'Productos guardados',
      icon: <Heart className="w-5 h-5" />,
      onClick: () => window.location.href = '/dashboard/usuario?tab=wishlist',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200'
    },
    {
      id: 'addresses',
      label: 'Mis Direcciones',
      description: 'Gestionar envíos',
      icon: <MapPin className="w-5 h-5" />,
      onClick: () => window.location.href = '/dashboard/usuario?tab=addresses',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      id: 'payment',
      label: 'Métodos de Pago',
      description: 'Tarjetas guardadas',
      icon: <CreditCard className="w-5 h-5" />,
      onClick: () => window.location.href = '/dashboard/usuario?tab=payment',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    },
    {
      id: 'orders',
      label: 'Mis Pedidos',
      description: 'Historial completo',
      icon: <FileText className="w-5 h-5" />,
      onClick: () => window.location.href = '/dashboard/usuario?tab=orders',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200'
    },
    {
      id: 'settings',
      label: 'Configuración',
      description: 'Perfil y seguridad',
      icon: <Settings className="w-5 h-5" />,
      onClick: () => window.location.href = '/dashboard/usuario?tab=profile',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    }
  ]

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Acciones Rápidas</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Accede rápidamente a las funciones más usadas</p>
      </div>

      {/* Grid de acciones */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all hover:shadow-md hover:scale-105 active:scale-95 ${action.bgColor} ${action.borderColor} group`}
          >
            {/* Icono */}
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-white border ${action.borderColor} ${action.color} group-hover:scale-110 transition-transform`}>
              {action.icon}
            </div>

            {/* Texto */}
            <div className="text-center">
              <p className={`text-sm font-semibold ${action.color} mb-0.5`}>
                {action.label}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {action.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Mensaje de ayuda */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-800">
        <p className="text-sm text-blue-900 dark:text-blue-200 text-center">
          💡 <span className="font-medium">Consejo:</span> Usa el atajo <kbd className="px-2 py-0.5 bg-white dark:bg-slate-700 rounded border border-blue-200 dark:border-slate-600 text-xs font-mono">Ctrl+K</kbd> para búsqueda rápida
        </p>
      </div>
    </div>
  )
}
