'use client'

import { useEffect } from 'react'
import { useProduct } from '@/catalog'
import { ProductDetail } from '@/catalog'
import { Loading } from '@/ui'
import { notFound } from 'next/navigation'
import { recommenderService } from '@/shared/services/recommenderService'

interface ProductDetailClientProps {
  productId: string
}

/**
 * Componente cliente para el detalle del producto
 * Separado del Server Component para mantener la interactividad
 * mientras se aprovechan las optimizaciones de Next.js
 */
export default function ProductDetailClient({ productId }: ProductDetailClientProps) {
  const { data: product, isLoading, error } = useProduct(productId)

  // Registrar interacción de vista cuando se carga el producto
  // Usamos el SKU porque el recommender-service trabaja con SKUs
  useEffect(() => {
    if (product?.sku) {
      recommenderService.recordInteraction(product.sku, 'view')
    }
  }, [product?.sku])

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Loading />
      </div>
    )
  }

  if (error || !product) {
    notFound()
  }

  return <ProductDetail product={product} />
}
