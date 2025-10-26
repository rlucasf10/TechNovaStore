'use client'

import { useProduct } from '@/hooks/useProducts'
import { ProductDetail } from '@/components/products'
import { Loading } from '@/components/ui'
import { notFound } from 'next/navigation'
import { use } from 'react'

interface ProductPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = use(params)
  const { data: product, isLoading, error } = useProduct(resolvedParams.id)

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