'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Product } from '@/types'
import { Button, Rating, Badge, Tabs } from '@/ui'
import { PriceComparator, ProductGallery, ProductReviews, ProductQA, RelatedProducts } from './index'
import { useCartStore } from '@/commerce'
import { useAuthStore } from '@/customer/store/auth.store'
import { useToast } from '@/hooks/useToast'
import { useComparisonStore } from '@/store/comparison.store'
import { ProductStructuredData, BreadcrumbStructuredData } from '@/shared/components/seo/StructuredData'

interface ProductDetailProps {
  product: Product
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [showComparator, setShowComparator] = useState(false)
  const addItem = useCartStore((state) => state.addItem)
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const toast = useToast()
  const { addProduct, products, canAddMore, openModal } = useComparisonStore()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const bestProvider = product.providers
    ?.filter(p => p.availability)
    ?.sort((a, b) => (a.price + a.shipping_cost) - (b.price + b.shipping_cost))[0]

  const calculateSavings = () => {
    if (!bestProvider) return null
    const providerTotal = bestProvider.price + bestProvider.shipping_cost
    const savings = providerTotal - product.our_price
    return savings > 0 ? savings : null
  }

  const savings = calculateSavings()
  const totalPrice = product.our_price * selectedQuantity

  // Calcular porcentaje de descuento
  const discountPercentage = product.discount_percentage || 
    (product.original_price && product.original_price > product.our_price
      ? Math.round(((product.original_price - product.our_price) / product.original_price) * 100)
      : 0)

  // Precio original (antes de descuento)
  const originalPrice = product.original_price || 
    (discountPercentage > 0 ? product.our_price / (1 - discountPercentage / 100) : null)

  const handleAddToCart = () => {
    try {
      // Convertir Product a CartItem format
      addItem({
        id: `cart-${product.id}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: product.our_price,
        image: product.images?.[0] || '/placeholder-product.svg',
        sku: product.sku,
        brand: product.brand,
        maxQuantity: 99,
      }, selectedQuantity)
      
      toast.success(
        `${selectedQuantity} ${selectedQuantity === 1 ? 'unidad agregada' : 'unidades agregadas'} al carrito`,
        'Producto agregado'
      )
    } catch (error) {
      console.error('Error al agregar al carrito:', error)
      toast.error(
        'No se pudo agregar el producto al carrito',
        'Error'
      )
    }
  }

  const handleBuyNow = () => {
    // Verificar si el usuario está autenticado
    if (!isAuthenticated) {
      // Guardar la URL actual para redirigir después del login
      const returnUrl = encodeURIComponent(window.location.pathname)
      router.push(`/login?returnUrl=${returnUrl}`)
      return
    }
    
    try {
      // Convertir Product a CartItem format
      addItem({
        id: `cart-${product.id}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: product.our_price,
        image: product.images?.[0] || '/placeholder-product.svg',
        sku: product.sku,
        brand: product.brand,
        maxQuantity: 99,
      }, selectedQuantity)
      
      // Redirigir al checkout
      router.push('/checkout')
    } catch (error) {
      console.error('Error al comprar:', error)
      toast.error(
        'No se pudo procesar la compra',
        'Error'
      )
    }
  }

  const handleQuantityChange = (change: number) => {
    const newQuantity = selectedQuantity + change
    if (newQuantity >= 1 && newQuantity <= 99) {
      setSelectedQuantity(newQuantity)
    }
  }

  const handleAddToCompare = () => {
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
      toast.info(
        'Este producto ya está en la comparación',
        'Ya agregado'
      )
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

  // Preparar datos para structured data
  const productUrl = typeof window !== 'undefined' ? window.location.href : `http://localhost:3020/productos/${product.id}`
  const breadcrumbItems = [
    { name: 'Inicio', url: 'http://localhost:3020/' },
    { name: 'Productos', url: 'http://localhost:3020/productos' },
    { name: product.category, url: `http://localhost:3020/productos?category=${encodeURIComponent(product.category)}` },
    { name: product.name, url: productUrl },
  ]

  return (
    <>
      {/* Structured Data para SEO */}
      <ProductStructuredData
        name={product.name}
        description={product.description || `${product.name} - ${product.brand || 'TechNovaStore'}`}
        images={product.images || []}
        sku={product.sku}
        brand={product.brand}
        price={product.our_price}
        currency="EUR"
        availability={product.is_active ? 'InStock' : 'OutOfStock'}
        url={productUrl}
        rating={product.rating}
        reviewCount={product.review_count}
      />
      <BreadcrumbStructuredData items={breadcrumbItems} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div>
            <ProductGallery images={product.images} productName={product.name} />
          </div>

        {/* Product Info - Sección de información principal */}
        <div className="space-y-6">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <a href="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Inicio
                </a>
              </li>
              <li>
                <span className="mx-2">/</span>
              </li>
              <li>
                <a href={`/productos?category=${encodeURIComponent(product.category)}`} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  {product.category}
                </a>
              </li>
              {product.subcategory && (
                <>
                  <li>
                    <span className="mx-2">/</span>
                  </li>
                  <li className="text-gray-900 dark:text-gray-100 font-medium">
                    {product.subcategory}
                  </li>
                </>
              )}
            </ol>
          </nav>

          {/* Nombre, Marca y SKU */}
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              {product.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {product.brand && (
                <div className="flex items-center">
                  <span className="text-gray-500 dark:text-gray-400">Marca:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">{product.brand}</span>
                </div>
              )}
              <div className="flex items-center">
                <span className="text-gray-500 dark:text-gray-400">SKU:</span>
                <span className="ml-1 font-mono text-gray-900 dark:text-gray-100">{product.sku}</span>
              </div>
            </div>
          </div>

          {/* Rating con Reviews */}
          {product.rating !== undefined && product.rating > 0 && (
            <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-slate-700">
              <Rating 
                value={product.rating} 
                size="lg" 
                readOnly 
                showValue
              />
              {product.review_count !== undefined && product.review_count > 0 && (
                <a 
                  href="#reviews" 
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                >
                  ({product.review_count} {product.review_count === 1 ? 'reseña' : 'reseñas'})
                </a>
              )}
            </div>
          )}

          {/* Precio con Descuento */}
          <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                {/* Precio original tachado si hay descuento */}
                {originalPrice && discountPercentage > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-lg text-gray-500 dark:text-gray-400 line-through">
                      {formatPrice(originalPrice)}
                    </span>
                    <Badge variant="error" size="md" className="font-bold">
                      -{discountPercentage}% OFF
                    </Badge>
                  </div>
                )}
                
                {/* Precio final */}
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                    {formatPrice(product.our_price)}
                  </span>
                </div>

                {/* Ahorro vs compra directa */}
                {savings && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-green-600 font-medium">
                      Ahorras {formatPrice(savings)} vs. compra directa
                    </span>
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComparator(!showComparator)}
                className="flex-shrink-0"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {showComparator ? 'Ocultar' : 'Comparar'} precios
              </Button>

              <Button
                variant={isInComparison ? 'primary' : 'ghost'}
                size="sm"
                onClick={handleAddToCompare}
                className="flex-shrink-0"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {isInComparison ? 'En comparación' : 'Comparar producto'}
              </Button>
            </div>

            {/* Disponibilidad en Stock */}
            <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
              {product.is_active && bestProvider ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" aria-hidden="true"></div>
                    <span className="text-lg font-semibold text-green-600 dark:text-green-400">En stock</span>
                  </div>
                  {bestProvider.delivery_time && (
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Entrega en {bestProvider.delivery_time} días</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" aria-hidden="true"></div>
                  <span className="text-lg font-semibold text-red-600 dark:text-red-400">No disponible</span>
                </div>
              )}
            </div>

            {/* Selector de Cantidad */}
            {product.is_active && bestProvider && (
              <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Cantidad:
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={selectedQuantity <= 1}
                      className="px-4 py-3 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-900 dark:text-gray-100"
                      aria-label="Disminuir cantidad"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <input
                      id="product-quantity"
                      name="product-quantity"
                      type="number"
                      min="1"
                      max="99"
                      value={selectedQuantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value)
                        if (!isNaN(value) && value >= 1 && value <= 99) {
                          setSelectedQuantity(value)
                        }
                      }}
                      className="w-16 text-center border-0 focus:ring-0 font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700"
                      aria-label="Cantidad"
                    />
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(1)}
                      disabled={selectedQuantity >= 99}
                      className="px-4 py-3 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-900 dark:text-gray-100"
                      aria-label="Aumentar cantidad"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  {selectedQuantity > 1 && (
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Total:</span>
                      <span className="ml-2 text-lg font-bold text-gray-900 dark:text-gray-100">
                        {formatPrice(totalPrice)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Botones "Agregar al Carrito" y "Comprar Ahora" */}
            <div className="pt-4">
              {product.is_active && bestProvider ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleAddToCart}
                    variant="secondary"
                    size="lg"
                    className="flex-1"
                    iconLeft={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    }
                  >
                    Agregar al Carrito
                  </Button>
                  <Button
                    onClick={handleBuyNow}
                    variant="primary"
                    size="lg"
                    className="flex-1"
                    iconLeft={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    }
                  >
                    Comprar Ahora
                  </Button>
                </div>
              ) : (
                <Button disabled size="lg" className="w-full">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Producto no disponible
                </Button>
              )}
            </div>
          </div>

          {/* Provider Info */}
          {bestProvider && (
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Información del proveedor
                  </h3>
                  <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <p><span className="font-medium">Proveedor:</span> {bestProvider.name}</p>
                    <p><span className="font-medium">Precio base:</span> {formatPrice(bestProvider.price)}</p>
                    {bestProvider.shipping_cost > 0 && (
                      <p><span className="font-medium">Envío:</span> {formatPrice(bestProvider.shipping_cost)}</p>
                    )}
                    <p><span className="font-medium">Tiempo de entrega:</span> {bestProvider.delivery_time} días hábiles</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Price Comparator */}
      {showComparator && (
        <div className="mb-12">
          <PriceComparator 
            providers={product.providers} 
            ourPrice={product.our_price}
          />
        </div>
      )}

      {/* Tabs de Contenido: Descripción, Especificaciones, Reviews */}
      <div className="mb-12">
        <Tabs
          tabs={[
            {
              id: 'description',
              label: 'Descripción',
              icon: (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              ),
              content: (
                <div className="prose prose-sm max-w-none text-gray-700">
                  {product.description ? (
                    <div>
                      <p className="text-base leading-relaxed">{product.description}</p>
                      
                      {/* Características destacadas si existen */}
                      {product.features && product.features.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">
                            Características destacadas
                          </h3>
                          <ul className="space-y-2">
                            {product.features.map((feature, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-gray-700">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500">Descripción no disponible para este producto.</p>
                    </div>
                  )}
                </div>
              )
            },
            {
              id: 'specifications',
              label: 'Especificaciones Técnicas',
              icon: (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              ),
              content: (
                <div>
                  {product.specifications && Object.keys(product.specifications).length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Object.entries(product.specifications).map(([key, value], index) => (
                            <tr key={key} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 w-1/3">
                                {key}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {String(value)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-gray-500">No hay especificaciones técnicas disponibles para este producto.</p>
                    </div>
                  )}
                </div>
              )
            },
            {
              id: 'reviews',
              label: `Reviews (${product.review_count || 0})`,
              icon: (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              ),
              content: (
                <ProductReviews
                  productId={product.id || (product as any)._id}
                  averageRating={product.rating || 0}
                  totalReviews={product.review_count || 0}
                />
              )
            }
          ]}
          defaultActiveTab="description"
          variant="underline"
        />
      </div>

      {/* Sección de Preguntas y Respuestas */}
      <div className="mb-12">
        <ProductQA product={product} />
      </div>

      {/* Sección de Productos Relacionados */}
      <div className="mb-12">
        <RelatedProducts 
          productId={product.id || (product as any)._id}
          limit={4}
          onAddToCart={handleAddToCart}
        />
      </div>
    </div>
    </>
  )
}