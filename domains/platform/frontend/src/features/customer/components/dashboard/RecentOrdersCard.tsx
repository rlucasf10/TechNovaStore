/**
 * Tarjeta de Pedidos Recientes
 * 
 * Muestra los últimos 3 pedidos con su estado
 * Requisitos: 11.2
 */

'use client'

import { ShoppingBag, Package, Truck, CheckCircle, Clock, ChevronRight } from 'lucide-react'
import { Order } from '@/types'

interface RecentOrdersCardProps {
  orders: Order[]
  loading?: boolean
  onViewAll: () => void
}

export function RecentOrdersCard({ orders, loading, onViewAll }: RecentOrdersCardProps) {
  // Obtener los últimos 3 pedidos
  const recentOrders = orders.slice(0, 3)

  // Función para obtener el icono según el estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'shipped':
      case 'in_transit':
        return <Truck className="w-5 h-5 text-blue-600" />
      case 'processing':
        return <Package className="w-5 h-5 text-yellow-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  // Función para obtener el color del badge según el estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'shipped':
      case 'in_transit':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'processing':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  // Función para traducir el estado
  const translateStatus = (status: string) => {
    const translations: Record<string, string> = {
      'pending': 'Pendiente',
      'processing': 'Procesando',
      'shipped': 'Enviado',
      'in_transit': 'En tránsito',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado'
    }
    return translations[status] || status
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-40 bg-gray-200 dark:bg-slate-700 rounded animate-pulse"></div>
          <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-slate-700 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pedidos Recientes</h3>
        </div>
        <button
          onClick={onViewAll}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
        >
          Ver todos
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Lista de pedidos */}
      {recentOrders.length > 0 ? (
        <div className="space-y-3">
          {recentOrders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer group"
              onClick={onViewAll}
            >
              <div className="flex items-center gap-4 flex-1">
                {/* Icono de estado */}
                <div className="w-12 h-12 bg-white dark:bg-slate-600 rounded-lg flex items-center justify-center border border-gray-200 dark:border-slate-500 group-hover:border-blue-300 dark:group-hover:border-blue-500 transition-colors">
                  {getStatusIcon(order.status)}
                </div>

                {/* Información del pedido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Pedido #{order.order_number}
                    </p>
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full border font-medium ${getStatusColor(order.status)}`}>
                      {translateStatus(order.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(order.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                  {order.tracking_number && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Tracking: {order.tracking_number}
                    </p>
                  )}
                </div>
              </div>

              {/* Precio */}
              <div className="text-right ml-4">
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  ${typeof order.total_amount === 'number' 
                    ? order.total_amount.toFixed(2) 
                    : parseFloat(order.total_amount || '0').toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {order.items?.length || 0} {order.items?.length === 1 ? 'producto' : 'productos'}
                </p>
              </div>

              {/* Flecha */}
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ml-2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-2">No tienes pedidos aún</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Explora nuestro catálogo y realiza tu primera compra
          </p>
          <a
            href="/productos"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Explorar Productos
          </a>
        </div>
      )}
    </div>
  )
}
