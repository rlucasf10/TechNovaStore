import React from 'react'
import Link from 'next/link'
import { Product } from '@/types'

interface ChatRecommendationCardProps {
  products: Product[]
  title?: string
  reason?: string
  className?: string
}

export const ChatRecommendationCard: React.FC<ChatRecommendationCardProps> = ({
  products,
  title = 'Productos recomendados',
  reason,
  className = ''
}) => {
  if (!products || products.length === 0) {
    return null
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-white bg-opacity-80 backdrop-blur-sm p-3 border-b border-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
              {reason && (
                <p className="text-xs text-gray-600">{reason}</p>
              )}
            </div>
          </div>
          <span className="text-xs text-blue-600 font-medium">
            {products.length} producto{products.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-3">
        <div className={`grid gap-3 ${
          products.length === 1 ? 'grid-cols-1' : 
          products.length === 2 ? 'grid-cols-2' : 
          'grid-cols-1'
        }`}>
          {products.slice(0, 3).map((product) => (
            <Link
              key={product.id}
              href={`/productos/${product.sku}`}
              className="block bg-white rounded-lg p-3 hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-blue-200"
            >
              <div className="flex items-start space-x-3">
                {/* Product Image */}
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/placeholder-product.png'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
                    {product.name}
                  </h5>
                  <p className="text-xs text-gray-500 mt-1">
                    {product.brand}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-semibold text-blue-600">
                      {formatPrice(product.our_price)}
                    </span>
                    
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      product.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.is_active ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View More Button */}
        {products.length > 3 && (
          <div className="mt-3 pt-3 border-t border-blue-100">
            <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors duration-200">
              Ver {products.length - 3} productos más →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}