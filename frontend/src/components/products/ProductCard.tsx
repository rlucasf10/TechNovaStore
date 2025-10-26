'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/types'
import { Button } from '@/components/ui'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const mainImage = product.images?.[0] || '/placeholder-product.jpg'
  const bestProvider = product.providers
    ?.filter(p => p.availability)
    ?.sort((a, b) => (a.price + a.shipping_cost) - (b.price + b.shipping_cost))[0]

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const calculateSavings = () => {
    if (!bestProvider) return null
    const providerTotal = bestProvider.price + bestProvider.shipping_cost
    const savings = providerTotal - product.our_price
    return savings > 0 ? savings : null
  }

  const savings = calculateSavings()

  return (
    <div className="group relative bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <Link href={`/productos/${product.id}`}>
        <div className="aspect-square overflow-hidden rounded-t-lg bg-gray-100">
          <Image
            src={mainImage}
            alt={product.name}
            width={300}
            height={300}
            className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-200"
          />
        </div>
        
        <div className="p-4">
          {/* Category Badge */}
          <div className="mb-2">
            <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
              {product.category}
            </span>
          </div>

          {/* Product Name */}
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>

          {/* Brand */}
          {product.brand && (
            <p className="text-xs text-gray-500 mb-2">{product.brand}</p>
          )}

          {/* Price Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(product.our_price)}
              </span>
              {savings && (
                <span className="text-xs text-green-600 font-medium">
                  Ahorras {formatPrice(savings)}
                </span>
              )}
            </div>

            {/* Provider Info */}
            {bestProvider && (
              <div className="text-xs text-gray-500">
                <span>Desde {bestProvider.name}</span>
                {bestProvider.delivery_time && (
                  <span className="ml-2">• {bestProvider.delivery_time} días</span>
                )}
              </div>
            )}
          </div>

          {/* Availability Status */}
          <div className="mt-3">
            {product.is_active && bestProvider ? (
              <div className="flex items-center text-xs text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Disponible
              </div>
            ) : (
              <div className="flex items-center text-xs text-red-600">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                No disponible
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Quick Actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="flex flex-col space-y-1">
          <Button
            size="sm"
            variant="ghost"
            className="bg-white/90 hover:bg-white shadow-sm"
            onClick={(e) => {
              e.preventDefault()
              // TODO: Add to wishlist functionality
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            className="bg-white/90 hover:bg-white shadow-sm"
            onClick={(e) => {
              e.preventDefault()
              // TODO: Quick view functionality
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  )
}