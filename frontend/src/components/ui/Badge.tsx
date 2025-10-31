import { HTMLAttributes, forwardRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Variante de color del badge */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary'
  /** Tamaño del badge */
  size?: 'sm' | 'md' | 'lg'
  /** Icono a mostrar antes del texto */
  icon?: ReactNode
  /** Si el badge tiene un punto indicador */
  dot?: boolean
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md',
    icon,
    dot,
    children, 
    ...props 
  }, ref) => {
    // Clases base para todos los badges
    const baseClasses = 'inline-flex items-center justify-center gap-1.5 font-medium rounded-full transition-colors'
    
    // Variantes de color
    const variants = {
      default: 'bg-gray-100 text-gray-800 border border-gray-200',
      primary: 'bg-primary-100 text-primary-800 border border-primary-200',
      success: 'bg-green-100 text-green-800 border border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      error: 'bg-red-100 text-red-800 border border-red-200',
      info: 'bg-blue-100 text-blue-800 border border-blue-200',
      secondary: 'bg-purple-100 text-purple-800 border border-purple-200',
    }
    
    // Tamaños del badge
    const sizes = {
      sm: 'px-2 py-0.5 text-xs min-h-[20px]',
      md: 'px-2.5 py-1 text-sm min-h-[24px]',
      lg: 'px-3 py-1.5 text-base min-h-[28px]',
    }

    // Tamaños de iconos según el tamaño del badge
    const iconSizes = {
      sm: 'w-3 h-3',
      md: 'w-3.5 h-3.5',
      lg: 'w-4 h-4',
    }

    // Tamaños del punto indicador
    const dotSizes = {
      sm: 'w-1.5 h-1.5',
      md: 'w-2 h-2',
      lg: 'w-2.5 h-2.5',
    }

    // Colores del punto indicador según la variante
    const dotColors = {
      default: 'bg-gray-500',
      primary: 'bg-primary-600',
      success: 'bg-green-600',
      warning: 'bg-yellow-600',
      error: 'bg-red-600',
      info: 'bg-blue-600',
      secondary: 'bg-purple-600',
    }

    return (
      <span
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {/* Punto indicador */}
        {dot && (
          <span 
            className={cn(
              'rounded-full',
              dotSizes[size],
              dotColors[variant]
            )}
            aria-hidden="true"
          />
        )}
        
        {/* Icono */}
        {icon && (
          <span className={cn('inline-flex', iconSizes[size])} aria-hidden="true">
            {icon}
          </span>
        )}
        
        {/* Contenido del badge */}
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }
export type { BadgeProps }
