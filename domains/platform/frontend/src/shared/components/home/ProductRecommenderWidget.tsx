'use client'

import { useEffect, useState } from 'react'
import { Product } from '@/types'
import { recommenderService } from '@/shared/services'
import { ProductCard } from '@/catalog/components/products'
import { useAuthStore } from '@/customer'

interface ProductRecommenderWidgetProps {
  /** Número máximo de productos a mostrar */
  limit?: number
  /** Título del widget */
  title?: string
  /** Categoría específica para filtrar recomendaciones */
  category?: string
  /** Clase CSS adicional */
  className?: string
}

/**
 * Componente ProductRecommenderWidget
 * 
 * Widget de recomendaciones de productos integrado con Product_Recommender service
 * 
 * Características:
 * - Grid responsivo (4 columnas desktop, 2 móvil)
 * - Skeleton loading mientras carga
 * - Integración con Product_Recommender service
 * - Recomendaciones personalizadas si el usuario está autenticado
 * - Recomendaciones trending si no hay usuario
 * 
 * Requisitos: 6.2, 22.5
 */
export function ProductRecommenderWidget({
  limit = 8,
  title = 'Recomendado para ti',
  category,
  className = ''
}: ProductRecommenderWidgetProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Obtener usuario autenticado
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    loadRecommendations()
  }, [user, limit, category])

  /**
   * Cargar recomendaciones del servicio
   */
  const loadRecommendations = async () => {
    setIsLoading(true)
    setError(null)

    try {
      let recommendedProducts: Product[] = []

      // Si hay usuario autenticado, obtener recomendaciones personalizadas
      if (user?.id) {
        recommendedProducts = await recommenderService.getUserRecommendations({
          userId: user.id.toString(),
          limit,
          category
        })
      }

      // Si no hay recomendaciones personalizadas, obtener trending
      if (recommendedProducts.length === 0) {
        recommendedProducts = await recommenderService.getTrendingProducts(limit)
      }

      // Si el servicio de recomendaciones no está disponible, usar productos del catálogo
      if (recommendedProducts.length === 0) {
        const { productService } = await import('@/catalog/services/product.service')
        const response = await productService.getProducts({
          limit,
          sortBy: 'popularity',
          inStock: true
        })
        recommendedProducts = response.data
      }

      setProducts(recommendedProducts)
    } catch (err) {
      console.error('Error loading recommendations:', err)
      
      // Fallback final: intentar cargar productos del catálogo
      try {
        const { productService } = await import('@/catalog/services/product.service')
        const response = await productService.getProducts({
          limit,
          sortBy: 'popularity',
          inStock: true
        })
        setProducts(response.data)
      } catch (fallbackErr) {
        console.error('Error loading fallback products:', fallbackErr)
        setError('No se pudieron cargar las recomendaciones')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Si hay error, no mostrar el widget
  if (error) {
    return null
  }

  // Si no hay productos después de cargar, no mostrar el widget
  if (!isLoading && products.length === 0) {
    return null
  }

  return (
    <section className={`py-16 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Título con badge */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              {title}
            </h2>
            {!user && (
              <span className="hidden md:inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                🔥 Trending
              </span>
            )}
          </div>
          {!isLoading && products.length > 0 && (
            <a
              href="/productos"
              className="hidden md:inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              Ver más
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          )}
        </div>

        <p className="text-gray-600 mb-8">
          {user 
            ? 'Productos seleccionados especialmente para ti basados en tus preferencias'
            : 'Los productos más populares y mejor valorados por nuestros clientes'
          }
        </p>

        {/* Grid de productos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {isLoading ? (
            // Skeleton loading
            <>
              {Array.from({ length: limit }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </>
          ) : (
            // Productos reales
            <>
              {products.map((product, index) => (
                <ProductCard
                  key={product.id || product.sku || `product-${index}`}
                  product={product}
                  viewMode="grid"
                />
              ))}
            </>
          )}
        </div>

        {/* Botón para ver más en móvil */}
        {!isLoading && products.length > 0 && (
          <div className="text-center mt-8 md:hidden">
            <a
              href="/productos"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 w-full"
            >
              Ver todos los productos
              <svg
                className="ml-2 -mr-1 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </a>
          </div>
        )}
      </div>
    </section>
  )
}

/**
 * Skeleton loader para ProductCard
 */
function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      {/* Imagen skeleton */}
      <div className="aspect-square bg-gray-200" />
      
      {/* Contenido skeleton */}
      <div className="p-4 space-y-3">
        {/* Nombre del producto */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>

        {/* Rating */}
        <div className="flex items-center space-x-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-4 h-4 bg-gray-200 rounded" />
          ))}
        </div>

        {/* Precio */}
        <div className="space-y-1">
          <div className="h-6 bg-gray-200 rounded w-1/2" />
        </div>

        {/* Estado */}
        <div className="h-3 bg-gray-200 rounded w-1/3" />
      </div>

      {/* Botón */}
      <div className="px-4 pb-4">
        <div className="h-10 bg-gray-200 rounded w-full" />
      </div>
    </div>
  )
}
