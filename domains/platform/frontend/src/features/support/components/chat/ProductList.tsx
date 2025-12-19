/**
 * Componente ProductList para mostrar productos recomendados en el chat
 * 
 * Características:
 * - Scroll horizontal si hay más de 3 productos
 * - Muestra tarjetas compactas de productos
 * - Diseño responsivo
 * - Adapta productos del backend (sku, images[]) al formato del frontend (id, image)
 */

import React from 'react'
import { ProductCard } from './ProductCard'

// Interfaz del producto que viene del backend
interface BackendProduct {
  sku?: string
  id?: string
  name: string
  price: number
  images?: string[]
  image?: string
}

interface ProductListProps {
  products: BackendProduct[]
}

// Imagen placeholder cuando no hay imagen disponible
const PLACEHOLDER_IMAGE = '/images/placeholder-product.png'

export const ProductList: React.FC<ProductListProps> = ({ products }) => {
  if (!products || products.length === 0) {
    return null
  }

  // Adaptar productos del backend al formato esperado por ProductCard
  const adaptedProducts = products.map((product) => ({
    id: product.sku || product.id || `product-${Math.random().toString(36).substr(2, 9)}`,
    name: product.name,
    price: product.price,
    // Usar la primera imagen del array, o image si existe, o placeholder
    image: product.images?.[0] || product.image || PLACEHOLDER_IMAGE
  }))

  return (
    <div className="mt-3 mb-2">
      {/* Título */}
      <div className="flex items-center gap-2 mb-2 px-2">
        <svg 
          className="w-4 h-4 text-blue-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" 
          />
        </svg>
        <span className="text-sm font-medium text-gray-700">
          Productos recomendados
        </span>
      </div>

      {/* Lista de productos con scroll horizontal */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="flex gap-3 px-2 pb-2">
          {adaptedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {/* Indicador de scroll si hay más de 3 productos */}
      {products.length > 3 && (
        <div className="text-xs text-gray-500 text-center mt-1">
          ← Desliza para ver más productos →
        </div>
      )}
    </div>
  )
}
