'use client'

import { useState, useMemo } from 'react'
import { Button, Input } from '@/components/ui'
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react'

/**
 * Tipos de datos para los filtros
 */
export interface ProductFilters {
  categories: string[]
  brands: string[]
  priceRange: [number, number]
  specs: Record<string, string[]>
  inStock: boolean
}

export interface CategoryOption {
  id: string
  name: string
  slug: string
  count: number
}

export interface BrandOption {
  name: string
  count: number
}

export interface SpecOption {
  category: string
  label: string
  options: Array<{
    value: string
    label: string
    count: number
  }>
}

interface ProductFilterSidebarProps {
  categories: CategoryOption[]
  brands: BrandOption[]
  specs: SpecOption[]
  filters: ProductFilters
  priceRange: [number, number] // Rango de precios disponibles [min, max]
  onFilterChange: (filters: ProductFilters) => void
  onApplyFilters: () => void
  onClearFilters: () => void
  totalProducts: number
}

/**
 * Sidebar de filtros avanzados para el catálogo de productos
 * 
 * Características:
 * - Filtros por categorías con checkboxes y contador
 * - Filtros por marcas con búsqueda
 * - Slider dual para rango de precio
 * - Filtros por especificaciones técnicas (acordeón)
 * - Toggle "Solo en stock"
 * - Botones "Aplicar Filtros" y "Limpiar Todo"
 */
export function ProductFilterSidebar({
  categories,
  brands,
  specs,
  filters,
  priceRange,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  totalProducts
}: ProductFilterSidebarProps) {
  // Estado local para búsqueda de marcas
  const [brandSearch, setBrandSearch] = useState('')
  
  // Estado para acordeones de especificaciones
  const [expandedSpecs, setExpandedSpecs] = useState<Record<string, boolean>>({})
  
  // Estado local temporal para el slider de precio (para mejor UX)
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>(filters.priceRange)

  // Filtrar marcas según búsqueda
  const filteredBrands = useMemo(() => {
    if (!brandSearch) return brands
    const search = brandSearch.toLowerCase()
    return brands.filter(brand => brand.name.toLowerCase().includes(search))
  }, [brands, brandSearch])

  // Verificar si hay filtros activos
  const hasActiveFilters = 
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.priceRange[0] > priceRange[0] ||
    filters.priceRange[1] < priceRange[1] ||
    Object.values(filters.specs).some(values => values.length > 0) ||
    filters.inStock

  // Handlers
  const handleCategoryToggle = (categorySlug: string) => {
    const newCategories = filters.categories.includes(categorySlug)
      ? filters.categories.filter(c => c !== categorySlug)
      : [...filters.categories, categorySlug]
    
    onFilterChange({ ...filters, categories: newCategories })
  }

  const handleBrandToggle = (brandName: string) => {
    const newBrands = filters.brands.includes(brandName)
      ? filters.brands.filter(b => b !== brandName)
      : [...filters.brands, brandName]
    
    onFilterChange({ ...filters, brands: newBrands })
  }

  const handlePriceRangeChange = (index: 0 | 1, value: number) => {
    const newRange: [number, number] = [...localPriceRange]
    newRange[index] = value
    
    // Asegurar que min <= max
    if (index === 0 && value > newRange[1]) {
      newRange[1] = value
    } else if (index === 1 && value < newRange[0]) {
      newRange[0] = value
    }
    
    setLocalPriceRange(newRange)
  }

  const handlePriceRangeCommit = () => {
    onFilterChange({ ...filters, priceRange: localPriceRange })
  }

  const handleSpecToggle = (category: string, value: string) => {
    const currentValues = filters.specs[category] || []
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value]
    
    onFilterChange({
      ...filters,
      specs: {
        ...filters.specs,
        [category]: newValues
      }
    })
  }

  const toggleSpecAccordion = (category: string) => {
    setExpandedSpecs(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const handleInStockToggle = () => {
    onFilterChange({ ...filters, inStock: !filters.inStock })
  }

  return (
    <aside className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-fit sticky top-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-primary-600 hover:text-primary-700"
            aria-label="Limpiar todos los filtros"
          >
            Limpiar Todo
          </Button>
        )}
      </div>

      {/* Contador de productos */}
      <div className="mb-6 p-3 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-gray-900">{totalProducts}</span> productos encontrados
        </p>
      </div>

      <div className="space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
        {/* Categorías */}
        {categories.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Categorías</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
                >
                  <div className="flex items-center flex-1">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category.slug)}
                      onChange={() => handleCategoryToggle(category.slug)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      aria-label={`Filtrar por categoría ${category.name}`}
                    />
                    <span className="ml-2 text-sm text-gray-700">{category.name}</span>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">({category.count})</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Marcas con búsqueda */}
        {brands.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Marcas</h3>
            
            {/* Búsqueda de marcas */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar marca..."
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                className="pl-9 pr-8"
                aria-label="Buscar marcas"
              />
              {brandSearch && (
                <button
                  onClick={() => setBrandSearch('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Lista de marcas */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredBrands.length > 0 ? (
                filteredBrands.map((brand) => (
                  <label
                    key={brand.name}
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
                  >
                    <div className="flex items-center flex-1">
                      <input
                        type="checkbox"
                        checked={filters.brands.includes(brand.name)}
                        onChange={() => handleBrandToggle(brand.name)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        aria-label={`Filtrar por marca ${brand.name}`}
                      />
                      <span className="ml-2 text-sm text-gray-700">{brand.name}</span>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">({brand.count})</span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">
                  No se encontraron marcas
                </p>
              )}
            </div>
          </div>
        )}

        {/* Rango de Precio con Slider Dual */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Rango de Precio</h3>
          
          {/* Inputs numéricos */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div>
              <label htmlFor="price-min" className="text-xs text-gray-600 mb-1 block">
                Mínimo
              </label>
              <Input
                id="price-min"
                type="number"
                value={localPriceRange[0]}
                onChange={(e) => handlePriceRangeChange(0, Number(e.target.value))}
                onBlur={handlePriceRangeCommit}
                min={priceRange[0]}
                max={priceRange[1]}
                className="text-sm"
                aria-label="Precio mínimo"
              />
            </div>
            <div>
              <label htmlFor="price-max" className="text-xs text-gray-600 mb-1 block">
                Máximo
              </label>
              <Input
                id="price-max"
                type="number"
                value={localPriceRange[1]}
                onChange={(e) => handlePriceRangeChange(1, Number(e.target.value))}
                onBlur={handlePriceRangeCommit}
                min={priceRange[0]}
                max={priceRange[1]}
                className="text-sm"
                aria-label="Precio máximo"
              />
            </div>
          </div>

          {/* Slider dual */}
          <div className="relative pt-2 pb-6">
            {/* Track */}
            <div className="absolute w-full h-1 bg-gray-200 rounded-full top-1/2 transform -translate-y-1/2" />
            
            {/* Active range */}
            <div
              className="absolute h-1 bg-primary-500 rounded-full top-1/2 transform -translate-y-1/2"
              style={{
                left: `${((localPriceRange[0] - priceRange[0]) / (priceRange[1] - priceRange[0])) * 100}%`,
                right: `${100 - ((localPriceRange[1] - priceRange[0]) / (priceRange[1] - priceRange[0])) * 100}%`
              }}
            />

            {/* Min slider */}
            <input
              type="range"
              min={priceRange[0]}
              max={priceRange[1]}
              value={localPriceRange[0]}
              onChange={(e) => handlePriceRangeChange(0, Number(e.target.value))}
              onMouseUp={handlePriceRangeCommit}
              onTouchEnd={handlePriceRangeCommit}
              className="absolute w-full h-1 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
              style={{ zIndex: localPriceRange[0] > priceRange[0] + (priceRange[1] - priceRange[0]) * 0.5 ? 5 : 3 }}
              aria-label="Precio mínimo slider"
            />

            {/* Max slider */}
            <input
              type="range"
              min={priceRange[0]}
              max={priceRange[1]}
              value={localPriceRange[1]}
              onChange={(e) => handlePriceRangeChange(1, Number(e.target.value))}
              onMouseUp={handlePriceRangeCommit}
              onTouchEnd={handlePriceRangeCommit}
              className="absolute w-full h-1 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
              style={{ zIndex: localPriceRange[1] < priceRange[0] + (priceRange[1] - priceRange[0]) * 0.5 ? 5 : 4 }}
              aria-label="Precio máximo slider"
            />
          </div>

          {/* Valores actuales */}
          <div className="flex justify-between text-xs text-gray-600">
            <span>€{localPriceRange[0].toFixed(2)}</span>
            <span>€{localPriceRange[1].toFixed(2)}</span>
          </div>
        </div>

        {/* Especificaciones Técnicas (Acordeón) */}
        {specs.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Especificaciones Técnicas</h3>
            <div className="space-y-2">
              {specs.map((spec) => (
                <div key={spec.category} className="border border-gray-200 rounded-md">
                  {/* Acordeón header */}
                  <button
                    onClick={() => toggleSpecAccordion(spec.category)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                    aria-expanded={expandedSpecs[spec.category]}
                    aria-controls={`spec-${spec.category}`}
                  >
                    <span className="text-sm font-medium text-gray-700">{spec.label}</span>
                    {expandedSpecs[spec.category] ? (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                  </button>

                  {/* Acordeón content */}
                  {expandedSpecs[spec.category] && (
                    <div id={`spec-${spec.category}`} className="p-3 pt-0 space-y-2">
                      {spec.options.map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
                        >
                          <div className="flex items-center flex-1">
                            <input
                              type="checkbox"
                              checked={(filters.specs[spec.category] || []).includes(option.value)}
                              onChange={() => handleSpecToggle(spec.category, option.value)}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                              aria-label={`Filtrar por ${spec.label}: ${option.label}`}
                            />
                            <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                          </div>
                          <span className="text-xs text-gray-500 ml-2">({option.count})</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Solo en Stock */}
        <div>
          <label className="flex items-center cursor-pointer hover:bg-gray-50 p-3 rounded-md transition-colors">
            <input
              type="checkbox"
              checked={filters.inStock}
              onChange={handleInStockToggle}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
              aria-label="Solo mostrar productos en stock"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">Solo en stock</span>
          </label>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
        <Button
          onClick={onApplyFilters}
          className="w-full"
          disabled={!hasActiveFilters}
          aria-label="Aplicar filtros seleccionados"
        >
          Aplicar Filtros
        </Button>
        {hasActiveFilters && (
          <Button
            variant="secondary"
            onClick={onClearFilters}
            className="w-full"
            aria-label="Limpiar todos los filtros"
          >
            Limpiar Todo
          </Button>
        )}
      </div>
    </aside>
  )
}
