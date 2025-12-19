/**
 * Tarjeta de Estadísticas
 * 
 * Muestra total gastado, pedidos completados, productos en lista de deseos
 * y un mini gráfico de gastos mensuales
 * Requisitos: 11.5
 */

'use client'

import { useMemo } from 'react'
import { DollarSign, ShoppingBag, Heart, TrendingUp, TrendingDown } from 'lucide-react'
import { Order } from '@/types'
import { useWishlistStore } from '@/shared/store'

interface StatisticsCardProps {
  orders: Order[]
}

export function StatisticsCard({ orders }: StatisticsCardProps) {
  // Obtener el contador de wishlist del store
  const wishlistCount = useWishlistStore((state: any) => state.items.length)
  // Calcular estadísticas
  const statistics = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth()

    // Filtrar pedidos del año actual
    const ordersThisYear = orders.filter(order => {
      const orderYear = new Date(order.created_at).getFullYear()
      return orderYear === currentYear
    })

    // Total gastado este año
    const totalSpent = ordersThisYear.reduce((sum, order) => {
      const amount = typeof order.total_amount === 'number' 
        ? order.total_amount 
        : parseFloat(order.total_amount || '0')
      return sum + amount
    }, 0)

    // Pedidos completados
    const completedOrders = orders.filter(order => 
      order.status === 'delivered'
    ).length

    // Gastos por mes (últimos 6 meses)
    const monthlySpending = Array.from({ length: 6 }, (_, i) => {
      const month = currentMonth - (5 - i)
      const year = month < 0 ? currentYear - 1 : currentYear
      const adjustedMonth = month < 0 ? month + 12 : month

      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at)
        return orderDate.getMonth() === adjustedMonth && 
               orderDate.getFullYear() === year
      })

      const total = monthOrders.reduce((sum, order) => {
        const amount = typeof order.total_amount === 'number' 
          ? order.total_amount 
          : parseFloat(order.total_amount || '0')
        return sum + amount
      }, 0)

      return {
        month: new Date(year, adjustedMonth).toLocaleDateString('es-ES', { month: 'short' }),
        amount: total
      }
    })

    // Calcular tendencia (comparar últimos 3 meses con 3 meses anteriores)
    const recentSpending = monthlySpending.slice(3).reduce((sum, m) => sum + m.amount, 0)
    const previousSpending = monthlySpending.slice(0, 3).reduce((sum, m) => sum + m.amount, 0)
    const trend = previousSpending > 0 
      ? ((recentSpending - previousSpending) / previousSpending) * 100 
      : 0

    return {
      totalSpent,
      completedOrders,
      monthlySpending,
      trend
    }
  }, [orders])

  // Calcular altura de las barras del gráfico
  const maxAmount = Math.max(...statistics.monthlySpending.map(m => m.amount), 1)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Estadísticas</h3>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Total gastado */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-blue-900 dark:text-blue-200 uppercase tracking-wide">
              Gastado {new Date().getFullYear()}
            </span>
            <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            ${statistics.totalSpent.toFixed(2)}
          </p>
          {statistics.trend !== 0 && (
            <div className="flex items-center gap-1 mt-2">
              {statistics.trend > 0 ? (
                <>
                  <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    +{statistics.trend.toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                    {statistics.trend.toFixed(1)}%
                  </span>
                </>
              )}
              <span className="text-xs text-gray-600 dark:text-gray-400">vs trimestre anterior</span>
            </div>
          )}
        </div>

        {/* Pedidos completados */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg p-4 border border-green-200 dark:border-green-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-green-900 dark:text-green-200 uppercase tracking-wide">
              Completados
            </span>
            <ShoppingBag className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            {statistics.completedOrders}
          </p>
          <p className="text-xs text-green-700 dark:text-green-300 mt-2">
            {orders.length > 0 
              ? `${((statistics.completedOrders / orders.length) * 100).toFixed(0)}% del total`
              : 'Sin pedidos aún'
            }
          </p>
        </div>

        {/* Lista de deseos */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-purple-900 dark:text-purple-200 uppercase tracking-wide">
              Lista de Deseos
            </span>
            <Heart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {wishlistCount}
          </p>
          <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">
            {wishlistCount > 0 ? 'Productos guardados' : 'Lista vacía'}
          </p>
        </div>
      </div>

      {/* Mini gráfico de gastos mensuales */}
      <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Gastos Mensuales</h4>
          <span className="text-xs text-gray-500 dark:text-gray-400">Últimos 6 meses</span>
        </div>

        {/* Gráfico de barras simple */}
        <div className="flex items-end justify-between gap-2 h-24">
          {statistics.monthlySpending.map((month, index) => {
            const height = maxAmount > 0 ? (month.amount / maxAmount) * 100 : 0
            const isCurrentMonth = index === statistics.monthlySpending.length - 1

            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                {/* Barra */}
                <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${
                      isCurrentMonth 
                        ? 'bg-gradient-to-t from-blue-500 to-blue-400' 
                        : 'bg-gradient-to-t from-gray-300 to-gray-200 dark:from-slate-600 dark:to-slate-500'
                    }`}
                    style={{ height: `${height}%` }}
                    title={`${month.month}: $${month.amount.toFixed(2)}`}
                  >
                    {month.amount > 0 && height > 20 && (
                      <div className="text-xs text-white font-medium text-center pt-1">
                        ${month.amount > 1000 
                          ? `${(month.amount / 1000).toFixed(1)}k` 
                          : month.amount.toFixed(0)
                        }
                      </div>
                    )}
                  </div>
                </div>

                {/* Etiqueta del mes */}
                <span className={`text-xs font-medium ${
                  isCurrentMonth ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {month.month}
                </span>
              </div>
            )
          })}
        </div>

        {/* Leyenda */}
        {maxAmount === 0 && (
          <div className="text-center mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">No hay datos de gastos aún</p>
          </div>
        )}
      </div>
    </div>
  )
}
