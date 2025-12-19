'use client'

import { ProductCard } from '@/catalog'
import { useProducts } from '@/catalog'

/**
 * Componente cliente para mostrar las ofertas
 * Separado del Server Component para mantener la interactividad
 */
export default function OfertasClient() {
  const { data: response, isLoading } = useProducts()
  
  // Extraer productos del response paginado
  const products = response?.data || []
  
  // Filtrar productos con descuento o precio especial
  const ofertas = products.filter((product: any) => {
    // Verificar si hay proveedores con precios más altos que nuestro precio
    const minProviderPrice = product.providers.length > 0 
      ? Math.min(...product.providers.map((p: any) => p.price))
      : product.our_price
    const hasDiscount = product.our_price < minProviderPrice
    return hasDiscount
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
            <div className="h-48 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (ofertas.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay ofertas disponibles
        </h3>
        <p className="text-gray-500 mb-6">
          Vuelve pronto para ver nuestras próximas ofertas especiales
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <p className="text-gray-600">
          Mostrando <span className="font-semibold">{ofertas.length}</span> ofertas disponibles
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {ofertas.map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  )
}
