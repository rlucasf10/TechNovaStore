/**
 * Vista de Lista de Deseos en el Dashboard
 * 
 * Muestra los productos guardados en la wishlist del usuario
 * Permite eliminar productos y moverlos al carrito
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProductCard } from '@/catalog'
import { useWishlist } from '@/hooks/useWishlist'
import { Button } from '@/ui/Button'
import { Heart, ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/commerce'
import { useToast } from '@/hooks/useToast'
import { Product } from '@/types'

export function WishlistView() {
  const router = useRouter()
  const { items, isLoading, refetch, removeFromWishlist } = useWishlist()
  const addToCart = useCartStore((state) => state.addItem)
  const toast = useToast()

  // Refetch al montar el componente
  useEffect(() => {
    refetch()
  }, [refetch])

  // Manejar mover al carrito
  const handleMoveToCart = (product: Product) => {
    try {
      const productId = product.id || (product as any)._id

      addToCart({
        id: `cart-${productId}-${Date.now()}`,
        productId: productId,
        name: product.name,
        price: product.our_price,
        image: product.images?.[0] || '/placeholder-product.svg',
        sku: product.sku,
        brand: product.brand,
        maxQuantity: 99,
      }, 1)

      // Eliminar de wishlist
      removeFromWishlist(productId)

      toast.success(
        'Producto movido al carrito',
        '¡Listo!'
      )
    } catch (error) {
      console.error('Error moving to cart:', error)
      toast.error(
        'No se pudo mover el producto al carrito',
        'Error'
      )
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Heart className="w-6 h-6 text-red-500 fill-current" />
          <h2 className="text-2xl font-bold text-gray-900">Mi Lista de Deseos</h2>
        </div>
        <p className="text-gray-600">
          {items.length === 0
            ? 'Aún no has guardado ningún producto'
            : `${items.length} ${items.length === 1 ? 'producto guardado' : 'productos guardados'}`
          }
        </p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && items.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Tu lista de deseos está vacía
          </h3>
          <p className="text-gray-600 mb-6">
            Explora nuestro catálogo y guarda tus productos favoritos
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => router.push('/productos')}
          >
            Explorar productos
          </Button>
        </div>
      )}

      {/* Grid de productos */}
      {!isLoading && items.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((product) => (
              <div key={product.id || (product as any)._id} className="relative group">
                <ProductCard product={product} />
                
                {/* Botón de mover al carrito - overlay en hover */}
                <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="pointer-events-auto">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full bg-white hover:bg-gray-50 shadow-lg"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleMoveToCart(product)
                      }}
                      iconLeft={<ShoppingCart className="w-4 h-4" />}
                    >
                      Mover al carrito
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Acciones rápidas */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => router.push('/productos')}
            >
              Seguir explorando
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push('/carrito')}
              iconLeft={<ShoppingCart className="w-5 h-5" />}
            >
              Ir al carrito
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
