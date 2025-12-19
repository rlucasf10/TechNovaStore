/**
 * Tarjeta de Recomendaciones
 * 
 * Integra con Product_Recommender y muestra 4 productos recomendados
 * Requisitos: 11.1
 */

'use client'

import { useEffect, useState } from 'react'
import { Sparkles, ChevronRight } from 'lucide-react'
import { ProductCard } from '@/catalog'
import { ProductCardSkeleton } from '@/ui'
import { Product } from '@/types'

interface RecommendationsCardProps {
  userId?: string
  onViewProduct?: (productId: string) => void
}

export function RecommendationsCard({ userId, onViewProduct }: RecommendationsCardProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true)
        setError(null)

        // Llamar al servicio de recomendaciones a través del API Gateway
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
        const endpoint = userId 
          ? `${apiUrl}/recommender/user/${userId}?limit=4`
          : `${apiUrl}/recommender/trending?limit=4`

        const response = await fetch(endpoint)
        
        // Si el servicio no está disponible (404), simplemente mostrar estado vacío
        if (response.status === 404) {
          setProducts([])
          return
        }
        
        if (!response.ok) {
          // Silenciar error si el servicio no está disponible
          setProducts([])
          return
        }

        const data = await response.json()
        
        // El servicio devuelve SKUs con scores, necesitamos obtener los productos completos
        const recommendations = data.data || []
        
        if (recommendations.length === 0) {
          setProducts([])
          return
        }

        // Extraer los SKUs de las recomendaciones
        const skus = recommendations.map((rec: { productSku: string }) => rec.productSku)
        
        // Obtener los productos completos por SKU (en paralelo)
        const productPromises = skus.map(async (sku: string) => {
          try {
            const res = await fetch(`${apiUrl}/products/sku/${sku}`)
            if (res.ok) {
              const productData = await res.json()
              return productData.data
            }
            return null
          } catch {
            return null
          }
        })
        
        const fetchedProducts = await Promise.all(productPromises)
        const validProducts = fetchedProducts.filter((p): p is Product => p !== null)
        setProducts(validProducts)
      } catch {
        // Silenciar errores del servicio de recomendaciones
        // ya que es un servicio opcional
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [userId])

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {userId ? 'Recomendado para ti' : 'Productos Destacados'}
          </h3>
        </div>
        <a
          href="/productos"
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
        >
          Ver más
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>

      {/* Subtítulo */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {userId 
          ? 'Basado en tus compras anteriores y preferencias'
          : 'Los productos más populares de nuestra tienda'
        }
      </p>

      {/* Grid de productos */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Intentar de nuevo
          </button>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={(prod) => {
                // Implementar lógica de agregar al carrito
                console.log('Add to cart:', prod.id)
              }}
              onQuickView={(prod) => {
                if (onViewProduct) {
                  onViewProduct(prod.id)
                } else {
                  window.location.href = `/productos/${prod.id}`
                }
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-2">No hay recomendaciones disponibles</p>
          <a
            href="/productos"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Explorar Catálogo
          </a>
        </div>
      )}

      {/* Mensaje motivacional */}
      {products.length > 0 && (
        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-100 dark:border-purple-800">
          <p className="text-sm text-purple-900 dark:text-purple-200 text-center">
            💡 <span className="font-medium">Tip:</span> Agrega productos a tu lista de deseos para recibir notificaciones de ofertas
          </p>
        </div>
      )}
    </div>
  )
}
