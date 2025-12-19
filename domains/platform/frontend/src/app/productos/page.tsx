import { Suspense } from 'react'
import nextDynamic from 'next/dynamic'
import { Header, Footer } from '@/layout'
import { Metadata } from 'next'

// Dynamic import para el catálogo de productos (componente pesado)
const ProductCatalog = nextDynamic(
  () => import('@/catalog').then(mod => ({ default: mod.ProductCatalog })),
  { ssr: true }
)

/**
 * Metadata estática para SEO
 */
export const metadata: Metadata = {
  title: 'Catálogo de Productos | TechNovaStore',
  description: 'Explora nuestro catálogo completo de productos de tecnología e informática. Encuentra laptops, componentes, periféricos y más al mejor precio.',
  openGraph: {
    title: 'Catálogo de Productos | TechNovaStore',
    description: 'Explora nuestro catálogo completo de productos de tecnología',
    type: 'website',
  },
}

/**
 * Configuración de revalidación para ISR
 * El catálogo se regenera cada 30 segundos para mostrar productos actualizados
 */
export const revalidate = 30

/**
 * Configuración de generación dinámica
 * 'force-dynamic' asegura que siempre se ejecute en el servidor
 * para obtener filtros y parámetros de búsqueda de la URL
 */
export const dynamic = 'force-dynamic'

/**
 * Página del catálogo de productos con optimizaciones de Next.js
 * 
 * Optimizaciones implementadas:
 * 1. Server-Side Rendering (SSR): Renderiza en el servidor para SEO
 * 2. ISR (revalidate: 30): Regenera cada 30 segundos
 * 3. Metadata estática: SEO optimizado
 * 4. Suspense: Carga progresiva del contenido
 * 5. Skeleton loading: Mejora la percepción de carga
 */
export default function ProductosPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      <Header />
      {/* Contenido principal con rol y etiqueta ARIA */}
      <main 
        role="main" 
        aria-label="Catálogo de productos"
        className="flex-1 pt-[72px]"
      >
        <Suspense fallback={
          <div 
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
            role="status"
            aria-live="polite"
            aria-label="Cargando catálogo de productos"
          >
            <div className="animate-pulse space-y-4">
              {/* Skeleton para breadcrumbs */}
              <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3" aria-hidden="true"></div>
              
              {/* Skeleton para título */}
              <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/4" aria-hidden="true"></div>
              
              {/* Skeleton para toolbar */}
              <div className="h-12 bg-gray-200 dark:bg-slate-700 rounded" aria-hidden="true"></div>
              
              {/* Skeleton para grid de productos */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8" aria-hidden="true">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 rounded-lg p-4 space-y-3 shadow-sm">
                    <div className="aspect-square bg-gray-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
                    <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
              {/* Texto accesible para lectores de pantalla */}
              <span className="sr-only">Cargando productos, por favor espere...</span>
            </div>
          </div>
        }>
          <ProductCatalog />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}