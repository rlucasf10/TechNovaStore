import { Suspense } from 'react'
import { Header, Footer } from '@/layout'
import { 
  HeroSection, 
  PromoBanner,
  TrustBadges,
  CampaignCountdown,
  FeaturedCategories,
  DealsSection,
  ProductRecommenderWidget,
  NewsletterSignup,
} from '@/shared/components/home'
import { Metadata } from 'next'
import { OrganizationStructuredData, WebsiteStructuredData } from '@/shared/components/seo/StructuredData'

/**
 * Metadata estática para SEO de la página principal
 */
export const metadata: Metadata = {
  title: 'TechNovaStore | Tu tienda de tecnología e informática',
  description: 'Descubre las mejores ofertas en tecnología e informática. Laptops, componentes, periféricos y más con envío rápido y los mejores precios del mercado.',
  keywords: ['tecnología', 'informática', 'laptops', 'componentes', 'periféricos', 'ofertas', 'tienda online'],
  openGraph: {
    title: 'TechNovaStore | Tu tienda de tecnología e informática',
    description: 'Las mejores ofertas en tecnología con envío rápido',
    type: 'website',
    locale: 'es_ES',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TechNovaStore',
    description: 'Tu tienda de tecnología e informática',
  },
  alternates: {
    canonical: '/',
  },
}

/**
 * Configuración de revalidación para ISR
 * La página principal se regenera cada 60 segundos para mostrar ofertas actualizadas
 */
export const revalidate = 60

/**
 * Configuración de generación
 * 'auto' permite que Next.js decida la mejor estrategia
 * En este caso, usará Static Generation con ISR
 */
export const dynamicParams = true

/**
 * Componente de skeleton loader para secciones
 * Mejora la percepción de carga y evita CLS (Cumulative Layout Shift)
 */
function SectionSkeleton({ height = 'h-96' }: { height?: string }) {
  return (
    <div className={`${height} bg-gray-100 dark:bg-slate-800 animate-pulse`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center">
        <div className="text-gray-400 dark:text-gray-500">Cargando...</div>
      </div>
    </div>
  )
}

/**
 * Página de inicio de TechNovaStore
 * 
 * Optimizada para Core Web Vitals:
 * - FCP (First Contentful Paint): Hero section carga inmediatamente
 * - LCP (Largest Contentful Paint): Imagen del hero optimizada
 * - CLS (Cumulative Layout Shift): Skeletons previenen saltos de layout
 * - FID (First Input Delay): Lazy loading reduce el bundle inicial
 * - TTI (Time to Interactive): Componentes pesados se cargan bajo demanda
 */
export default function HomePage() {
  return (
    <>
      {/* Structured Data para SEO */}
      <OrganizationStructuredData />
      <WebsiteStructuredData />
      
      {/* Countdown para próxima campaña (si aplica) - Carga inmediata */}
      <CampaignCountdown />
    
      {/* Banner promocional superior - Dinámico - Carga inmediata */}
      <PromoBanner />
      
      {/* Header - Navegación principal - Landmark */}
      <Header />

      {/* Contenido principal de la página */}
      <main className="min-h-screen">
        {/* Hero Section - Carga inmediata (Above the fold) */}
        {/* Optimizado para LCP - Imagen principal de la página */}
        <HeroSection
          useDynamicCampaign={true}
          ctaLink="/productos"
          backgroundImage="/images/hero-tech-background.svg"
        />

        {/* Badges de confianza - Carga inmediata (Above the fold) */}
        <TrustBadges />

        {/* Categorías destacadas - Lazy loading (Below the fold) */}
        <Suspense fallback={<SectionSkeleton height="h-80" />}>
          <FeaturedCategories />
        </Suspense>

        {/* Ofertas del día - Lazy loading (Below the fold) */}
        <Suspense fallback={<SectionSkeleton height="h-96" />}>
          <DealsSection />
        </Suspense>

        {/* Productos recomendados - Lazy loading (Below the fold) */}
        <Suspense fallback={<SectionSkeleton height="h-[600px]" />}>
          <ProductRecommenderWidget
            limit={8}
            title="Recomendado para ti"
          />
        </Suspense>

        {/* Sección de valor agregado - Inline para evitar lazy loading innecesario */}
        <section className="py-16 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-slate-800 dark:to-slate-900" aria-labelledby="benefits-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="text-center mb-12">
              <h2 id="benefits-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                ¿Por qué elegir TechNovaStore?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Somos tu tienda de confianza en tecnología
              </p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Entrega Express */}
              <article className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg 
                    className="w-8 h-8 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-center text-gray-900 dark:text-gray-100">Entrega Express</h3>
                <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                  Recibe tus productos en 24-48 horas con nuestro sistema de envío optimizado. Envío gratis en pedidos superiores a 50€.
                </p>
              </article>
              
              {/* Mejor Precio Garantizado */}
              <article className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-br from-green-500 to-green-600 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg 
                    className="w-8 h-8 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-center text-gray-900 dark:text-gray-100">Mejor Precio Garantizado</h3>
                <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                  Comparamos precios automáticamente con los principales proveedores para ofrecerte siempre las mejores ofertas del mercado.
                </p>
              </article>
              
              {/* Soporte Experto 24/7 */}
              <article className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg 
                    className="w-8 h-8 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-center text-gray-900 dark:text-gray-100">Soporte Experto 24/7</h3>
                <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                  Nuestro equipo de expertos y chatbot inteligente están disponibles las 24 horas para ayudarte con cualquier consulta técnica.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Newsletter Signup - Lazy loading (Final de la página) */}
        <Suspense fallback={<SectionSkeleton height="h-96" />}>
          <NewsletterSignup />
        </Suspense>
      </main>

      {/* Footer - Navegación secundaria y información - Landmark */}
      <Footer />
    </>
  )
}