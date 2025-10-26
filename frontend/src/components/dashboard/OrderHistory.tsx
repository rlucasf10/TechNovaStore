'use client'

import React, { useState } from 'react'
import { Order, OrderStatus } from '@/types'
import { OrderCard } from './OrderCard'

interface OrderHistoryProps {
  orders: Order[]
  loading: boolean
  onRefresh: () => void
}

const statusFilters: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'processing', label: 'Procesando' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' }
]

export function OrderHistory({ orders, loading, onRefresh }: OrderHistoryProps) {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const filteredOrders = orders
    .filter(order => statusFilter === 'all' || order.status === statusFilter)
    .sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
      } else {
        return sortOrder === 'desc' 
          ? b.total_amount - a.total_amount 
          : a.total_amount - b.total_amount
      }
    })

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Historial de Pedidos</h2>
          <p className="text-gray-600 mt-1">
            {orders.length} pedido{orders.length !== 1 ? 's' : ''} en total
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Actualizar
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtrar por estado
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ordenar por
          </label>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">Fecha</option>
              <option value="amount">Importe</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {statusFilter === 'all' ? 'No tienes pedidos aún' : `No hay pedidos ${statusFilters.find(f => f.value === statusFilter)?.label.toLowerCase()}`}
          </h3>
          <p className="text-gray-600 mb-6">
            {statusFilter === 'all' 
              ? 'Cuando realices tu primera compra, aparecerá aquí'
              : 'Prueba con otro filtro para ver más pedidos'
            }
          </p>
          {statusFilter === 'all' && (
            <a
              href="/productos"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Explorar Productos
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}