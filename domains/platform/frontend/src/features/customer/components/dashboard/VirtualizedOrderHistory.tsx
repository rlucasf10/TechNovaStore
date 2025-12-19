'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { List } from 'react-window'
import { Order, OrderStatus } from '@/types'
import { OrderCard } from './OrderCard'
import { Search, Filter, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

interface VirtualizedOrderHistoryProps {
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

const ITEMS_PER_PAGE = 20 // Aumentado para aprovechar la virtualización

/**
 * VirtualizedOrderHistory Component
 * 
 * Lista virtualizada de pedidos usando react-window para optimizar el rendimiento
 * con listas largas de pedidos.
 * 
 * Características:
 * - Renderiza solo los pedidos visibles en el viewport
 * - Mejora significativa de rendimiento con +50 pedidos
 * - Filtrado y búsqueda en tiempo real
 * - Paginación optimizada
 * 
 * Requisitos: 3.2 (Optimización de rendimiento)
 */
export function VirtualizedOrderHistory({ orders, loading, onRefresh }: VirtualizedOrderHistoryProps) {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [listHeight, setListHeight] = useState(600)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calcular altura del contenedor
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const height = Math.max(600, window.innerHeight - 400)
        setListHeight(height)
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  // Filtrado y búsqueda
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Filtro por estado
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false
      }

      // Filtro por búsqueda (número de pedido o productos)
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesOrderNumber = order.order_number.toLowerCase().includes(query)
        const matchesProduct = order.items.some(item => 
          item.product_name.toLowerCase().includes(query) ||
          item.product_sku.toLowerCase().includes(query)
        )
        if (!matchesOrderNumber && !matchesProduct) {
          return false
        }
      }

      // Filtro por rango de fechas
      if (dateFrom) {
        const orderDate = new Date(order.created_at)
        const fromDate = new Date(dateFrom)
        if (orderDate < fromDate) {
          return false
        }
      }

      if (dateTo) {
        const orderDate = new Date(order.created_at)
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999) // Incluir todo el día
        if (orderDate > toDate) {
          return false
        }
      }

      return true
    }).sort((a, b) => {
      // Ordenar por fecha (más reciente primero)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [orders, statusFilter, searchQuery, dateFrom, dateTo])

  // Paginación
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredOrders, currentPage])

  // Resetear página cuando cambian los filtros
  React.useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, searchQuery, dateFrom, dateTo])

  const handleClearFilters = () => {
    setStatusFilter('all')
    setSearchQuery('')
    setDateFrom('')
    setDateTo('')
    setCurrentPage(1)
  }

  const hasActiveFilters = statusFilter !== 'all' || searchQuery || dateFrom || dateTo

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

  // Componente de fila para react-window
  const Row = ({ index, style }: any) => {
    const order = paginatedOrders[index]
    
    return (
      <div style={style} className="px-1">
        <OrderCard order={order} />
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mis Pedidos</h2>
          <p className="text-gray-600 mt-1">
            {filteredOrders.length} pedido{filteredOrders.length !== 1 ? 's' : ''} 
            {hasActiveFilters && ' encontrado' + (filteredOrders.length !== 1 ? 's' : '')}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
            {hasActiveFilters && !showFilters && (
              <span className="w-2 h-2 bg-white rounded-full"></span>
            )}
          </button>
          <button
            onClick={onRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Filtros Expandibles */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar pedido
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Número de pedido o producto..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
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

            {/* Fecha desde */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Desde
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Fecha hasta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hasta
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Botón limpiar filtros */}
          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleClearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lista de Pedidos */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {hasActiveFilters 
              ? 'No se encontraron pedidos'
              : 'No tienes pedidos aún'
            }
          </h3>
          <p className="text-gray-600 mb-6">
            {hasActiveFilters
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Cuando realices tu primera compra, aparecerá aquí'
            }
          </p>
          {hasActiveFilters ? (
            <button
              onClick={handleClearFilters}
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Limpiar Filtros
            </button>
          ) : (
            <Link
              href="/productos"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Explorar Productos
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Lista Virtualizada de Pedidos */}
          {paginatedOrders.length < 10 ? (
            // Si hay pocos pedidos, usar lista normal
            <div className="space-y-4">
              {paginatedOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            // Si hay muchos pedidos, usar lista virtualizada
            <div ref={containerRef}>
              <List
                defaultHeight={listHeight}
                rowCount={paginatedOrders.length}
                rowHeight={160} // Altura aproximada de OrderCard + gap
                overscanCount={3} // Pre-renderizar 3 items adicionales para scroll suave
                className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                rowComponent={Row}
                rowProps={{}}
              />
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
              <div className="text-sm text-gray-600">
                Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} de {filteredOrders.length} pedidos
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    // Mostrar solo algunas páginas alrededor de la actual
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-lg transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white font-medium'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="px-2 text-gray-400">
                          ...
                        </span>
                      )
                    }
                    return null
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
