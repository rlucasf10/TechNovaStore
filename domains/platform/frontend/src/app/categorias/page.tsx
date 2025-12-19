import { Suspense } from 'react'
import { Header, Footer } from '@/layout'
import { Metadata } from 'next'
import CategoriasClient from './CategoriasClient'

/**
 * Metadata estática para SEO
 */
export const metadata: Metadata = {
  title: 'Categorías de Productos | TechNovaStore',
  description: 'Explora todas nuestras categorías de productos de tecnología e informática. Encuentra lo que necesitas organizado por categorías.',
  openGraph: {
    title: 'Categorías de Productos | TechNovaStore',
    description: 'Explora todas nuestras categorías de tecnología',
    type: 'website',
  },
}

/**
 * Configuración de revalidación para ISR
 * Las categorías se regeneran cada 300 segundos (5 minutos)
 * ya que no cambian con frecuencia
 */
export const revalidate = 300

/**
 * Configuración de generación
 * 'auto' permite Static Generation con ISR
 */
export const dynamic = 'auto'

/**
 * Página de categorías con optimizaciones de Next.js
 * 
 * Optimizaciones implementadas:
 * 1. Static Generation con ISR (revalidate: 300)
 * 2. Metadata estática para SEO
 * 3. Suspense para carga progresiva
 * 4. Server Component para reducir JavaScript
 */
export default function CategoriasPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-[88px]">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Categorías</h1>
        
        <Suspense fallback={
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-32 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        }>
          <CategoriasClient />
        </Suspense>
      </div>
      
      <Footer />
    </div>
  )
}
