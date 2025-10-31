import { Fragment, ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * Representa un elemento individual en la ruta de navegación
 */
export interface BreadcrumbItem {
  /** Texto a mostrar para este elemento */
  label: string
  /** URL de destino (opcional para el último elemento) */
  href?: string
  /** Icono opcional a mostrar antes del label */
  icon?: ReactNode
}

export interface BreadcrumbsProps {
  /** Array de elementos de navegación jerárquica */
  items: BreadcrumbItem[]
  /** Separador personalizado entre elementos (por defecto: '/') */
  separator?: ReactNode
  /** Número máximo de caracteres antes de truncar (por defecto: 30) */
  maxLength?: number
  /** Clase CSS adicional para el contenedor */
  className?: string
  /** Mostrar solo el último elemento en móvil (por defecto: true) */
  mobileLastOnly?: boolean
}

/**
 * Componente Breadcrumbs - Navegación jerárquica
 * 
 * Características:
 * - Navegación jerárquica clara
 * - Separadores personalizables
 * - Truncado automático para rutas largas
 * - Responsive: solo último item en móvil por defecto
 * - Accesible con ARIA labels
 * 
 * @example
 * ```tsx
 * <Breadcrumbs
 *   items={[
 *     { label: 'Inicio', href: '/' },
 *     { label: 'Laptops', href: '/categoria/laptops' },
 *     { label: 'MacBook Pro 16"' }
 *   ]}
 * />
 * ```
 */
export function Breadcrumbs({
  items,
  separator = '/',
  maxLength = 30,
  className,
  mobileLastOnly = true,
}: BreadcrumbsProps) {
  // Si no hay items, no renderizar nada
  if (!items || items.length === 0) {
    return null
  }

  /**
   * Trunca un texto si excede la longitud máxima
   */
  const truncateText = (text: string, max: number): string => {
    if (text.length <= max) return text
    return `${text.slice(0, max - 3)}...`
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center', className)}
    >
      <ol className="flex items-center flex-wrap gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const isFirst = index === 0
          
          // Determinar si este elemento debe mostrarse en móvil
          const shouldShowOnMobile = !mobileLastOnly || isLast || isFirst

          return (
            <Fragment key={`${item.label}-${index}`}>
              <li
                className={cn(
                  'flex items-center gap-2',
                  // Ocultar elementos intermedios en móvil si mobileLastOnly está activo
                  !shouldShowOnMobile && 'hidden sm:flex'
                )}
              >
                {/* Renderizar link o texto según si es el último elemento */}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className={cn(
                      'inline-flex items-center gap-1.5 text-sm font-medium transition-colors',
                      'text-gray-600 hover:text-primary-600',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md px-1'
                    )}
                    aria-label={`Navegar a ${item.label}`}
                  >
                    {/* Icono opcional */}
                    {item.icon && (
                      <span className="w-4 h-4 flex-shrink-0" aria-hidden="true">
                        {item.icon}
                      </span>
                    )}
                    
                    {/* Label truncado si es necesario */}
                    <span>{truncateText(item.label, maxLength)}</span>
                  </Link>
                ) : (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 text-sm font-medium',
                      isLast ? 'text-gray-900' : 'text-gray-600'
                    )}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {/* Icono opcional */}
                    {item.icon && (
                      <span className="w-4 h-4 flex-shrink-0" aria-hidden="true">
                        {item.icon}
                      </span>
                    )}
                    
                    {/* Label truncado si es necesario */}
                    <span>{truncateText(item.label, maxLength)}</span>
                  </span>
                )}
              </li>

              {/* Separador (no mostrar después del último elemento) */}
              {!isLast && (
                <li
                  className={cn(
                    'flex items-center text-gray-400',
                    // Ocultar separador si el siguiente elemento está oculto en móvil
                    !mobileLastOnly || index === items.length - 2 ? 'flex' : 'hidden sm:flex'
                  )}
                  aria-hidden="true"
                >
                  {typeof separator === 'string' ? (
                    <span className="text-sm font-medium">{separator}</span>
                  ) : (
                    separator
                  )}
                </li>
              )}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}

/**
 * Separador de chevron para usar como alternativa al separador por defecto
 */
export function ChevronSeparator() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  )
}

/**
 * Icono de casa para usar en el primer elemento (Inicio)
 */
export function HomeIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  )
}
