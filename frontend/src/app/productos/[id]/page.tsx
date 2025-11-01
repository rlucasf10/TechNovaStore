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

// Deshabilitar generación estática para esta ruta dinámica
export const dynamicParams = true

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

// Generar parámetros estáticos vacíos para permitir rutas dinámicas en export
export async function generateStaticParams() {
  // Retornar array vacío para permitir todas las rutas dinámicas
  // Las páginas se renderizarán en el cliente
  return []
}