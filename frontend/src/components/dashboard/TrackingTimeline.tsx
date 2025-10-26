'use client'

import React from 'react'

interface TrackingEvent {
  id: string
  order_id: number
  status: string
  description: string
  location?: string
  timestamp: string
  is_delivered: boolean
}

interface TrackingTimelineProps {
  events: TrackingEvent[]
}

export function TrackingTimeline({ events }: TrackingTimelineProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEventIcon = (status: string, isDelivered: boolean) => {
    if (isDelivered) return '✅'
    
    switch (status.toLowerCase()) {
      case 'shipped':
      case 'in_transit':
        return '🚚'
      case 'out_for_delivery':
        return '🚛'
      case 'processing':
        return '📦'
      case 'confirmed':
        return '✓'
      default:
        return '📍'
    }
  }

  const getEventColor = (status: string, isDelivered: boolean) => {
    if (isDelivered) return 'text-green-600 border-green-200 bg-green-50'
    
    switch (status.toLowerCase()) {
      case 'shipped':
      case 'in_transit':
        return 'text-blue-600 border-blue-200 bg-blue-50'
      case 'out_for_delivery':
        return 'text-indigo-600 border-indigo-200 bg-indigo-50'
      case 'processing':
        return 'text-yellow-600 border-yellow-200 bg-yellow-50'
      case 'confirmed':
        return 'text-purple-600 border-purple-200 bg-purple-50'
      default:
        return 'text-gray-600 border-gray-200 bg-gray-50'
    }
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-4">📍</div>
        <p>No hay información de seguimiento disponible</p>
        <p className="text-sm mt-2">
          La información de seguimiento se actualizará automáticamente
        </p>
      </div>
    )
  }

  // Sort events by timestamp (most recent first)
  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900 mb-4">Historial de Seguimiento</h4>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        {sortedEvents.map((event) => (
          <div key={event.id} className="relative flex items-start space-x-4 pb-6">
            {/* Timeline dot */}
            <div className={`
              relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2
              ${getEventColor(event.status, event.is_delivered)}
            `}>
              <span className="text-lg">
                {getEventIcon(event.status, event.is_delivered)}
              </span>
            </div>
            
            {/* Event content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-medium text-gray-900">
                  {event.description}
                </h5>
                <time className="text-xs text-gray-500">
                  {formatDate(event.timestamp)}
                </time>
              </div>
              
              {event.location && (
                <p className="text-sm text-gray-600 mt-1">
                  📍 {event.location}
                </p>
              )}
              
              {event.is_delivered && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">
                    🎉 ¡Tu pedido ha sido entregado con éxito!
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Esperamos que disfrutes de tu compra. No olvides dejar una reseña.
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Estimated delivery info */}
      {!sortedEvents.some(e => e.is_delivered) && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-blue-600 text-lg mr-3">ℹ️</span>
            <div>
              <p className="text-sm font-medium text-blue-900">
                Información de Entrega
              </p>
              <p className="text-xs text-blue-700 mt-1">
                El seguimiento se actualiza automáticamente cada 6 horas. 
                Si tienes alguna pregunta, contacta con nuestro soporte.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}