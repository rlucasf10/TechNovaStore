/**
 * WebVitalsReporter Component
 * 
 * Componente cliente que inicializa el monitoreo de Web Vitals
 * en la aplicación. Se monta una sola vez en el layout raíz.
 */

'use client'

import { useEffect } from 'react'
import { reportWebVitals } from '@/lib/web-vitals'

/**
 * Componente que inicializa el monitoreo de Web Vitals
 * 
 * Este componente debe ser incluido una sola vez en el layout raíz
 * de la aplicación para monitorear las métricas de rendimiento.
 */
export function WebVitalsReporter() {
  useEffect(() => {
    // Inicializar el monitoreo de Web Vitals
    reportWebVitals()
  }, [])

  // Este componente no renderiza nada visible
  return null
}
