/**
 * Componente para asegurar jerarquía correcta de encabezados
 * Mejora la accesibilidad y SEO
 */

import type { ReactNode, ElementType } from 'react'

interface PageHeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6
  children: ReactNode
  className?: string
  id?: string
}

/**
 * Componente de encabezado con jerarquía semántica correcta
 * 
 * Uso:
 * <PageHeading level={1}>Título Principal</PageHeading>
 * <PageHeading level={2}>Sección</PageHeading>
 * <PageHeading level={3}>Subsección</PageHeading>
 */
export function PageHeading({ level, children, className = '', id }: PageHeadingProps) {
  const Tag: ElementType = `h${level}`

  // Clases base según el nivel (siguiendo WCAG)
  const baseClasses = {
    1: 'text-4xl md:text-5xl font-bold text-gray-900',
    2: 'text-3xl md:text-4xl font-bold text-gray-900',
    3: 'text-2xl md:text-3xl font-semibold text-gray-900',
    4: 'text-xl md:text-2xl font-semibold text-gray-900',
    5: 'text-lg md:text-xl font-medium text-gray-900',
    6: 'text-base md:text-lg font-medium text-gray-900',
  }

  return (
    <Tag id={id} className={`${baseClasses[level]} ${className}`}>
      {children}
    </Tag>
  )
}

/**
 * Componente para sección con encabezado
 * Asegura estructura semántica correcta
 */
interface SectionProps {
  heading: string
  headingLevel: 1 | 2 | 3 | 4 | 5 | 6
  children: ReactNode
  className?: string
  id?: string
  ariaLabel?: string
}

export function Section({
  heading,
  headingLevel,
  children,
  className = '',
  id,
  ariaLabel,
}: SectionProps) {
  return (
    <section
      id={id}
      className={className}
      aria-labelledby={id ? `${id}-heading` : undefined}
      aria-label={ariaLabel}
    >
      <PageHeading level={headingLevel} id={id ? `${id}-heading` : undefined}>
        {heading}
      </PageHeading>
      {children}
    </section>
  )
}

/**
 * Componente para texto visualmente oculto pero accesible para lectores de pantalla
 */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  )
}

/**
 * Componente para anuncios dinámicos (aria-live)
 */
interface LiveRegionProps {
  children: ReactNode
  politeness?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  relevant?: 'additions' | 'removals' | 'text' | 'all'
}

export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = true,
  relevant = 'additions',
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className="sr-only"
    >
      {children}
    </div>
  )
}
