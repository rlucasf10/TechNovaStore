'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Product } from '@/types'
import { Button } from '@/ui/Button'
import { Badge } from '@/ui/Badge'
import { Rating } from '@/ui/Rating'
import { useCartStore } from '@/commerce'
import { useToast } from '@/hooks/useToast'
import { useComparisonStore } from '@/store/comparison.store'
import { useWishlist } from '@/hooks/useWishlist'
import { Heart } from 'lucide-react'

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
  const [showQuickView, setShowQuickView] = useState(false)
  const addItem = useCartStore((state) => state.addItem)
  const toast = useToast()
  const { addProduct, products, canAddMore, openModal, notifyInteraction } = useComparisonStore()
  const { toggleWishlist, isInWishlist, isAdding: isAddingToWishlist } = useWishlist()
  
  // Imagen principal del producto
  // Validar que la imagen no sea de example.com o inválida (datos de prueba)
  const rawImage = product.images?.[0]
  const isValidImage = rawImage && 
    !rawImage.includes('example.com') && 
    !rawImage.includes('placeholder') &&
    (rawImage.startsWith('http://') || rawImage.startsWith('https://') || rawImage.startsWith('/'))
  
  const mainImage = isValidImage ? rawImage : '/placeholder-product.svg'
  
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
    } else {
      // Si no hay callback, abrir modal interno
      setShowQuickView(true)
    }
  }

  // Manejar agregar a comparación
  const handleAddToCompare = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!canAddMore()) {
      toast.warning(
        'Ya tienes 5 productos en comparación. Elimina uno para agregar otro.',
        'Límite alcanzado'
      )
      openModal()
      return
    }

    const isAlreadyInComparison = products.some(p => p.id === product.id)
    if (isAlreadyInComparison) {
      notifyInteraction() // Notificar interacción para mostrar el botón flotante
      openModal()
      return
    }

    addProduct(product)
    toast.success(
      'Producto agregado a la comparación',
      '¡Listo!'
    )
  }

  const isInComparison = products.some(p => p.id === product.id)

  // ID del producto (usar _id de MongoDB si id no está disponible)
  const productId = product.id || (product as any)._id;

  // Manejar toggle de wishlist
  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    await toggleWishlist(product)
  }

  const isProductInWishlist = isInWishlist(productId)

  // Renderizar en modo lista
  if (viewMode === 'list') {
    return (
      <div className="group relative bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-600 transition-all duration-300">
        <Link href={`/productos/${productId}`} className="flex flex-col sm:flex-row">
          {/* Imagen del producto - más pequeña en modo lista */}
          <div className="relative w-full sm:w-48 h-48 flex-shrink-0 overflow-hidden rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none bg-gray-100 dark:bg-slate-700">
            <Image
              src={mainImage}
              alt={product.name || 'Producto'}
              fill
              sizes="(max-width: 640px) 100vw, 192px"
              className="object-cover object-center group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
            />
            
            {/* Badge de descuento */}
            {discountPercentage > 0 && (
              <div className="absolute top-2 left-2 z-10">
                <Badge variant="error" size="md" className="font-bold">
                  -{discountPercentage}%
                </Badge>
              </div>
            )}

            {/* Botón de Wishlist (corazón) */}
            <button
              onClick={handleToggleWishlist}
              disabled={isAddingToWishlist}
              className={`absolute top-2 right-2 z-10 p-2 rounded-full transition-all duration-200 ${
                isProductInWishlist
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
              } shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={isProductInWishlist ? 'Eliminar de lista de deseos' : 'Agregar a lista de deseos'}
            >
              <Heart
                className={`w-5 h-5 transition-all ${isProductInWishlist ? 'fill-current' : ''}`}
              />
            </button>
          </div>
          
          {/* Contenido de la tarjeta - horizontal en modo lista */}
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div className="space-y-2">
              {/* Nombre del producto */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
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
                  <div className="text-sm text-gray-500 dark:text-gray-400 line-through">
                    {formatPrice(originalPrice)}
                  </div>
                )}
                
                {/* Precio final */}
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
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
    <div className="group relative bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-600 transition-all duration-300">
      <Link href={`/productos/${productId}`} className="block">
        {/* Imagen del producto */}
        <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gray-100 dark:bg-slate-700">
          <Image
            src={mainImage}
            alt={product.name || 'Producto'}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-center group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
          />
          
          {/* Badge de descuento */}
          {discountPercentage > 0 && (
            <div className="absolute top-2 left-2 z-10">
              <Badge variant="error" size="md" className="font-bold">
                -{discountPercentage}%
              </Badge>
            </div>
          )}

          {/* Botón de Wishlist (corazón) */}
          <button
            onClick={handleToggleWishlist}
            disabled={isAddingToWishlist}
            className={`absolute top-2 right-2 z-10 p-2 rounded-full transition-all duration-200 ${
              isProductInWishlist
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
            } shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={isProductInWishlist ? 'Eliminar de lista de deseos' : 'Agregar a lista de deseos'}
          >
            <Heart
              className={`w-5 h-5 transition-all ${isProductInWishlist ? 'fill-current' : ''}`}
            />
          </button>

          {/* Botones de Quick View y Comparar en hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex flex-col items-center justify-center gap-2 px-4">
            <Button
              size="sm"
              variant="secondary"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white hover:bg-gray-50 shadow-lg w-full max-w-[180px]"
              onClick={handleQuickView}
              aria-label="Vista rápida del producto"
            >
              <svg 
                className="w-4 h-4 flex-shrink-0" 
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
              <span className="ml-2 text-sm">Vista rápida</span>
            </Button>
            
            <Button
              size="sm"
              variant={isInComparison ? 'primary' : 'secondary'}
              className={`opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg w-full max-w-[180px] ${
                isInComparison 
                  ? 'bg-primary-600 hover:bg-primary-700 text-white' 
                  : 'bg-white hover:bg-gray-50 text-gray-900'
              }`}
              onClick={handleAddToCompare}
              aria-label={isInComparison ? 'Ya en comparación' : 'Agregar a comparación'}
            >
              <svg 
                className="w-4 h-4 flex-shrink-0" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                />
              </svg>
              <span className="ml-2 text-sm">{isInComparison ? 'En comparación' : 'Comparar'}</span>
            </Button>
          </div>
        </div>
        
        {/* Contenido de la tarjeta */}
        <div className="p-4 space-y-3">
          {/* Nombre del producto (2 líneas max) */}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 min-h-[2.5rem] group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
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
              <div className="text-sm text-gray-500 dark:text-gray-400 line-through">
                {formatPrice(originalPrice)}
              </div>
            )}
            
            {/* Precio final */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatPrice(product.our_price)}
              </span>
              {discountPercentage > 0 && (
                <span className="text-sm text-green-600 dark:text-green-400 font-semibold">
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

      {/* Modal de Quick View */}
      {showQuickView && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowQuickView(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-view-title"
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="document"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 id="quick-view-title" className="text-2xl font-bold text-gray-900 dark:text-gray-100">Vista rápida</h2>
                <button
                  onClick={() => setShowQuickView(false)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Cerrar vista rápida del producto"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Contenido */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Imagen */}
                <div className="aspect-square bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                  <Image
                    src={mainImage}
                    alt={product.name || 'Producto'}
                    width={500}
                    height={500}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
                  />
                </div>

                {/* Información */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{product.name}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{product.description || 'Sin descripción disponible'}</p>
                  
                  {/* Rating */}
                  {product.rating !== undefined && product.rating > 0 && (
                    <div className="flex items-center">
                      <Rating 
                        value={product.rating} 
                        size="md" 
                        readOnly 
                        showValue
                        reviewCount={product.review_count}
                      />
                    </div>
                  )}

                  {/* Precio */}
                  <div className="space-y-1">
                    {originalPrice && discountPercentage > 0 && (
                      <div className="text-lg text-gray-500 dark:text-gray-400 line-through">
                        {formatPrice(originalPrice)}
                      </div>
                    )}
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {formatPrice(product.our_price)}
                    </div>
                    {discountPercentage > 0 && (
                      <Badge variant="error" size="md" className="font-bold">
                        -{discountPercentage}% de descuento
                      </Badge>
                    )}
                  </div>

                  {/* Estado */}
                  <div className="flex items-center gap-2">
                    {product.is_active && bestProvider ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full" aria-hidden="true"></div>
                        <span className="text-sm text-green-600 font-medium">En stock</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-red-500 rounded-full" aria-hidden="true"></div>
                        <span className="text-sm text-red-600 font-medium">No disponible</span>
                      </>
                    )}
                  </div>

                  {/* Botones */}
                  <div className="space-y-3 pt-4">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full"
                      onClick={(e) => {
                        handleAddToCart(e)
                        setShowQuickView(false)
                      }}
                      disabled={!product.is_active || !bestProvider || isAddingToCart}
                      loading={isAddingToCart}
                    >
                      Agregar al carrito
                    </Button>
                    <Link href={`/productos/${productId}`} className="block">
                      <Button
                        variant="secondary"
                        size="lg"
                        className="w-full"
                      >
                        Ver detalles completos
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
