'use client'

/**
 * AnimatedButton - Botón con micro-interacciones usando Framer Motion
 * 
 * Extiende el componente Button base con animaciones suaves y feedback visual.
 * Optimizado para performance usando transform y opacity.
 * 
 * Requisitos: 4.1, 21.1
 */

import { forwardRef, ReactNode } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { hoverScaleVariants, withReducedMotion } from '@/lib/animations'

interface AnimatedButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'> {
  /** Contenido del botón */
  children: ReactNode
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
  /** Deshabilitar animaciones de hover/tap */
  disableAnimations?: boolean
}

/**
 * AnimatedButton - Botón con micro-interacciones fluidas
 * 
 * @example
 * ```tsx
 * <AnimatedButton variant="primary" onClick={handleClick}>
 *   Hacer clic
 * </AnimatedButton>
 * ```
 * 
 * @example
 * ```tsx
 * <AnimatedButton
 *   variant="secondary"
 *   loading={isLoading}
 *   iconLeft={<Icon />}
 * >
 *   Guardar
 * </AnimatedButton>
 * ```
 */
export const AnimatedButton = forwardRef<
  HTMLButtonElement,
  AnimatedButtonProps
>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading,
      iconLeft,
      iconRight,
      disableAnimations = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Clases base para todos los botones
    const baseClasses =
      'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

    // Variantes de color y estilo
    const variants = {
      primary:
        'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 shadow-sm',
      secondary:
        'border-2 border-primary-600 dark:border-primary-400 bg-transparent hover:bg-primary-50 dark:hover:bg-primary-900/30 text-primary-600 dark:text-primary-400 focus:ring-primary-500',
      ghost:
        'bg-transparent hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 focus:ring-gray-400',
      danger:
        'bg-error hover:bg-red-600 text-white focus:ring-red-500 shadow-sm',
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

    // Configurar animaciones si no están deshabilitadas
    const animationProps = !disableAnimations
      ? {
          variants: withReducedMotion(hoverScaleVariants),
          initial: 'rest',
          whileHover: disabled || loading ? undefined : 'hover',
          whileTap: disabled || loading ? undefined : 'tap',
        }
      : {}

    return (
      <motion.button
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          loading && 'cursor-wait',
          className
        )}
        disabled={disabled || loading}
        aria-busy={loading}
        aria-disabled={disabled || loading}
        {...animationProps}
        {...props}
      >
        {/* Spinner de carga */}
        {loading && (
          <motion.svg
            className={cn('animate-spin', iconSizes[size])}
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
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
          </motion.svg>
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
      </motion.button>
    )
  }
)

AnimatedButton.displayName = 'AnimatedButton'

/**
 * AnimatedIconButton - Botón circular solo con icono
 * 
 * @example
 * ```tsx
 * <AnimatedIconButton aria-label="Cerrar">
 *   <XIcon />
 * </AnimatedIconButton>
 * ```
 */
interface AnimatedIconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}

export const AnimatedIconButton = forwardRef<
  HTMLButtonElement,
  AnimatedIconButtonProps
>(({ className, size = 'md', variant = 'ghost', children, ...props }, ref) => {
  const sizes = {
    sm: 'w-8 h-8 p-1',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-3',
  }

  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary:
      'border-2 border-primary-600 bg-transparent hover:bg-primary-50 text-primary-600',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300',
    danger: 'bg-error hover:bg-red-600 text-white',
  }

  return (
    <motion.button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        'transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizes[size],
        variants[variant],
        className
      )}
      variants={withReducedMotion(hoverScaleVariants)}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      {...props}
    >
      {children}
    </motion.button>
  )
})

AnimatedIconButton.displayName = 'AnimatedIconButton'
