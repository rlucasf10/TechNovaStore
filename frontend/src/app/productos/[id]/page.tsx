'use client'

import { useProduct } from '@/hooks/useProducts'
import { ProductDetail } from '@/components/products'
import { Loading } from '@/components/ui'
import { Header, Footer } from '@/components/layout'
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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1">
          <Loading />
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !product) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1">
        <ProductDetail product={product} />
      </div>
      <Footer />
    </div>
  )
}