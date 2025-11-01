import { ProductPageClient } from './ProductPageClient'
import { use } from 'react'

interface ProductPageProps {
  params: Promise<{
    id: string
  }>
}

// Generar parámetros estáticos vacíos para permitir rutas dinámicas en export
export async function generateStaticParams() {
  // Retornar array vacío - las páginas se renderizarán en el cliente
  return []
}

export default function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = use(params)
  return <ProductPageClient id={resolvedParams.id} />
}