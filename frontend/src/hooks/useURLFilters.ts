import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

/**
 * Hook personalizado para sincronizar filtros con URL query params
 * 
 * Características:
 * - Sincroniza estado con URL automáticamente
 * - Permite compartir URLs con filtros aplicados
 * - Soporta navegación del navegador (back/forward)
 * - Actualiza URL sin recargar la página
 * 
 * @example
 * ```tsx
 * const { filters, updateFilters, clearFilters } = useURLFilters({
 *   category: '',
 *   search: '',
 *   sortBy: 'name'
 * })
 * ```
 */
export function useURLFilters<T extends Record<string, any>>(
  defaultFilters: T
): {
  filters: T
  updateFilters: (newFilters: Partial<T>) => void
  clearFilters: () => void
  setFiltersFromURL: () => void
} {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Función para parsear filtros desde URL
  const parseFiltersFromURL = (): T => {
    const urlFilters: any = { ...defaultFilters }

    searchParams.forEach((value, key) => {
      if (key in defaultFilters) {
        const defaultValue = defaultFilters[key]
        
        // Parsear según el tipo del valor por defecto
        if (typeof defaultValue === 'number') {
          urlFilters[key] = Number(value) || defaultValue
        } else if (typeof defaultValue === 'boolean') {
          urlFilters[key] = value === 'true'
        } else {
          urlFilters[key] = value
        }
      }
    })

    return urlFilters
  }

  const [filters, setFilters] = useState<T>(parseFiltersFromURL())

  // Función para actualizar URL con los filtros
  const updateURL = (newFilters: T) => {
    const params = new URLSearchParams()

    Object.entries(newFilters).forEach(([key, value]) => {
      const defaultValue = defaultFilters[key]
      
      // Solo agregar a URL si el valor es diferente al default
      if (value !== defaultValue && value !== '' && value !== 0 && value !== false) {
        params.set(key, String(value))
      }
    })

    const newURL = params.toString() ? `?${params.toString()}` : window.location.pathname
    router.push(newURL, { scroll: false })
  }

  // Actualizar filtros y URL
  const updateFilters = (newFilters: Partial<T>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    updateURL(updatedFilters)
  }

  // Limpiar todos los filtros
  const clearFilters = () => {
    setFilters(defaultFilters)
    updateURL(defaultFilters)
  }

  // Sincronizar con URL cuando cambia (navegación del navegador)
  const setFiltersFromURL = () => {
    const urlFilters = parseFiltersFromURL()
    setFilters(urlFilters)
  }

  // Escuchar cambios en la URL (back/forward del navegador)
  useEffect(() => {
    const handlePopState = () => {
      setFiltersFromURL()
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [searchParams])

  return {
    filters,
    updateFilters,
    clearFilters,
    setFiltersFromURL
  }
}
