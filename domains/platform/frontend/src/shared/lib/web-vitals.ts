/**
 * Web Vitals - Monitoreo de métricas de rendimiento
 * 
 * Este módulo implementa el monitoreo de Core Web Vitals y otras métricas
 * de rendimiento importantes para la experiencia del usuario.
 * 
 * Métricas monitoreadas:
 * - CLS (Cumulative Layout Shift): Estabilidad visual
 * - FID (First Input Delay): Interactividad
 * - FCP (First Contentful Paint): Velocidad de carga percibida
 * - LCP (Largest Contentful Paint): Velocidad de carga
 * - TTFB (Time to First Byte): Tiempo de respuesta del servidor
 * - INP (Interaction to Next Paint): Responsividad de interacciones
 */

import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals'

/**
 * Interfaz para los datos de métricas que se envían al servidor
 */
interface MetricData {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  navigationType: string
  timestamp: number
  url: string
  userAgent: string
}

/**
 * Umbrales para clasificar las métricas según los estándares de Google
 */
const METRIC_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
} as const

/**
 * Determina la clasificación de una métrica basándose en su valor
 */
function getRating(
  name: string,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = METRIC_THRESHOLDS[name as keyof typeof METRIC_THRESHOLDS]
  if (!thresholds) return 'good'

  if (value <= thresholds.good) return 'good'
  if (value <= thresholds.poor) return 'needs-improvement'
  return 'poor'
}

/**
 * Envía las métricas al servidor para análisis
 */
async function sendToAnalytics(metric: MetricData): Promise<void> {
  try {
    // En desarrollo, solo logueamos en consola
    if (process.env.NODE_ENV === 'development') {
      console.log('[Web Vitals]', {
        name: metric.name,
        value: Math.round(metric.value),
        rating: metric.rating,
        url: metric.url,
      })
      return
    }

    // En producción, enviar al endpoint de analytics
    const body = JSON.stringify(metric)
    
    // Usar sendBeacon si está disponible (más confiable para eventos de salida)
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/web-vitals', body)
    } else {
      // Fallback a fetch
      fetch('/api/analytics/web-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true, // Mantener la solicitud viva incluso si la página se cierra
      }).catch((error) => {
        console.error('[Web Vitals] Error sending metrics:', error)
      })
    }
  } catch (error) {
    console.error('[Web Vitals] Error processing metric:', error)
  }
}

/**
 * Procesa una métrica de Web Vitals y la envía al servidor
 */
function handleMetric(metric: Metric): void {
  const metricData: MetricData = {
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  }

  sendToAnalytics(metricData)
}

/**
 * Inicializa el monitoreo de Web Vitals
 * 
 * Esta función debe ser llamada una vez cuando la aplicación se monta,
 * típicamente en el componente raíz o en _app.tsx
 */
export function reportWebVitals(): void {
  try {
    // Monitorear todas las métricas de Core Web Vitals
    onCLS(handleMetric)
    onFID(handleMetric)
    onFCP(handleMetric)
    onLCP(handleMetric)
    onTTFB(handleMetric)
    onINP(handleMetric)

    // Log de inicialización en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('[Web Vitals] Monitoring initialized')
    }
  } catch (error) {
    console.error('[Web Vitals] Error initializing monitoring:', error)
  }
}

/**
 * Hook personalizado para monitorear métricas de Web Vitals en componentes específicos
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   useWebVitals()
 *   return <div>...</div>
 * }
 * ```
 */
export function useWebVitals(): void {
  if (typeof window !== 'undefined') {
    reportWebVitals()
  }
}

/**
 * Obtiene un resumen del estado actual de las métricas
 * Útil para debugging y dashboards de desarrollo
 */
export async function getWebVitalsSnapshot(): Promise<{
  cls: number | null
  fid: number | null
  fcp: number | null
  lcp: number | null
  ttfb: number | null
  inp: number | null
}> {
  return new Promise((resolve) => {
    const snapshot = {
      cls: null as number | null,
      fid: null as number | null,
      fcp: null as number | null,
      lcp: null as number | null,
      ttfb: null as number | null,
      inp: null as number | null,
    }

    let metricsCollected = 0
    const totalMetrics = 6

    const collectMetric = (metric: Metric) => {
      snapshot[metric.name.toLowerCase() as keyof typeof snapshot] = metric.value
      metricsCollected++
      
      if (metricsCollected === totalMetrics) {
        resolve(snapshot)
      }
    }

    // Timeout para resolver incluso si no todas las métricas están disponibles
    setTimeout(() => resolve(snapshot), 3000)

    onCLS(collectMetric)
    onFID(collectMetric)
    onFCP(collectMetric)
    onLCP(collectMetric)
    onTTFB(collectMetric)
    onINP(collectMetric)
  })
}
