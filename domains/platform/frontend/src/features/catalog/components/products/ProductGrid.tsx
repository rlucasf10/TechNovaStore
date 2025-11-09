'use client'

import { Product } from '@/types'
import { ProductCard } from './ProductCard'
import { ProductCardSkeletonGrid } from '@/ui/ProductCardSkeleton'

interface ProductGridProps {
  /** Lista de productos a mostrar */
  products: Product[]
  /** Indica si los productos están cargando */
  isLoading?: boolean
  /** Callback cuando se agrega un producto al carrito */
  onAddToCart?: (product: Product) => void
  /** Callback cuando se hace clic en Quick View */
  onQuickView?: (product: Product) => void
  /** Número de skeletons a mostrar durante la carga */
  skeletonCount?: number
  /** Clases CSS adicionales */
  className?: string
  /** Modo de vista: grid o list */
  viewMode?: 'grid' | 'list'
}

/**
 * ProductGrid Component
 * 
 * Grid responsivo de productos con las siguientes características:
 * - 4 columnas en desktop XL (≥1280px)
 * - 3 columnas en desktop (≥1024px)
 * - 2 columnas en tablet (≥640px)
 * - 1 columna en móvil (<640px)
 * - Skeleton loading mientras carga
 * - Gap de 24px entre productos
 * 
 * Requisitos: 7.1, 7.2, 7.5
 */
export function ProductGrid({
  products,
  isLoading = false,
  onAddToCart,
  onQuickView,
  skeletonCount = 8,
  className = '',
  viewMode = 'grid'
}: ProductGridProps) {
  // Mostrar skeleton loading mientras carga
  if (isLoading) {
    return (
      <ProductCardSkeletonGrid 
        count={skeletonCount}
        className={className}
      />
    )
  }

  // Mostrar mensaje si no hay productos
  if (products.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No se encontraron productos
        </h3>
        <p className="text-gray-600">
          Intenta ajustar los filtros o buscar con otros términos
        </p>
      </div>
    )
  }

  // Clases CSS según el modo de vista
  const gridClasses = viewMode === 'grid'
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
    : 'flex flex-col gap-4'

  return (
    <div
      className={`${gridClasses} ${className}`}
      role="list"
      aria-label="Lista de productos"
    >
      {products.map((product) => (
        <div key={product.id} role="listitem">
          <ProductCard
            product={product}
            onAddToCart={onAddToCart}
            onQuickView={onQuickView}
            viewMode={viewMode}
          />
        </div>
      ))}
    </div>
  )
}
