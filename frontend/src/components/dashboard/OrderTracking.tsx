'use client'

import React, { useState, useEffect } from 'react'
import { Order } from '@/types'
import { TrackingTimeline } from './TrackingTimeline'
import { useTrackingUpdates } from '@/hooks/useTrackingUpdates'

interface OrderTrackingProps {
  orders: Order[]
  loading: boolean
}

interface TrackingEvent {
  id: string
  order_id: number
  status: string
  description: string
  location?: string
  timestamp: string
  is_delivered: boolean
}

export function OrderTracking({ orders, loading }: OrderTrackingProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([])
  const [loadingTracking, setLoadingTracking] = useState(false)

  // Real-time tracking updates
  useTrackingUpdates((update: TrackingEvent) => {
    if (selectedOrder && update.order_id === selectedOrder.id) {
      setTrackingEvents(prev => [...prev, update])
    }
  })

  const fetchTrackingInfo = async (order: Order) => {
    if (!order.tracking_number) return

    setLoadingTracking(true)
    try {
      const response = await fetch(`/api/orders/${order.id}/tracking`)
      const data = await response.json()
      setTrackingEvents(data.events || [])
    } catch (error) {
      console.error('Error fetching tracking info:', error)
      setTrackingEvents([])
    } finally {
      setLoadingTracking(false)
    }
  }

  useEffect(() => {
    if (selectedOrder) {
      fetchTrackingInfo(selectedOrder)
    }
  }, [selectedOrder])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEstimatedDelivery = (order: Order) => {
    if (order.estimated_delivery) {
      const deliveryDate = new Date(order.estimated_delivery)
      const today = new Date()
      const diffTime = deliveryDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays < 0) {
        return 'Entrega retrasada'
      } else if (diffDays === 0) {
        return 'Entrega hoy'
      } else if (diffDays === 1) {
        return 'Entrega mañana'
      } else {
        return `Entrega en ${diffDays} días`
      }
    }
    return 'Fecha estimada no disponible'
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="p-6 text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🚚</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay envíos para seguir
        </h3>
        <p className="text-gray-600">
          Los pedidos con número de seguimiento aparecerán aquí
        </p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Seguimiento de Envíos</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Pedidos en Tránsito</h3>
          {orders.map((order) => (
            <div
              key={order.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedOrder?.id === order.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedOrder(order)}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">
                    Pedido #{order.order_number}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {order.tracking_number}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  order.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.status === 'shipped' ? 'En Tránsito' :
                   order.status === 'delivered' ? 'Entregado' : 'Procesando'}
                </span>
              </div>
              
              <div className="text-sm text-gray-600">
                <p className="mb-1">{getEstimatedDelivery(order)}</p>
                <p>
                  {order.items.length} producto{order.items.length !== 1 ? 's' : ''}
                </p>
              </div>

              {order.status === 'delivered' && (
                <div className="mt-2 text-sm text-green-600 font-medium">
                  ✓ Entregado el {formatDate(order.updated_at)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Tracking Details */}
        <div>
          {selectedOrder ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detalles del Envío
                </h3>
                <button
                  onClick={() => fetchTrackingInfo(selectedOrder)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  disabled={loadingTracking}
                >
                  {loadingTracking ? 'Actualizando...' : 'Actualizar'}
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Número de seguimiento:</span>
                    <p className="text-gray-900 font-mono">{selectedOrder.tracking_number}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Estado actual:</span>
                    <p className="text-gray-900">
                      {selectedOrder.status === 'shipped' ? 'En Tránsito' :
                       selectedOrder.status === 'delivered' ? 'Entregado' : 'Procesando'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Entrega estimada:</span>
                    <p className="text-gray-900">
                      {selectedOrder.estimated_delivery 
                        ? formatDate(selectedOrder.estimated_delivery)
                        : 'No disponible'
                      }
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Dirección de entrega:</span>
                    <p className="text-gray-900">
                      {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}
                    </p>
                  </div>
                </div>
              </div>

              {loadingTracking ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <TrackingTimeline events={trackingEvents} />
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-4">📦</div>
                <p>Selecciona un pedido para ver los detalles del seguimiento</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}