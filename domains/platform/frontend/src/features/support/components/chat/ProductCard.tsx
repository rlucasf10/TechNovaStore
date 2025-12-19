/**
 * Componente ProductCard para mostrar productos recomendados en el chat
 * 
 * Muestra una tarjeta compacta con:
 * - Imagen del producto (con fallback si falla la carga)
 * - Nombre del producto
 * - Precio
 * - Botón "Ver detalles"
 */

'use client'

import React, { useState } from 'react'
import Link from 'next/link'

interface ProductCardProps {
  product: {
    id: string
    name: string
    price: number
    image: string
  }
}

// Imagen placeholder cuando falla la carga
const PLACEHOLDER_IMAGE = '/images/placeholder-product.png'

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [imageError, setImageError] = useState(false)
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const handleImageError = () => {
    setImageError(true)
  }

  // Determinar la URL de la imagen
  const imageUrl = imageError ? PLACEHOLDER_IMAGE : (product.image || PLACEHOLDER_IMAGE)

  return (
    <div className="flex-shrink-0 w-48 bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Imagen del producto */}
      <div className="relative w-full h-32 bg-gray-100">
        {imageError || !product.image ? (
          // Placeholder visual cuando no hay imagen
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <svg 
              className="w-12 h-12 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={handleImageError}
          />
        )}
      </div>

      {/* Información del producto */}
      <div className="p-3">
        {/* Nombre del producto (máximo 2 líneas) */}
        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem]">
          {product.name}
        </h4>

        {/* Precio */}
        <p className="text-lg font-bold text-blue-600 mb-3">
          {formatPrice(product.price)}
        </p>

        {/* Botón Ver detalles */}
        <Link
          href={`/productos/${product.id}`}
          className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors duration-200"
        >
          Ver detalles
        </Link>
      </div>
    </div>
  )
}
