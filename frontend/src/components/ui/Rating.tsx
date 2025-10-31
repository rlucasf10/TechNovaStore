'use client'

import { forwardRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface RatingProps {
  /** Valor del rating (0-5) */
  value: number
  /** Callback cuando el usuario cambia el rating (solo en modo interactivo) */
  onChange?: (value: number) => void
  /** Tamaño del componente */
  size?: 'sm' | 'md' | 'lg'
  /** Modo de solo lectura (no interactivo) */
  readOnly?: boolean
  /** Mostrar el valor numérico junto a las estrellas */
  showValue?: boolean
  /** Número total de reviews (opcional, se muestra junto al valor) */
  reviewCount?: number
  /** Clase CSS adicional */
  className?: string
  /** Precisión del rating (1 = enteros, 0.5 = medias estrellas, 0.1 = decimales) */
  precision?: 1 | 0.5 | 0.1
}

const Rating = forwardRef<HTMLDivElement, RatingProps>(
  ({ 
    value, 
    onChange, 
    size = 'md', 
    readOnly = false, 
    showValue = false,
    reviewCount,
    className,
    precision = 0.5,
    ...props 
  }, ref) => {
    const [hoverValue, setHoverValue] = useState<number | null>(null)
    const isInteractive = !readOnly && onChange !== undefined

    // Tamaños de las estrellas
    const sizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    }

    // Tamaños de texto para el valor
    const textSizes = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    }

    // Normalizar el valor entre 0 y 5
    const normalizedValue = Math.max(0, Math.min(5, value))
    const displayValue = hoverValue !== null ? hoverValue : normalizedValue

    // Calcular el porcentaje de llenado para cada estrella
    const getStarFillPercentage = (starIndex: number): number => {
      const starValue = starIndex + 1
      if (displayValue >= starValue) return 100
      if (displayValue < starIndex) return 0
      return (displayValue - starIndex) * 100
    }

    // Manejar click en una estrella
    const handleStarClick = (starIndex: number, event: React.MouseEvent<HTMLButtonElement>) => {
      if (!isInteractive) return

      // Calcular el valor basado en la posición del click dentro de la estrella
      const rect = event.currentTarget.getBoundingClientRect()
      const clickX = event.clientX - rect.left
      const starWidth = rect.width
      const clickPercentage = clickX / starWidth

      let newValue: number
      if (precision === 1) {
        // Solo valores enteros
        newValue = starIndex + 1
      } else if (precision === 0.5) {
        // Medias estrellas
        newValue = clickPercentage < 0.5 ? starIndex + 0.5 : starIndex + 1
      } else {
        // Precisión decimal
        newValue = starIndex + Math.round(clickPercentage * 10) / 10
      }

      onChange?.(newValue)
    }

    // Manejar hover sobre una estrella
    const handleStarHover = (starIndex: number, event: React.MouseEvent<HTMLButtonElement>) => {
      if (!isInteractive) return

      const rect = event.currentTarget.getBoundingClientRect()
      const hoverX = event.clientX - rect.left
      const starWidth = rect.width
      const hoverPercentage = hoverX / starWidth

      let newHoverValue: number
      if (precision === 1) {
        newHoverValue = starIndex + 1
      } else if (precision === 0.5) {
        newHoverValue = hoverPercentage < 0.5 ? starIndex + 0.5 : starIndex + 1
      } else {
        newHoverValue = starIndex + Math.round(hoverPercentage * 10) / 10
      }

      setHoverValue(newHoverValue)
    }

    // Renderizar una estrella individual
    const renderStar = (starIndex: number) => {
      const fillPercentage = getStarFillPercentage(starIndex)
      const starId = `star-${starIndex}-${Math.random()}`

      return (
        <button
          key={starIndex}
          type="button"
          onClick={(e) => handleStarClick(starIndex, e)}
          onMouseMove={(e) => handleStarHover(starIndex, e)}
          onMouseLeave={() => setHoverValue(null)}
          disabled={!isInteractive}
          className={cn(
            'relative inline-flex transition-transform duration-150',
            isInteractive && 'cursor-pointer hover:scale-110 active:scale-95',
            !isInteractive && 'cursor-default',
            sizes[size]
          )}
          aria-label={`${starIndex + 1} ${starIndex === 0 ? 'estrella' : 'estrellas'}`}
        >
          <svg
            className={cn('absolute inset-0', sizes[size])}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id={starId}>
                <stop offset={`${fillPercentage}%`} stopColor="currentColor" className="text-yellow-400" />
                <stop offset={`${fillPercentage}%`} stopColor="currentColor" className="text-gray-300" />
              </linearGradient>
            </defs>
            {/* Estrella con borde */}
            <path
              d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
              fill={`url(#${starId})`}
              stroke="currentColor"
              strokeWidth="1"
              className={cn(
                fillPercentage > 0 ? 'text-yellow-400' : 'text-gray-300',
                'transition-colors duration-150'
              )}
            />
          </svg>
        </button>
      )
    }

    return (
      <div
        ref={ref}
        className={cn('inline-flex items-center gap-2', className)}
        {...props}
      >
        {/* Estrellas */}
        <div 
          className="inline-flex items-center gap-0.5"
          role="img"
          aria-label={`Rating: ${normalizedValue.toFixed(1)} de 5 estrellas`}
        >
          {[0, 1, 2, 3, 4].map((starIndex) => renderStar(starIndex))}
        </div>

        {/* Valor numérico y contador de reviews */}
        {showValue && (
          <div className={cn('inline-flex items-center gap-1', textSizes[size])}>
            <span className="font-medium text-gray-900">
              {normalizedValue.toFixed(1)}
            </span>
            {reviewCount !== undefined && (
              <span className="text-gray-500">
                ({reviewCount.toLocaleString('es-ES')} {reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            )}
          </div>
        )}
      </div>
    )
  }
)

Rating.displayName = 'Rating'

export { Rating }
export type { RatingProps }
