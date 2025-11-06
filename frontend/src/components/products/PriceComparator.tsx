'use client'

import { useState } from 'react'
import { Provider } from '@/types'

interface PriceComparatorProps {
  providers: Provider[]
  ourPrice: number
}

export function PriceComparator({ providers, ourPrice }: PriceComparatorProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Sort providers by total cost (price + shipping)
  const sortedProviders = [...providers]
    .filter(p => p.availability)
    .sort((a, b) => (a.price + a.shipping_cost) - (b.price + b.shipping_cost))

  const bestProvider = sortedProviders[0]
  const ourSavings = bestProvider ? (bestProvider.price + bestProvider.shipping_cost) - ourPrice : 0

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header expandible/colapsable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
        aria-expanded={isExpanded}
        aria-controls="price-comparator-content"
      >
        <div className="text-left">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            Comparador de Precios
            {ourSavings > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Ahorras {formatPrice(ourSavings)}
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Comparamos precios de diferentes proveedores para ofrecerte el mejor valor
          </p>
        </div>
        <svg
          className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Contenido expandible/colapsable */}
      <div
        id="price-comparator-content"
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-6">
          {/* Our Price Header */}
          <div className="bg-primary-50 rounded-lg p-4 mb-6 border-2 border-primary-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-primary-900 text-lg">TechNovaStore</h4>
                  <p className="text-sm text-primary-700">Nuestro precio final</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary-900">
                  {formatPrice(ourPrice)}
                </div>
                {ourSavings > 0 && (
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span className="text-sm text-green-600 font-semibold">
                      Ahorras {formatPrice(ourSavings)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabla de Comparación de Proveedores */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 text-lg mb-4">
              Comparación con proveedores externos
            </h4>
            
            {sortedProviders.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="font-medium">No hay proveedores disponibles en este momento</p>
              </div>
            ) : (
              <>
                {/* Tabla Desktop */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b-2 border-gray-300">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Proveedor</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Precio</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Envío</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Entrega</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedProviders.map((provider, index) => {
                        const totalCost = provider.price + provider.shipping_cost
                        const isBestOffer = index === 0
                        
                        return (
                          <tr
                            key={provider.name}
                            className={`border-b border-gray-200 transition-colors ${
                              isBestOffer 
                                ? 'bg-green-50 hover:bg-green-100' 
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{provider.name}</span>
                                {isBestOffer && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-600 text-white shadow-sm">
                                    ⭐ Mejor oferta
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Actualizado: {formatDate(provider.last_updated)}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right font-medium text-gray-900">
                              {formatPrice(provider.price)}
                            </td>
                            <td className="py-4 px-4 text-right">
                              {provider.shipping_cost > 0 ? (
                                <span className="text-gray-900">{formatPrice(provider.shipping_cost)}</span>
                              ) : (
                                <span className="text-green-600 font-medium">Gratis</span>
                              )}
                            </td>
                            <td className={`py-4 px-4 text-right font-bold text-lg ${
                              isBestOffer ? 'text-green-700' : 'text-gray-900'
                            }`}>
                              {formatPrice(totalCost)}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-gray-700">{provider.delivery_time} días</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Cards Mobile */}
                <div className="md:hidden space-y-3">
                  {sortedProviders.map((provider, index) => {
                    const totalCost = provider.price + provider.shipping_cost
                    const isBestOffer = index === 0
                    
                    return (
                      <div
                        key={provider.name}
                        className={`border rounded-lg p-4 ${
                          isBestOffer 
                            ? 'border-green-300 bg-green-50' 
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h5 className="font-semibold text-gray-900">{provider.name}</h5>
                            {isBestOffer && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-600 text-white mt-1">
                                ⭐ Mejor oferta
                              </span>
                            )}
                          </div>
                          <div className={`text-xl font-bold ${
                            isBestOffer ? 'text-green-700' : 'text-gray-900'
                          }`}>
                            {formatPrice(totalCost)}
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Precio:</span>
                            <span className="font-medium text-gray-900">{formatPrice(provider.price)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Envío:</span>
                            {provider.shipping_cost > 0 ? (
                              <span className="text-gray-900">{formatPrice(provider.shipping_cost)}</span>
                            ) : (
                              <span className="text-green-600 font-medium">Gratis</span>
                            )}
                          </div>
                          <div className="flex justify-between pt-2 border-t border-gray-200">
                            <span className="text-gray-600">Entrega:</span>
                            <span className="text-gray-900">{provider.delivery_time} días</span>
                          </div>
                        </div>
                        
                        <div className="mt-3 text-xs text-gray-500">
                          Actualizado: {formatDate(provider.last_updated)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Resumen de Ahorro */}
          {ourSavings > 0 && (
            <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-5 border-2 border-green-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-green-900 text-lg">
                    ¡Ahorra {formatPrice(ourSavings)} comprando con nosotros!
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Incluye gestión automática del pedido, seguimiento de envío y soporte al cliente dedicado
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-6 text-xs text-gray-600 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>
                Los precios de proveedores externos se actualizan automáticamente cada 2 horas. 
                Los precios pueden variar sin previo aviso. Nuestro precio incluye gestión del pedido, 
                seguimiento de envío y soporte al cliente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}