import { Suspense } from 'react'
import { Header, Footer } from '@/layout'
import { Loading } from '@/ui'
import { Metadata } from 'next'
import ProductDetailClient from './ProductDetailClient'

interface ProductPageProps {
  params: Promise<{
    id: string
  }>
}

/**
 * Genera metadata dinámica para SEO
 * Next.js ejecuta esto en el servidor para optimizar SEO
 */
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const productId = resolvedParams.id
  
  try {
    // Fetch del producto en el servidor para metadata
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
    const response = await fetch(`${apiUrl}/products/${productId}`, {
      // Revalidar cada 60 segundos (ISR)
      next: { revalidate: 60 }
    })
    
    if (!response.ok) {
      return {
        title: 'Producto no encontrado | TechNovaStore',
        description: 'El producto que buscas no está disponible'
      }
    }
    
    const product = await response.json()
    
    return {
      title: `${product.name} | TechNovaStore`,
      description: product.description?.substring(0, 160) || `Compra ${product.name} al mejor precio`,
      openGraph: {
        title: product.name,
        description: product.description,
        images: product.images?.map((img: string) => ({
          url: img,
          alt: product.name
        })) || [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description: product.description,
        images: product.images?.[0] ? [product.images[0]] : [],
      },
    }
  } catch (error) {
    console.error('Error generando metadata:', error)
    return {
      title: 'Producto | TechNovaStore',
      description: 'Descubre nuestros productos de tecnología'
    }
  }
}

/**
 * Genera parámetros estáticos para las rutas más populares
 * Next.js pre-renderiza estas páginas en build time (SSG)
 * 
 * Estrategia: Pre-renderizar los 20 productos más populares
 * El resto se generará bajo demanda con ISR
 */
export async function generateStaticParams() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
    
    // Obtener los productos más populares para pre-renderizar
    const response = await fetch(`${apiUrl}/products?limit=20&sort=popularity`, {
      // No cachear en build time para obtener datos frescos
      cache: 'no-store'
    })
    
    if (!response.ok) {
      console.warn('No se pudieron obtener productos para generateStaticParams')
      return []
    }
    
    const data = await response.json()
    const products = data.products || []
    
    // Retornar array de params para pre-renderizar
    return products.map((product: any) => ({
      id: product._id || product.id,
    }))
  } catch (error) {
    console.error('Error en generateStaticParams:', error)
    // Retornar array vacío si falla - Next.js generará páginas bajo demanda
    return []
  }
}

/**
 * Configuración de revalidación para ISR (Incremental Static Regeneration)
 * Las páginas se regeneran cada 60 segundos si hay tráfico
 */
export const revalidate = 60

/**
 * Configuración de generación dinámica
 * 'force-static' intenta generar estáticamente cuando sea posible
 * 'error' lanza error si no puede ser estático (útil para debugging)
 * 'auto' (default) decide automáticamente
 */
export const dynamic = 'auto'

/**
 * Página de detalle de producto con optimizaciones de Next.js
 * 
 * Optimizaciones implementadas:
 * 1. generateStaticParams: Pre-renderiza productos populares (SSG)
 * 2. generateMetadata: SEO dinámico en el servidor
 * 3. ISR (revalidate: 60): Regenera páginas cada 60 segundos
 * 4. Suspense: Carga progresiva del contenido
 * 5. Server Component: Reduce JavaScript en el cliente
 */
export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      <Header />
      {/* Contenido principal con rol y etiqueta ARIA */}
      <main 
        role="main" 
        aria-label="Detalle del producto"
        className="flex-1 pt-[72px]"
      >
        <Suspense fallback={
          <div 
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
            role="status"
            aria-live="polite"
            aria-label="Cargando información del producto"
          >
            <Loading />
            <span className="sr-only">Cargando detalles del producto, por favor espere...</span>
          </div>
        }>
          {/* Componente cliente para interactividad */}
          <ProductDetailClient productId={resolvedParams.id} />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}