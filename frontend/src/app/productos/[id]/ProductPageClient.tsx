'use client'

import { useProduct } from '@/hooks/useProducts'
import { ProductDetail } from '@/components/products'
import { Loading } from '@/components/ui'
import { notFound } from 'next/navigation'

interface ProductPageClientProps {
  id: string
}

export function ProductPageClient({ id }: ProductPageClientProps) {
  const { data: product, isLoading, error } = useProduct(id)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Loading />
      </div>
    )
  }

  if (error || !product) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProductDetail product={product} />
    </div>
  )
}
