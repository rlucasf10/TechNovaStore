'use client'

/**
 * AnimatedCard - Card con animaciones de Framer Motion
 * 
 * Extiende el componente Card base con animaciones suaves y micro-interacciones.
 * Optimizado para performance usando transform y opacity.
 * 
 * Requisitos: 4.1, 21.3
 */

import { HTMLAttributes, forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  hoverLiftVariants,
  scaleVariants,
  slideUpVariants,
  withReducedMotion,
} from '@/lib/animations'

interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  /** Contenido del card */
  children: React.ReactNode
  /** Variante de padding del card */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** Habilitar efecto de elevación en hover */
  hoverable?: boolean
  /** Mostrar borde */
  bordered?: boolean
  /** Hacer el card clickeable */
  clickable?: boolean
  /** Tipo de animación de entrada */
  animationType?: 'none' | 'fade' | 'slide' | 'scale'
  /** Delay de la animación (en segundos) */
  delay?: number
}

/**
 * AnimatedCard - Card con animaciones fluidas
 * 
 * @example
 * ```tsx
 * <AnimatedCard hoverable animationType="slide">
 *   <h3>Título</h3>
 *   <p>Contenido</p>
 * </AnimatedCard>
 * ```
 * 
 * @example
 * ```tsx
 * // Con delay para efecto stagger
 * {products.map((product, index) => (
 *   <AnimatedCard
 *     key={product.id}
 *     animationType="scale"
 *     delay={index * 0.05}
 *   >
 *     <ProductContent product={product} />
 *   </AnimatedCard>
 * ))}
 * ```
 */
export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  (
    {
      className,
      padding = 'md',
      hoverable = false,
      bordered = false,
      clickable = false,
      animationType = 'fade',
      delay = 0,
      children,
      ...props
    },
    ref
  ) => {
    // Clases base del card
    const baseClasses =
      'bg-white dark:bg-dark-bg-secondary rounded-lg transition-shadow duration-200'

    // Variantes de padding
    const paddingVariants = {
      none: '',
      sm: 'p-3',
      md: 'p-4 sm:p-6',
      lg: 'p-6 sm:p-8',
    }

    // Sombra base
    const shadowClasses = 'shadow-sm'

    // Borde opcional
    const borderClasses = bordered
      ? 'border border-gray-200 dark:border-dark-border-dark'
      : ''

    // Efectos de clickeable
    const clickableClasses = clickable ? 'cursor-pointer' : ''

    // Seleccionar variantes de animación de entrada
    const getEntryVariants = () => {
      switch (animationType) {
        case 'slide':
          return withReducedMotion(slideUpVariants)
        case 'scale':
          return withReducedMotion(scaleVariants)
        case 'fade':
          return withReducedMotion({
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { duration: 0.3, delay },
            },
          })
        case 'none':
        default:
          return undefined
      }
    }

    const entryVariants = getEntryVariants()

    // Configurar hover variants si hoverable está habilitado
    const hoverProps = hoverable
      ? {
          initial: 'rest',
          whileHover: 'hover',
          variants: hoverLiftVariants,
        }
      : {}

    // Configurar tap effect si clickable está habilitado
    const tapProps = clickable
      ? {
          whileTap: { scale: 0.98 },
        }
      : {}

    return (
      <motion.div
        ref={ref}
        className={cn(
          baseClasses,
          paddingVariants[padding],
          shadowClasses,
          borderClasses,
          clickableClasses,
          className
        )}
        initial={entryVariants ? 'hidden' : undefined}
        animate={entryVariants ? 'visible' : undefined}
        variants={entryVariants}
        {...hoverProps}
        {...tapProps}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

AnimatedCard.displayName = 'AnimatedCard'

/**
 * AnimatedCardGrid - Contenedor para grids de cards con animación stagger
 * 
 * @example
 * ```tsx
 * <AnimatedCardGrid>
 *   {items.map((item, index) => (
 *     <AnimatedCard key={item.id} delay={index * 0.05}>
 *       <ItemContent item={item} />
 *     </AnimatedCard>
 *   ))}
 * </AnimatedCardGrid>
 * ```
 */
interface AnimatedCardGridProps extends HTMLAttributes<HTMLDivElement> {
  /** Número de columnas en diferentes breakpoints */
  cols?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
}

export const AnimatedCardGrid = forwardRef<
  HTMLDivElement,
  AnimatedCardGridProps
>(({ className, cols = { sm: 1, md: 2, lg: 3, xl: 4 }, children, ...props }, ref) => {
  const gridClasses = cn(
    'grid gap-4 sm:gap-6',
    cols.sm && `grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`
  )

  return (
    <div ref={ref} className={cn(gridClasses, className)} {...props}>
      {children}
    </div>
  )
})

AnimatedCardGrid.displayName = 'AnimatedCardGrid'
