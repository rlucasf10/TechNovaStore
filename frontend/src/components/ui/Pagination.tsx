import { useMemo } from 'react'
import { cn } from '@/lib/utils'

export interface PaginationProps {
  /** Página actual (1-indexed) */
  currentPage: number
  /** Número total de páginas */
  totalPages: number
  /** Callback cuando cambia la página */
  onPageChange: (page: number) => void
  /** Número máximo de botones de página a mostrar (por defecto: 7) */
  maxButtons?: number
  /** Mostrar texto "Página X de Y" (por defecto: true) */
  showPageInfo?: boolean
  /** Clase CSS adicional para el contenedor */
  className?: string
  /** Deshabilitar la paginación */
  disabled?: boolean
}

/**
 * Componente Pagination - Navegación entre páginas
 * 
 * Características:
 * - Botones de navegación (Primera, Anterior, Siguiente, Última)
 * - Números de página con ellipsis inteligente
 * - Muestra "Página X de Y"
 * - Deshabilita botones en límites
 * - Accesible con ARIA labels
 * - Responsive
 * 
 * @example
 * ```tsx
 * <Pagination
 *   currentPage={5}
 *   totalPages={20}
 *   onPageChange={(page) => console.log('Ir a página', page)}
 * />
 * ```
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxButtons = 7,
  showPageInfo = true,
  className,
  disabled = false,
}: PaginationProps) {
  /**
   * Genera el array de números de página a mostrar con ellipsis
   * Algoritmo:
   * - Siempre mostrar primera y última página
   * - Mostrar páginas alrededor de la actual
   * - Usar "..." para rangos omitidos
   */
  const pageNumbers = useMemo(() => {
    if (totalPages <= maxButtons) {
      // Si hay pocas páginas, mostrar todas
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | string)[] = []
    const leftSiblingIndex = Math.max(currentPage - 1, 1)
    const rightSiblingIndex = Math.min(currentPage + 1, totalPages)

    const shouldShowLeftEllipsis = leftSiblingIndex > 2
    const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 1

    // Siempre mostrar primera página
    pages.push(1)

    if (shouldShowLeftEllipsis) {
      // Mostrar ellipsis izquierdo
      pages.push('left-ellipsis')
    } else if (leftSiblingIndex === 2) {
      // Si solo hay una página entre la primera y el rango, mostrarla
      pages.push(2)
    }

    // Mostrar páginas alrededor de la actual
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i)
      }
    }

    if (shouldShowRightEllipsis) {
      // Mostrar ellipsis derecho
      pages.push('right-ellipsis')
    } else if (rightSiblingIndex === totalPages - 1) {
      // Si solo hay una página entre el rango y la última, mostrarla
      pages.push(totalPages - 1)
    }

    // Siempre mostrar última página
    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }, [currentPage, totalPages, maxButtons])

  // Si solo hay una página, no mostrar paginación
  if (totalPages <= 1) {
    return null
  }

  const isFirstPage = currentPage === 1
  const isLastPage = currentPage === totalPages

  /**
   * Maneja el cambio de página con validación
   */
  const handlePageChange = (page: number) => {
    if (disabled) return
    if (page < 1 || page > totalPages) return
    if (page === currentPage) return
    onPageChange(page)
  }

  return (
    <nav
      role="navigation"
      aria-label="Paginación"
      className={cn('flex flex-col items-center gap-4', className)}
    >
      {/* Información de página */}
      {showPageInfo && (
        <div className="text-sm text-gray-600">
          Página <span className="font-medium text-gray-900">{currentPage}</span> de{' '}
          <span className="font-medium text-gray-900">{totalPages}</span>
        </div>
      )}

      {/* Botones de paginación */}
      <div className="flex items-center gap-1">
        {/* Botón: Primera página */}
        <PaginationButton
          onClick={() => handlePageChange(1)}
          disabled={isFirstPage || disabled}
          aria-label="Ir a la primera página"
          className="hidden sm:flex"
        >
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
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </PaginationButton>

        {/* Botón: Página anterior */}
        <PaginationButton
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={isFirstPage || disabled}
          aria-label="Ir a la página anterior"
        >
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="hidden sm:inline ml-1">Anterior</span>
        </PaginationButton>

        {/* Números de página */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (typeof page === 'string') {
              // Ellipsis
              return (
                <span
                  key={`ellipsis-${page}-${index}`}
                  className="px-2 py-1 text-gray-400"
                  aria-hidden="true"
                >
                  ...
                </span>
              )
            }

            const isActive = page === currentPage

            return (
              <PaginationButton
                key={`page-${page}`}
                onClick={() => handlePageChange(page)}
                disabled={disabled}
                isActive={isActive}
                aria-label={`Ir a la página ${page}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {page}
              </PaginationButton>
            )
          })}
        </div>

        {/* Botón: Página siguiente */}
        <PaginationButton
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={isLastPage || disabled}
          aria-label="Ir a la página siguiente"
        >
          <span className="hidden sm:inline mr-1">Siguiente</span>
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
        </PaginationButton>

        {/* Botón: Última página */}
        <PaginationButton
          onClick={() => handlePageChange(totalPages)}
          disabled={isLastPage || disabled}
          aria-label="Ir a la última página"
          className="hidden sm:flex"
        >
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
              d="M13 5l7 7-7 7M5 5l7 7-7 7"
            />
          </svg>
        </PaginationButton>
      </div>
    </nav>
  )
}

/**
 * Componente interno para botones de paginación
 */
interface PaginationButtonProps {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  isActive?: boolean
  className?: string
  'aria-label'?: string
  'aria-current'?: 'page' | undefined
}

function PaginationButton({
  children,
  onClick,
  disabled = false,
  isActive = false,
  className,
  'aria-label': ariaLabel,
  'aria-current': ariaCurrent,
}: PaginationButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      className={cn(
        'inline-flex items-center justify-center',
        'min-w-[2.5rem] h-10 px-3 py-2',
        'text-sm font-medium rounded-md',
        'transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        // Estados normales
        !isActive && !disabled && [
          'text-gray-700 bg-white border border-gray-300',
          'hover:bg-gray-50 hover:border-gray-400',
          'active:bg-gray-100',
        ],
        // Estado activo
        isActive && [
          'text-white bg-primary-600 border border-primary-600',
          'hover:bg-primary-700',
          'cursor-default',
        ],
        // Estado deshabilitado
        disabled && [
          'text-gray-400 bg-gray-100 border border-gray-200',
          'cursor-not-allowed opacity-50',
        ],
        className
      )}
    >
      {children}
    </button>
  )
}
