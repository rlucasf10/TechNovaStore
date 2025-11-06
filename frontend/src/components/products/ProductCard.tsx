'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Product } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Rating } from '@/components/ui/Rating'
import { useCartStore } from '@/store/cart.store'
import { useToast } from '@/hooks/useToast'

interface ProductCardProps {
  product: Product
  /** Callback cuando se agrega al carrito */
  onAddToCart?: (product: Product) => void
  /** Callback cuando se hace clic en Quick View */
  onQuickView?: (product: Product) => void
  /** Modo de vista: grid o list */
  viewMode?: 'grid' | 'list'
}

/**
 * Componente ProductCard - Tarjeta de producto para catálogo
 * 
 * Características:
 * - Imagen con aspect ratio 1:1
 * - Badge de descuento si aplica
 * - Nombre con 2 líneas max con ellipsis
 * - Rating con número de reviews
 * - Precio tachado si hay descuento + precio final
 * - Botón "Agregar al carrito"
 * - Icono de "Quick View" en hover
 * - Animación de hover
 */
export function ProductCard({ product, onAddToCart, onQuickView, viewMode = 'grid' }: ProductCardProps) {
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const addItem = useCartStore((state) => state.addItem)
  const toast = useToast()
  
  // Imagen principal del producto
  const mainImage = product.images?.[0] || '/placeholder-product.svg'
  
  // Mejor proveedor disponible (menor precio total)
  const bestProvider = product.providers
    ?.filter(p => p.availability)
    ?.sort((a, b) => (a.price + a.shipping_cost) - (b.price + b.shipping_cost))[0]

  // Formatear precio en euros
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  // Calcular porcentaje de descuento
  const discountPercentage = product.discount_percentage || 
    (product.original_price && product.original_price > product.our_price
      ? Math.round(((product.original_price - product.our_price) / product.original_price) * 100)
      : 0)

  // Precio original (antes de descuento)
  const originalPrice = product.original_price || 
    (discountPercentage > 0 ? product.our_price / (1 - discountPercentage / 100) : null)

  // Manejar agregar al carrito
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsAddingToCart(true)
    try {
      // Si hay callback personalizado, usarlo
      if (onAddToCart) {
        await onAddToCart(product)
      } else {
        // Usar el store directamente
        addItem({
          id: `cart-${product.id}-${Date.now()}`,
          productId: product.id,
          name: product.name,
          price: product.our_price,
          image: product.images?.[0] || '/placeholder-product.svg',
          sku: product.sku,
          brand: product.brand,
          maxQuantity: 99,
        }, 1)
        
        toast.success(
          'Producto agregado al carrito',
          '¡Listo!'
        )
      }
    } catch (error) {
      console.error('Error al agregar al carrito:', error)
      toast.error(
        'No se pudo agregar el producto',
        'Error'
      )
    } finally {
      setIsAddingToCart(false)
    }
  }

  // Manejar Quick View
  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (onQuickView) {
      onQuickView(product)
    }
  }

  // ID del producto (usar _id de MongoDB si id no está disponible)
  const productId = product.id || (product as any)._id;

  // Renderizar en modo lista
  if (viewMode === 'list') {
    return (
      <div className="group relative bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg hover:border-primary-200 transition-all duration-300">
        <Link href={`/productos/${productId}`} className="flex flex-col sm:flex-row">
          {/* Imagen del producto - más pequeña en modo lista */}
          <div className="relative w-full sm:w-48 h-48 flex-shrink-0 overflow-hidden rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none bg-gray-100">
            <Image
              src={mainImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, 192px"
              className="object-cover object-center group-hover:scale-110 transition-transform duration-300"
            />
            
            {/* Badge de descuento */}
            {discountPercentage > 0 && (
              <div className="absolute top-2 left-2 z-10">
                <Badge variant="error" size="md" className="font-bold">
                  -{discountPercentage}%
                </Badge>
              </div>
            )}
          </div>
          
          {/* Contenido de la tarjeta - horizontal en modo lista */}
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div className="space-y-2">
              {/* Nombre del producto */}
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
                {product.name}
              </h3>

              {/* Rating con número de reviews */}
              {product.rating !== undefined && product.rating > 0 && (
                <div className="flex items-center">
                  <Rating 
                    value={product.rating} 
                    size="sm" 
                    readOnly 
                    showValue
                    reviewCount={product.review_count}
                  />
                </div>
              )}

              {/* Estado de disponibilidad */}
              <div className="flex items-center gap-2">
                {product.is_active && bestProvider ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full" aria-hidden="true"></div>
                    <span className="text-xs text-green-600 font-medium">En stock</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full" aria-hidden="true"></div>
                    <span className="text-xs text-red-600 font-medium">No disponible</span>
                  </>
                )}
              </div>
            </div>

            {/* Sección de precio y botón */}
            <div className="flex items-end justify-between mt-4">
              <div className="space-y-1">
                {/* Precio original tachado si hay descuento */}
                {originalPrice && discountPercentage > 0 && (
                  <div className="text-sm text-gray-500 line-through">
                    {formatPrice(originalPrice)}
                  </div>
                )}
                
                {/* Precio final */}
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatPrice(product.our_price)}
                  </span>
                </div>
              </div>

              {/* Botón "Agregar al carrito" */}
              <Button
                variant="primary"
                size="md"
                onClick={handleAddToCart}
                disabled={!product.is_active || !bestProvider || isAddingToCart}
                loading={isAddingToCart}
                iconLeft={
                  !isAddingToCart && (
                    <svg 
                      className="w-5 h-5" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
                      />
                    </svg>
                  )
                }
              >
                {isAddingToCart ? 'Agregando...' : 'Agregar'}
              </Button>
            </div>
          </div>
        </Link>
      </div>
    )
  }

  // Renderizar en modo grid (por defecto)
  return (
    <div className="group relative bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg hover:border-primary-200 transition-all duration-300">
      <Link href={`/productos/${productId}`} className="block">
        {/* Imagen del producto */}
        <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gray-100">
          <Image
            src={mainImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-center group-hover:scale-110 transition-transform duration-300"
          />
          
          {/* Badge de descuento */}
          {discountPercentage > 0 && (
            <div className="absolute top-2 left-2 z-10">
              <Badge variant="error" size="md" className="font-bold">
                -{discountPercentage}%
              </Badge>
            </div>
          )}

          {/* Icono de Quick View en hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
            <Button
              size="sm"
              variant="secondary"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white hover:bg-gray-50 shadow-lg"
              onClick={handleQuickView}
              aria-label="Vista rápida del producto"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
                />
              </svg>
              <span className="ml-1">Vista rápida</span>
            </Button>
          </div>
        </div>
        
        {/* Contenido de la tarjeta */}
        <div className="p-4 space-y-3">
          {/* Nombre del producto (2 líneas max) */}
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem] group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>

          {/* Rating con número de reviews */}
          {product.rating !== undefined && product.rating > 0 && (
            <div className="flex items-center">
              <Rating 
                value={product.rating} 
                size="sm" 
                readOnly 
                showValue
                reviewCount={product.review_count}
              />
            </div>
          )}

          {/* Sección de precio */}
          <div className="space-y-1">
            {/* Precio original tachado si hay descuento */}
            {originalPrice && discountPercentage > 0 && (
              <div className="text-sm text-gray-500 line-through">
                {formatPrice(originalPrice)}
              </div>
            )}
            
            {/* Precio final */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(product.our_price)}
              </span>
              {discountPercentage > 0 && (
                <span className="text-sm text-green-600 font-semibold">
                  Ahorras {formatPrice(originalPrice! - product.our_price)}
                </span>
              )}
            </div>
          </div>

          {/* Estado de disponibilidad */}
          <div className="flex items-center gap-2">
            {product.is_active && bestProvider ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full" aria-hidden="true"></div>
                <span className="text-xs text-green-600 font-medium">En stock</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full" aria-hidden="true"></div>
                <span className="text-xs text-red-600 font-medium">No disponible</span>
              </>
            )}
          </div>
        </div>
      </Link>

      {/* Botón "Agregar al carrito" */}
      <div className="px-4 pb-4">
        <Button
          variant="primary"
          size="md"
          className="w-full"
          onClick={handleAddToCart}
          disabled={!product.is_active || !bestProvider || isAddingToCart}
          loading={isAddingToCart}
          iconLeft={
            !isAddingToCart && (
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
                />
              </svg>
            )
          }
        >
          {isAddingToCart ? 'Agregando...' : 'Agregar al carrito'}
        </Button>
      </div>
    </div>
  )
}
