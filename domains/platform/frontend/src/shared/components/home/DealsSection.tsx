'use client'

import { useEffect, useState } from 'react'
import { Product, Campaign } from '@/types'
import { ProductCard } from '@/catalog/components/products'
import { productService } from '@/catalog/services/product.service'
import { campaignService } from '@/shared/services'

/**
 * DealsSection - Sección de ofertas dinámica
 * 
 * Se adapta automáticamente según la campaña activa
 * Inspirado en PcComponentes
 */
export function DealsSection() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  
  // Valores por defecto si no hay campaña
  const title = campaign?.frontendConfig.dealsSection.title || '🔥 Ofertas Destacadas'
  const subtitle = campaign?.frontendConfig.dealsSection.subtitle || 'Los mejores precios en tecnología'
  const badge = campaign?.frontendConfig.dealsSection.badge || 'OFERTAS'
  const backgroundColor = campaign?.frontendConfig.dealsSection.backgroundColor || 'from-red-50 to-orange-50'

  useEffect(() => {
    // Cargar campaña activa (silencioso si no hay campaña)
    campaignService.getActiveCampaign()
      .then(setCampaign)
      .catch(() => {
        // Silenciar error: es normal que no haya campaña activa
        setCampaign(null)
      })
    
    loadDeals()
  }, [])

  // Countdown timer para campaña activa
  useEffect(() => {
    if (!campaign?.endDate) {
      setTimeLeft(null)
      return
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const end = new Date(campaign.endDate).getTime()
      const difference = end - now

      if (difference <= 0) {
        setTimeLeft(null)
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [campaign])

  /**
   * Cargar ofertas con retry logic y backoff exponencial
   * Maneja timeouts y errores de red gracefully
   */
  const loadDeals = async (maxRetries = 3) => {
    setIsLoading(true)
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Obtener productos con descuento
        const response = await productService.getProducts({
          limit: 8,
          sortBy: 'popularity',
          inStock: true,
          // Si la campaña tiene categorías específicas, filtrar por ellas
          ...(campaign?.frontendConfig.categories && { category: campaign.frontendConfig.categories })
        })
        
        const dealsProducts = response.data.slice(0, 8)
        setProducts(dealsProducts)
        setIsLoading(false)
        return // Éxito - salir del loop
      } catch (error) {
        // Si es el último intento, loguear y retornar array vacío
        if (attempt === maxRetries) {
          // ✅ SEGURIDAD: Loguear error de forma sanitizada sin exponer detalles técnicos
          // Solo loguear en desarrollo para debugging
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to load deals after retries:', {
              attempts: maxRetries,
              errorType: error instanceof Error ? error.name : 'Unknown',
            })
          }
          setProducts([]) // Array vacío - la sección se ocultará automáticamente
          setIsLoading(false)
          return
        }
        
        // Esperar antes de reintentar (backoff exponencial: 1s, 2s, 4s)
        const delay = 1000 * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  if (!isLoading && products.length === 0) {
    return null
  }

  return (
    <section className={`py-16 bg-gradient-to-br ${backgroundColor || 'from-red-50 to-orange-50'} dark:from-slate-900 dark:to-slate-800`} aria-labelledby="deals-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header con badge dinámico */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full text-sm font-bold mb-4 animate-pulse" role="status">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {badge}
          </div>
          <h2 id="deals-heading" className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {subtitle}
          </p>

          {/* Countdown Timer */}
          {timeLeft && (
            <div className="mt-6 inline-block">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border-2 border-red-500">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide">
                  ⏰ La oferta termina en:
                </p>
                <div className="flex items-center justify-center gap-3" role="timer" aria-live="polite" aria-atomic="true">
                  <CountdownUnit value={timeLeft.days} label="Días" />
                  <CountdownSeparator />
                  <CountdownUnit value={timeLeft.hours} label="Horas" />
                  <CountdownSeparator />
                  <CountdownUnit value={timeLeft.minutes} label="Min" />
                  <CountdownSeparator />
                  <CountdownUnit value={timeLeft.seconds} label="Seg" />
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Grid de productos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6" role="list" aria-label="Productos en oferta">
          {isLoading ? (
            <>
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </>
          ) : (
            <>
              {products.map((product) => (
                <div key={product.id} role="listitem">
                  <ProductCard
                    product={product}
                    viewMode="grid"
                  />
                </div>
              ))}
            </>
          )}
        </div>

        {/* CTA */}
        {!isLoading && products.length > 0 && (
          <div className="text-center mt-12">
            <a
              href="/ofertas"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Ver todas las ofertas
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </section>
  )
}

/**
 * Interfaz para el tiempo restante del countdown
 */
interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

/**
 * Componente para mostrar una unidad del countdown (días, horas, etc.)
 */
function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-gradient-to-br from-red-600 to-red-700 text-white rounded-lg px-4 py-3 min-w-[70px] shadow-md">
        <span className="text-3xl font-bold tabular-nums">
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-2 uppercase tracking-wider">
        {label}
      </span>
    </div>
  )
}

/**
 * Separador visual entre unidades del countdown
 */
function CountdownSeparator() {
  return (
    <div className="text-2xl font-bold text-red-600 pb-6">
      :
    </div>
  )
}

/**
 * Skeleton loader para ProductCard
 */
function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200 dark:bg-slate-700" />
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
        </div>
        <div className="flex items-center space-x-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-4 h-4 bg-gray-200 dark:bg-slate-700 rounded" />
          ))}
        </div>
        <div className="space-y-1">
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
        </div>
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
      </div>
      <div className="px-4 pb-4">
        <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded w-full" />
      </div>
    </div>
  )
}
