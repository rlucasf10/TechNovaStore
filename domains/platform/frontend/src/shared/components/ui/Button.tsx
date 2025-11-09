import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variante visual del botón */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  /** Tamaño del botón */
  size?: 'sm' | 'md' | 'lg'
  /** Estado de carga - muestra spinner y deshabilita el botón */
  loading?: boolean
  /** Icono a mostrar antes del texto */
  iconLeft?: ReactNode
  /** Icono a mostrar después del texto */
  iconRight?: ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading, 
    iconLeft,
    iconRight,
    children, 
    disabled, 
    ...props 
  }, ref) => {
    // Clases base para todos los botones
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95'
    
    // Variantes de color y estilo
    const variants = {
      primary: 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white focus:ring-primary-500 shadow-sm hover:shadow-md',
      secondary: 'border-2 border-primary-600 bg-transparent hover:bg-primary-50 active:bg-primary-100 text-primary-600 focus:ring-primary-500',
      ghost: 'bg-transparent hover:bg-gray-100 active:bg-gray-200 text-gray-700 focus:ring-gray-400',
      danger: 'bg-error hover:bg-red-600 active:bg-red-700 text-white focus:ring-red-500 shadow-sm hover:shadow-md',
    }
    
    // Tamaños del botón
    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-md min-h-[32px]',
      md: 'px-4 py-2 text-base rounded-lg min-h-[40px]',
      lg: 'px-6 py-3 text-lg rounded-lg min-h-[48px]',
    }

    // Tamaños de iconos según el tamaño del botón
    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          loading && 'cursor-wait',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {/* Spinner de carga */}
        {loading && (
          <svg 
            className={cn('animate-spin', iconSizes[size])} 
            fill="none" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4" 
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
            />
          </svg>
        )}
        
        {/* Icono izquierdo */}
        {!loading && iconLeft && (
          <span className={cn('inline-flex', iconSizes[size])} aria-hidden="true">
            {iconLeft}
          </span>
        )}
        
        {/* Contenido del botón */}
        {children}
        
        {/* Icono derecho */}
        {!loading && iconRight && (
          <span className={cn('inline-flex', iconSizes[size])} aria-hidden="true">
            {iconRight}
          </span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
export type { ButtonProps }