import React from 'react'
import Link from 'next/link'
import { Product } from '@/types'

interface ProductRecommendationsProps {
  products: Product[]
  className?: string
}

export const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({
  products,
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
    <div className={`bg-white rounded-lg border border-gray-200 p-3 ${className}`}>
      <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
        <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Productos recomendados
      </h4>
      
      <div className="space-y-2">
        {products.slice(0, 3).map((product) => (
          <Link
            key={product.id}
            href={`/productos/${product.sku}`}
            className="block hover:bg-gray-50 rounded-lg p-2 transition-colors duration-200"
          >
            <div className="flex items-center space-x-3">
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
                <h5 className="text-sm font-medium text-gray-900 truncate">
                  {product.name}
                </h5>
                <p className="text-xs text-gray-500 truncate">
                  {product.brand} • {product.category}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-semibold text-blue-600">
                    {formatPrice(product.our_price)}
                  </span>
                  
                  {/* Availability indicator */}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    product.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.is_active ? 'Disponible' : 'Agotado'}
                  </span>
                </div>
              </div>
              
              {/* Arrow icon */}
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
      
      {products.length > 3 && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
            Ver {products.length - 3} productos más →
          </button>
        </div>
      )}
    </div>
  )
}