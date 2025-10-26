import React, { useState } from 'react'
import Link from 'next/link'
import { Product } from '@/types'

interface ProductCarouselProps {
  products: Product[]
  className?: string
}

export const ProductCarousel: React.FC<ProductCarouselProps> = ({
  products,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!products || products.length === 0) {
    return null
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const nextProduct = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length)
  }

  const prevProduct = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length)
  }

  const currentProduct = products[currentIndex]

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-800 flex items-center">
          <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Recomendaciones personalizadas
        </h4>
        
        {products.length > 1 && (
          <div className="flex items-center space-x-1">
            <button
              onClick={prevProduct}
              className="p-1 rounded-full hover:bg-white hover:shadow-sm transition-all duration-200"
              aria-label="Producto anterior"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs text-gray-500 px-2">
              {currentIndex + 1}/{products.length}
            </span>
            <button
              onClick={nextProduct}
              className="p-1 rounded-full hover:bg-white hover:shadow-sm transition-all duration-200"
              aria-label="Siguiente producto"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <Link
        href={`/productos/${currentProduct.sku}`}
        className="block hover:shadow-md transition-shadow duration-200"
      >
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="flex items-start space-x-3">
            {/* Product Image */}
            <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
              {currentProduct.images && currentProduct.images.length > 0 ? (
                <img
                  src={currentProduct.images[0]}
                  alt={currentProduct.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/placeholder-product.png'
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <h5 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
                {currentProduct.name}
              </h5>
              <p className="text-xs text-gray-500 mt-1">
                {currentProduct.brand} • {currentProduct.category}
              </p>
              
              {/* Price and availability */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-blue-600">
                    {formatPrice(currentProduct.our_price)}
                  </span>
                  {currentProduct.providers && currentProduct.providers.length > 0 && (
                    <span className="text-xs text-gray-500">
                      Desde {formatPrice(Math.min(...currentProduct.providers.map(p => p.price)))}
                    </span>
                  )}
                </div>
                
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  currentProduct.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {currentProduct.is_active ? 'Disponible' : 'Agotado'}
                </span>
              </div>
              
              {/* Quick specs */}
              {currentProduct.specifications && Object.keys(currentProduct.specifications).length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  {Object.entries(currentProduct.specifications)
                    .slice(0, 2)
                    .map(([key, value]) => (
                      <div key={key} className="truncate">
                        <span className="font-medium">{key}:</span> {String(value)}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Action button */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-600 font-medium">
                Ver detalles →
              </span>
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-xs text-gray-500">4.5</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
      
      {/* Dots indicator */}
      {products.length > 1 && (
        <div className="flex justify-center mt-3 space-x-1">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              aria-label={`Ir al producto ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}