'use client'

import { Provider } from '@/types'

interface PriceComparatorProps {
  providers: Provider[]
  ourPrice: number
}

export function PriceComparator({ providers, ourPrice }: PriceComparatorProps) {
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
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Comparador de Precios
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Comparamos precios de diferentes proveedores para ofrecerte el mejor valor
        </p>
      </div>

      <div className="p-6">
        {/* Our Price Header */}
        <div className="bg-primary-50 rounded-lg p-4 mb-6 border border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-primary-900">TechNovaStore</h4>
              <p className="text-sm text-primary-700">Nuestro precio final</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-900">
                {formatPrice(ourPrice)}
              </div>
              {ourSavings > 0 && (
                <div className="text-sm text-green-600 font-medium">
                  Ahorras {formatPrice(ourSavings)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Providers Comparison */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 mb-3">
            Precios de proveedores externos
          </h4>
          
          {sortedProviders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay proveedores disponibles en este momento
            </div>
          ) : (
            <div className="grid gap-4">
              {sortedProviders.map((provider, index) => {
                const totalCost = provider.price + provider.shipping_cost
                const isLowest = index === 0
                
                return (
                  <div
                    key={provider.name}
                    className={`border rounded-lg p-4 ${
                      isLowest 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h5 className="font-medium text-gray-900">
                            {provider.name}
                          </h5>
                          {isLowest && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Más barato
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Precio del producto:</span>
                            <span>{formatPrice(provider.price)}</span>
                          </div>
                          {provider.shipping_cost > 0 && (
                            <div className="flex justify-between">
                              <span>Gastos de envío:</span>
                              <span>{formatPrice(provider.shipping_cost)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-medium text-gray-900 pt-1 border-t border-gray-200">
                            <span>Total:</span>
                            <span>{formatPrice(totalCost)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="ml-6 text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {formatPrice(totalCost)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {provider.delivery_time} días
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                      <div className="flex justify-between items-center">
                        <span>Última actualización: {formatDate(provider.last_updated)}</span>
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-1 ${
                            provider.availability ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <span>{provider.availability ? 'Disponible' : 'No disponible'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Savings Summary */}
        {ourSavings > 0 && (
          <div className="mt-6 bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-green-900">
                  ¡Ahorra {formatPrice(ourSavings)} comprando con nosotros!
                </p>
                <p className="text-sm text-green-700">
                  Incluye gestión automática del pedido, seguimiento y soporte al cliente
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-6 text-xs text-gray-500 bg-gray-50 rounded p-3">
          <p>
            * Los precios de proveedores externos se actualizan automáticamente cada 2 horas. 
            Los precios pueden variar sin previo aviso. Nuestro precio incluye gestión del pedido, 
            seguimiento de envío y soporte al cliente.
          </p>
        </div>
      </div>
    </div>
  )
}