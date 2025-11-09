import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Variante de padding del card */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** Habilitar efecto de elevación en hover */
  hoverable?: boolean
  /** Mostrar borde */
  bordered?: boolean
  /** Hacer el card clickeable (añade cursor pointer y efectos) */
  clickable?: boolean
}

/**
 * Componente Card - Contenedor con bordes redondeados y sombras
 * 
 * Características:
 * - Bordes redondeados (8px)
 * - Sombra sutil por defecto
 * - Variantes de padding configurables
 * - Efecto de elevación en hover (opcional)
 * - Soporte para tema oscuro
 * 
 * @example
 * ```tsx
 * <Card padding="md" hoverable>
 *   <h3>Título del Card</h3>
 *   <p>Contenido del card</p>
 * </Card>
 * ```
 * 
 * Requisitos: 21.3
 */
const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    padding = 'md',
    hoverable = false,
    bordered = false,
    clickable = false,
    children,
    ...props 
  }, ref) => {
    // Clases base del card
    const baseClasses = 'bg-white dark:bg-dark-bg-secondary rounded-lg transition-all duration-200'
    
    // Variantes de padding
    const paddingVariants = {
      none: '',
      sm: 'p-3',
      md: 'p-4 sm:p-6',
      lg: 'p-6 sm:p-8',
    }

    // Sombra base y hover
    const shadowClasses = hoverable
      ? 'shadow-sm hover:shadow-md'
      : 'shadow-sm'

    // Borde opcional
    const borderClasses = bordered
      ? 'border border-gray-200 dark:border-dark-border-dark'
      : ''

    // Efectos de clickeable
    const clickableClasses = clickable
      ? 'cursor-pointer active:scale-[0.98] hover:shadow-md'
      : ''

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          paddingVariants[padding],
          shadowClasses,
          borderClasses,
          clickableClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

/**
 * CardHeader - Sección de encabezado del card
 * 
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <h3>Título</h3>
 *   </CardHeader>
 * </Card>
 * ```
 */
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Agregar borde inferior */
  bordered?: boolean
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, bordered = false, children, ...props }, ref) => {
    const borderClass = bordered 
      ? 'border-b border-gray-200 dark:border-dark-border-dark pb-4 mb-4'
      : ''

    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-between', borderClass, className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CardHeader.displayName = 'CardHeader'

/**
 * CardTitle - Título del card
 * 
 * @example
 * ```tsx
 * <CardHeader>
 *   <CardTitle>Mi Título</CardTitle>
 * </CardHeader>
 * ```
 */
interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Nivel del heading (h1-h6) */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = 'h3', children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          'text-lg font-semibold text-gray-900 dark:text-dark-text-primary',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

CardTitle.displayName = 'CardTitle'

/**
 * CardDescription - Descripción o subtítulo del card
 * 
 * @example
 * ```tsx
 * <CardHeader>
 *   <div>
 *     <CardTitle>Título</CardTitle>
 *     <CardDescription>Descripción del contenido</CardDescription>
 *   </div>
 * </CardHeader>
 * ```
 */
const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn(
          'text-sm text-gray-500 dark:text-dark-text-secondary mt-1',
          className
        )}
        {...props}
      >
        {children}
      </p>
    )
  }
)

CardDescription.displayName = 'CardDescription'

/**
 * CardContent - Contenido principal del card
 * 
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>...</CardHeader>
 *   <CardContent>
 *     <p>Contenido principal</p>
 *   </CardContent>
 * </Card>
 * ```
 */
const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('text-gray-700 dark:text-dark-text-secondary', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CardContent.displayName = 'CardContent'

/**
 * CardFooter - Pie del card (acciones, botones, etc.)
 * 
 * @example
 * ```tsx
 * <Card>
 *   <CardContent>...</CardContent>
 *   <CardFooter>
 *     <Button>Acción</Button>
 *   </CardFooter>
 * </Card>
 * ```
 */
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Agregar borde superior */
  bordered?: boolean
}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, bordered = false, children, ...props }, ref) => {
    const borderClass = bordered 
      ? 'border-t border-gray-200 dark:border-dark-border-dark pt-4 mt-4'
      : ''

    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-2', borderClass, className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CardFooter.displayName = 'CardFooter'

export { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
}

export type { 
  CardProps, 
  CardHeaderProps, 
  CardTitleProps, 
  CardFooterProps 
}
