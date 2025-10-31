'use client'

import { useState } from 'react'
import { Product } from '@/types'
import { Button } from '@/components/ui'
import { PriceComparator, ProductGallery, ProductSpecs } from './index'

interface ProductDetailProps {
  product: Product
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [showComparator, setShowComparator] = useState(false)

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

  const handleAddToCart = () => {
    // TODO: Implement add to cart functionality
  }

  const handleBuyNow = () => {
    // TODO: Implement buy now functionality
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Product Images */}
        <div>
          <ProductGallery images={product.images} productName={product.name} />
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500">
            <span>Inicio</span>
            <span className="mx-2">/</span>
            <span>{product.category}</span>
            {product.subcategory && (
              <>
                <span className="mx-2">/</span>
                <span>{product.subcategory}</span>
              </>
            )}
          </nav>

          {/* Product Title */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>
            {product.brand && (
              <p className="text-lg text-gray-600">por {product.brand}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">SKU: {product.sku}</p>
          </div>

          {/* Price Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(product.our_price)}
                </span>
                {savings && (
                  <div className="text-sm text-green-600 font-medium mt-1">
                    Ahorras {formatPrice(savings)} vs. compra directa
                  </div>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowComparator(!showComparator)}
              >
                {showComparator ? 'Ocultar' : 'Comparar'} precios
              </Button>
            </div>

            {/* Availability */}
            <div className="flex items-center mb-4">
              {product.is_active && bestProvider ? (
                <div className="flex items-center text-green-600">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="font-medium">En stock</span>
                  {bestProvider.delivery_time && (
                    <span className="text-gray-600 ml-2">
                      • Entrega en {bestProvider.delivery_time} días
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="font-medium">No disponible</span>
                </div>
              )}
            </div>

            {/* Quantity Selector */}
            {product.is_active && bestProvider && (
              <div className="flex items-center space-x-4 mb-6">
                <label className="text-sm font-medium text-gray-700">
                  Cantidad:
                </label>
                <select
                  value={selectedQuantity}
                  onChange={(e) => setSelectedQuantity(parseInt(e.target.value))}
                  className="rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
                {selectedQuantity > 1 && (
                  <span className="text-sm text-gray-600">
                    Total: {formatPrice(totalPrice)}
                  </span>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {product.is_active && bestProvider ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleAddToCart}
                  variant="secondary"
                  className="flex-1"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                  </svg>
                  Añadir al carrito
                </Button>
                <Button
                  onClick={handleBuyNow}
                  className="flex-1"
                >
                  Comprar ahora
                </Button>
              </div>
            ) : (
              <Button disabled className="w-full">
                Producto no disponible
              </Button>
            )}
          </div>

          {/* Provider Info */}
          {bestProvider && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">
                Información del proveedor
              </h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p>Proveedor: {bestProvider.name}</p>
                <p>Precio base: {formatPrice(bestProvider.price)}</p>
                {bestProvider.shipping_cost > 0 && (
                  <p>Envío: {formatPrice(bestProvider.shipping_cost)}</p>
                )}
                <p>Tiempo de entrega: {bestProvider.delivery_time} días</p>
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

      {/* Product Description and Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Description */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Descripción del producto
          </h2>
          <div className="prose prose-sm max-w-none text-gray-700">
            {product.description ? (
              <p>{product.description}</p>
            ) : (
              <p>Descripción no disponible para este producto.</p>
            )}
          </div>
        </div>

        {/* Specifications */}
        <div>
          <ProductSpecs specifications={product.specifications} />
        </div>
      </div>
    </div>
  )
}