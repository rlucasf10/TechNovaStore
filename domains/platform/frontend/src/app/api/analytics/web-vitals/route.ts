/**
 * API Route para recibir métricas de Web Vitals
 * 
 * Este endpoint recibe las métricas de rendimiento del cliente
 * y las procesa para análisis y monitoreo.
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Interfaz para los datos de métricas recibidos
 */
interface WebVitalMetric {
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
 * POST /api/analytics/web-vitals
 * 
 * Recibe y procesa métricas de Web Vitals del cliente
 */
export async function POST(request: NextRequest) {
  try {
    const metric: WebVitalMetric = await request.json()

    // Validar que la métrica tenga los campos requeridos
    if (!metric.name || typeof metric.value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400 }
      )
    }

    // En desarrollo, solo logueamos
    if (process.env.NODE_ENV === 'development') {
      console.log('[Web Vitals API]', {
        name: metric.name,
        value: Math.round(metric.value),
        rating: metric.rating,
        url: metric.url,
      })
    }

    // TODO: En producción, aquí se enviarían las métricas a:
    // - Sistema de analytics (Google Analytics, Mixpanel, etc.)
    // - Sistema de monitoreo (Prometheus, Grafana, etc.)
    // - Base de datos para análisis histórico
    // - Sistema de alertas si las métricas están por debajo de umbrales
    
    // Ejemplo de integración con Google Analytics 4:
    // if (process.env.GA_MEASUREMENT_ID) {
    //   await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${process.env.GA_MEASUREMENT_ID}&api_secret=${process.env.GA_API_SECRET}`, {
    //     method: 'POST',
    //     body: JSON.stringify({
    //       client_id: metric.id,
    //       events: [{
    //         name: 'web_vitals',
    //         params: {
    //           metric_name: metric.name,
    //           metric_value: metric.value,
    //           metric_rating: metric.rating,
    //           page_path: new URL(metric.url).pathname,
    //         }
    //       }]
    //     })
    //   })
    // }

    // Ejemplo de integración con sistema de monitoreo propio:
    // if (process.env.MONITORING_ENDPOINT) {
    //   await fetch(process.env.MONITORING_ENDPOINT, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${process.env.MONITORING_API_KEY}`
    //     },
    //     body: JSON.stringify({
    //       metric: metric.name,
    //       value: metric.value,
    //       rating: metric.rating,
    //       timestamp: metric.timestamp,
    //       metadata: {
    //         url: metric.url,
    //         userAgent: metric.userAgent,
    //         navigationType: metric.navigationType,
    //       }
    //     })
    //   })
    // }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[Web Vitals API] Error processing metric:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/analytics/web-vitals
 * 
 * Endpoint de health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Web Vitals analytics endpoint is running',
  })
}
