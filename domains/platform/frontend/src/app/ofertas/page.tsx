import { Suspense } from 'react'
import { Header, Footer } from '@/layout'
import { Metadata } from 'next'
import OfertasClient from './OfertasClient'

/**
 * Metadata estática para SEO
 */
export const metadata: Metadata = {
  title: 'Ofertas Especiales | TechNovaStore',
  description: 'Descubre nuestras ofertas especiales en productos de tecnología e informática. Los mejores precios en productos seleccionados.',
  openGraph: {
    title: 'Ofertas Especiales | TechNovaStore',
    description: 'Los mejores precios en productos de tecnología',
    type: 'website',
  },
}

/**
 * Configuración de revalidación para ISR
 * Las ofertas se regeneran cada 30 segundos para mostrar precios actualizados
 */
export const revalidate = 30

/**
 * Configuración de generación
 * 'force-dynamic' asegura que siempre se ejecute en el servidor
 * para obtener las ofertas más recientes
 */
export const dynamic = 'force-dynamic'

/**
 * Página de ofertas con optimizaciones de Next.js
 * 
 * Optimizaciones implementadas:
 * 1. Server-Side Rendering (SSR): Renderiza en el servidor
 * 2. ISR (revalidate: 30): Regenera cada 30 segundos
 * 3. Metadata estática para SEO
 * 4. Suspense para carga progresiva
 */
export default function OfertasPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      {/* Hero Section - pt-[72px] compensa el header fixed */}
      <section className="bg-gradient-to-r from-red-600 to-orange-600 text-white pt-[72px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              🔥 Ofertas Especiales
            </h1>
            <p className="text-xl text-red-100">
              Los mejores precios en productos seleccionados
            </p>
          </div>
        </div>
      </section>

      {/* Ofertas Grid */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Suspense fallback={
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        }>
          <OfertasClient />
        </Suspense>
      </div>
      
      <Footer />
    </div>
  )
}
