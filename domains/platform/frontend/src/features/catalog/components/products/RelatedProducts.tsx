'use client'

import { useRelatedProducts } from '@/catalog'
import { ProductCard } from './ProductCard'
import { Product } from '@/types'

interface RelatedProductsProps {
  productId: string
  limit?: number
  onAddToCart?: (product: Product) => void
  onQuickView?: (product: Product) => void
}

/**
 * Componente RelatedProducts - Sección de productos relacionados
 * 
 * Muestra un grid de productos relacionados basados en el producto actual.
 * Utiliza el hook useRelatedProducts para obtener los datos.
 * 
 * @param productId - ID del producto actual
 * @param limit - Número máximo de productos a mostrar (por defecto 4)
 * @param onAddToCart - Callback cuando se agrega un producto al carrito
 * @param onQuickView - Callback cuando se hace clic en vista rápida
 */
export function RelatedProducts({ 
  productId, 
  limit = 4,
  onAddToCart,
  onQuickView 
}: RelatedProductsProps) {
  const { data: relatedProducts, isLoading, error } = useRelatedProducts(productId, limit)

  // No mostrar nada si hay error o no hay productos
  if (error || (!isLoading && (!relatedProducts || relatedProducts.length === 0))) {
    return null
  }

  return (
    <section className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 lg:p-8">
      {/* Título de la sección */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Productos Relacionados
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Otros productos que podrían interesarte
        </p>
      </div>

      {/* Grid de productos */}
      {isLoading ? (
        // Skeleton loading
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: limit }).map((_, index) => (
            <div 
              key={index} 
              className="bg-gray-100 dark:bg-slate-700 rounded-lg animate-pulse"
              style={{ aspectRatio: '3/4' }}
            >
              <div className="h-full flex flex-col p-4">
                <div className="aspect-square bg-gray-200 dark:bg-slate-600 rounded-lg mb-4"></div>
                <div className="space-y-3 flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-1/2"></div>
                  <div className="h-6 bg-gray-200 dark:bg-slate-600 rounded w-1/3 mt-auto"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {relatedProducts?.map((product: any) => (
            <ProductCard
              key={product.id || (product as any)._id}
              product={product}
              onAddToCart={onAddToCart}
              onQuickView={onQuickView}
              viewMode="grid"
            />
          ))}
        </div>
      )}
    </section>
  )
}
