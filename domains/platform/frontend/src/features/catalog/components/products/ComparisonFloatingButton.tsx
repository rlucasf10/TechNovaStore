'use client'

import { useState, useEffect, useRef } from 'react'
import { useComparisonStore } from '@/store/comparison.store'
import { Button } from '@/ui'

/**
 * Botón flotante para acceder al comparador técnico
 * Solo se muestra cuando hay productos en la comparación
 * Se oculta automáticamente después de 10 segundos de inactividad
 */
export function ComparisonFloatingButton() {
  const { products, openModal, lastInteraction } = useComparisonStore()
  const [isVisible, setIsVisible] = useState(true)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Resetear el timer de ocultación
  const resetHideTimer = () => {
    setIsVisible(true)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setIsVisible(false)
    }, 3000) // 3 segundos
  }

  // Iniciar el timer cuando hay productos o hay interacción
  useEffect(() => {
    if (products.length > 0) {
      resetHideTimer()
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [products.length, lastInteraction])

  // Manejar hover
  const handleMouseEnter = () => {
    resetHideTimer()
  }

  // Manejar click
  const handleClick = () => {
    resetHideTimer()
    openModal()
  }

  // Ocultar completamente si no hay productos
  const shouldRender = products.length > 0

  return (
    <div 
      className={`fixed bottom-24 right-6 z-40 transition-all duration-500 ${
        shouldRender && isVisible 
          ? 'opacity-100 translate-x-0' 
          : 'opacity-0 translate-x-20 pointer-events-none'
      }`}
      onMouseEnter={handleMouseEnter}
    >
      <Button
        variant="primary"
        size="sm"
        onClick={handleClick}
        className="shadow-xl hover:shadow-2xl transition-all duration-300 relative group"
        aria-label={`Abrir comparador con ${products.length} productos`}
      >
        {/* Badge con contador */}
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md group-hover:scale-110 transition-transform">
          {products.length}
        </div>

        {/* Icono de comparación */}
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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
          />
        </svg>
        <span className="ml-1.5 text-sm font-medium">Comparar</span>
      </Button>
    </div>
  )
}
