'use client'

import React, { useState } from 'react'
import { Order, OrderStatus } from '@/types'

interface OrderCardProps {
  order: Order
}

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800'
}

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  processing: 'Procesando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado'
}

export function OrderCard({ order }: OrderCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* Order Header */}
      <div className="p-4 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-gray-900">
                Pedido #{order.order_number}
              </h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.status]}`}>
                {statusLabels[order.status]}
              </span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Realizado el {formatDate(order.created_at)}</p>
              <p className="font-medium text-gray-900">
                Total: {formatPrice(order.total_amount)}
              </p>
              {order.tracking_number && (
                <p>
                  <span className="font-medium">Seguimiento:</span> {order.tracking_number}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            {order.tracking_number && (
              <a
                href={`/dashboard?tab=tracking&order=${order.id}`}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Seguir Envío
              </a>
            )}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-gray-600 hover:text-gray-700 text-sm font-medium"
            >
              {showDetails ? 'Ocultar' : 'Ver'} Detalles
            </button>
          </div>
        </div>
      </div>

      {/* Order Details */}
      {showDetails && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Items */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Productos</h4>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {item.product_name}
                      </p>
                      <p className="text-xs text-gray-600">
                        SKU: {item.product_sku} | Cantidad: {item.quantity}
                      </p>
                      {item.provider_name && (
                        <p className="text-xs text-gray-500">
                          Proveedor: {item.provider_name}
                        </p>
                      )}
                    </div>
                    <div className="text-sm font-medium text-gray-900 ml-4">
                      {formatPrice(item.total_price)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping & Payment Info */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Información de Envío</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Dirección:</span><br />
                  {order.shipping_address.street}<br />
                  {order.shipping_address.city}, {order.shipping_address.state}<br />
                  {order.shipping_address.postal_code}, {order.shipping_address.country}
                </p>
                <p className="pt-2">
                  <span className="font-medium">Método de pago:</span> {order.payment_method}
                </p>
                <p>
                  <span className="font-medium">Estado del pago:</span> 
                  <span className={`ml-1 ${
                    order.payment_status === 'completed' ? 'text-green-600' : 
                    order.payment_status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {order.payment_status === 'completed' ? 'Completado' :
                     order.payment_status === 'failed' ? 'Fallido' :
                     order.payment_status === 'pending' ? 'Pendiente' : 'Reembolsado'}
                  </span>
                </p>
                {order.estimated_delivery && (
                  <p className="pt-2">
                    <span className="font-medium">Entrega estimada:</span> {formatDate(order.estimated_delivery)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
            {order.status === 'delivered' && (
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Dejar Reseña
              </button>
            )}
            {['pending', 'confirmed'].includes(order.status) && (
              <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                Cancelar Pedido
              </button>
            )}
            <button className="text-gray-600 hover:text-gray-700 text-sm font-medium">
              Contactar Soporte
            </button>
            <button className="text-gray-600 hover:text-gray-700 text-sm font-medium">
              Descargar Factura
            </button>
          </div>
        </div>
      )}
    </div>
  )
}