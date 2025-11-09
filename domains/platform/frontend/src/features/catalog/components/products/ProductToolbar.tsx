'use client'

import { Button } from '@/ui'

interface ProductToolbarProps {
  totalProducts: number
  currentSort: string
  onSortChange: (sort: string) => void
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  onOpenFilters?: () => void
  showFiltersButton?: boolean
}

/**
 * Toolbar de Catálogo de Productos
 * 
 * Componente que muestra:
 * - Contador de productos
 * - Selector de ordenamiento
 * - Toggle de vista (grid/list)
 * - Botón de filtros para móvil
 * 
 * Requisitos: 7.1, 7.3
 */
export function ProductToolbar({
  totalProducts,
  currentSort,
  onSortChange,
  viewMode,
  onViewModeChange,
  onOpenFilters,
  showFiltersButton = false
}: ProductToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Contador de productos */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900">
          {totalProducts} {totalProducts === 1 ? 'producto' : 'productos'}
        </span>
        {totalProducts > 0 && (
          <span className="text-xs text-gray-500">encontrados</span>
        )}
      </div>

      {/* Controles de la derecha */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        {/* Botón de filtros (solo móvil) */}
        {showFiltersButton && onOpenFilters && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenFilters}
            className="lg:hidden flex items-center gap-2"
            aria-label="Abrir filtros"
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
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span>Filtros</span>
          </Button>
        )}

        {/* Selector de ordenamiento */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial">
          <label
            htmlFor="sort-select"
            className="text-sm text-gray-600 whitespace-nowrap hidden sm:inline"
          >
            Ordenar por:
          </label>
          <select
            id="sort-select"
            value={currentSort}
            onChange={(e) => onSortChange(e.target.value)}
            className="flex-1 sm:flex-initial rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500 py-2 px-3"
            aria-label="Ordenar productos"
          >
            <option value="name">Nombre A-Z</option>
            <option value="-name">Nombre Z-A</option>
            <option value="our_price">Precio: Menor a Mayor</option>
            <option value="-our_price">Precio: Mayor a Menor</option>
            <option value="-created_at">Más Recientes</option>
            <option value="created_at">Más Antiguos</option>
            <option value="-rating">Mejor Valorados</option>
          </select>
        </div>

        {/* Toggle de vista (grid/list) */}
        <div
          className="flex items-center bg-gray-100 rounded-md p-1"
          role="group"
          aria-label="Modo de vista"
        >
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'grid'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-label="Vista en cuadrícula"
            aria-pressed={viewMode === 'grid'}
            title="Vista en cuadrícula"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-label="Vista en lista"
            aria-pressed={viewMode === 'list'}
            title="Vista en lista"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
