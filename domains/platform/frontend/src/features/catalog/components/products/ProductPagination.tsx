'use client'

import { Button } from '@/ui/Button'

interface ProductPaginationProps {
  /** Página actual (1-indexed) */
  currentPage: number
  /** Total de páginas */
  totalPages: number
  /** Total de productos */
  totalProducts: number
  /** Productos por página */
  productsPerPage: number
  /** Callback cuando cambia la página */
  onPageChange: (page: number) => void
  /** Indica si está cargando */
  isLoading?: boolean
  /** Clases CSS adicionales */
  className?: string
}

/**
 * ProductPagination Component
 * 
 * Componente de paginación para el catálogo de productos.
 * 
 * Características:
 * - Botones de navegación (Anterior/Siguiente)
 * - Números de página con ellipsis para muchas páginas
 * - Muestra "Página X de Y"
 * - Deshabilita botones en límites
 * - Muestra rango de productos actuales
 * 
 * Requisitos: 7.1
 */
export function ProductPagination({
  currentPage,
  totalPages,
  totalProducts,
  productsPerPage,
  onPageChange,
  isLoading = false,
  className = ''
}: ProductPaginationProps) {
  // Calcular rango de productos mostrados
  const startProduct = (currentPage - 1) * productsPerPage + 1
  const endProduct = Math.min(currentPage * productsPerPage, totalProducts)

  // Generar array de números de página a mostrar
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxPagesToShow = 7 // Número máximo de botones de página

    if (totalPages <= maxPagesToShow) {
      // Mostrar todas las páginas si son pocas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Mostrar páginas con ellipsis
      if (currentPage <= 3) {
        // Cerca del inicio
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        // Cerca del final
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // En el medio
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  // No mostrar paginación si solo hay una página
  if (totalPages <= 1) {
    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Información de rango de productos */}
      <div className="text-center text-sm text-gray-600">
        Mostrando <span className="font-semibold text-gray-900">{startProduct}</span> -{' '}
        <span className="font-semibold text-gray-900">{endProduct}</span> de{' '}
        <span className="font-semibold text-gray-900">{totalProducts}</span> productos
      </div>

      {/* Controles de paginación */}
      <nav
        className="flex items-center justify-center gap-2"
        aria-label="Paginación de productos"
      >
        {/* Botón Anterior */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          aria-label="Página anterior"
          className="min-w-[100px]"
        >
          <svg
            className="w-4 h-4 mr-1"
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
          Anterior
        </Button>

        {/* Números de página */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-gray-500"
                  aria-hidden="true"
                >
                  ...
                </span>
              )
            }

            const pageNumber = page as number
            const isCurrentPage = pageNumber === currentPage

            return (
              <Button
                key={pageNumber}
                variant={isCurrentPage ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => onPageChange(pageNumber)}
                disabled={isLoading}
                aria-label={`Ir a página ${pageNumber}`}
                aria-current={isCurrentPage ? 'page' : undefined}
                className="min-w-[40px]"
              >
                {pageNumber}
              </Button>
            )
          })}
        </div>

        {/* Indicador de página en móvil */}
        <div className="sm:hidden px-4 py-2 text-sm text-gray-700 font-medium">
          Página {currentPage} de {totalPages}
        </div>

        {/* Botón Siguiente */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          aria-label="Página siguiente"
          className="min-w-[100px]"
        >
          Siguiente
          <svg
            className="w-4 h-4 ml-1"
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
        </Button>
      </nav>
    </div>
  )
}
