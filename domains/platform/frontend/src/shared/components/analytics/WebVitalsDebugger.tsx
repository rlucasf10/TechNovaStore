/**
 * WebVitalsDebugger Component
 * 
 * Componente de desarrollo que muestra las métricas de Web Vitals
 * en tiempo real en la esquina de la pantalla.
 * 
 * Solo se muestra en modo desarrollo.
 */

'use client'

import { useEffect, useState } from 'react'
import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals'

interface MetricState {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
}

/**
 * Determina la clasificación de una métrica
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<string, { good: number; poor: number }> = {
    CLS: { good: 0.1, poor: 0.25 },
    FID: { good: 100, poor: 300 },
    FCP: { good: 1800, poor: 3000 },
    LCP: { good: 2500, poor: 4000 },
    TTFB: { good: 800, poor: 1800 },
    INP: { good: 200, poor: 500 },
  }

  const threshold = thresholds[name]
  if (!threshold) return 'good'

  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

/**
 * Formatea el valor de la métrica para mostrar
 */
function formatValue(name: string, value: number): string {
  if (name === 'CLS') {
    return value.toFixed(3)
  }
  return Math.round(value).toString()
}

/**
 * Obtiene el color según la clasificación
 */
function getRatingColor(rating: 'good' | 'needs-improvement' | 'poor'): string {
  switch (rating) {
    case 'good':
      return 'bg-green-500'
    case 'needs-improvement':
      return 'bg-yellow-500'
    case 'poor':
      return 'bg-red-500'
  }
}

/**
 * Componente debugger de Web Vitals
 * Solo visible en desarrollo
 */
export function WebVitalsDebugger() {
  const [metrics, setMetrics] = useState<Record<string, MetricState>>({})
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Solo mostrar en desarrollo
    if (process.env.NODE_ENV !== 'development') {
      return
    }

    const handleMetric = (metric: Metric) => {
      setMetrics((prev) => ({
        ...prev,
        [metric.name]: {
          name: metric.name,
          value: metric.value,
          rating: getRating(metric.name, metric.value),
        },
      }))
    }

    // Suscribirse a todas las métricas
    onCLS(handleMetric)
    onFID(handleMetric)
    onFCP(handleMetric)
    onLCP(handleMetric)
    onTTFB(handleMetric)
    onINP(handleMetric)

    // Mostrar el debugger después de un pequeño delay
    const timer = setTimeout(() => setIsVisible(true), 1000)

    return () => clearTimeout(timer)
  }, [])

  // No renderizar en producción
  if (process.env.NODE_ENV !== 'development' || !isVisible) {
    return null
  }

  const metricsList = Object.values(metrics)

  if (metricsList.length === 0) {
    return null
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] bg-gray-900 text-white rounded-lg shadow-2xl p-4 max-w-xs"
      role="complementary"
      aria-label="Web Vitals Debugger"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Web Vitals</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Cerrar debugger"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="space-y-2">
        {metricsList.map((metric) => (
          <div
            key={metric.name}
            className="flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${getRatingColor(metric.rating)}`}
                aria-label={`Rating: ${metric.rating}`}
              />
              <span className="font-mono font-medium">{metric.name}</span>
            </div>
            <span className="font-mono text-gray-300">
              {formatValue(metric.name, metric.value)}
              {metric.name === 'CLS' ? '' : 'ms'}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-400">Good</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-gray-400">Needs Improvement</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-gray-400">Poor</span>
          </div>
        </div>
      </div>
    </div>
  )
}
