'use client'

import { useState } from 'react'
import { Category } from '@/types'
import { Button, Input } from '@/components/ui'

interface FilterState {
  category: string
  subcategory: string
  brand: string
  minPrice: number
  maxPrice: number
  sortBy: string
  search: string
}

interface ProductFiltersProps {
  categories: Category[]
  brands: string[]
  subcategories: string[]
  filters: FilterState
  onFilterChange: (_filters: Partial<FilterState>) => void
  onClearFilters: () => void
}

export function ProductFilters({
  categories,
  brands,
  subcategories,
  filters,
  onFilterChange,
  onClearFilters
}: ProductFiltersProps) {
  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice.toString(),
    max: filters.maxPrice.toString()
  })

  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    setPriceRange(prev => ({ ...prev, [type]: value }))
    
    const numValue = parseFloat(value) || 0
    if (type === 'min') {
      onFilterChange({ minPrice: numValue })
    } else {
      onFilterChange({ maxPrice: numValue })
    }
  }

  const hasActiveFilters = 
    filters.category || 
    filters.subcategory || 
    filters.brand || 
    filters.minPrice > 0 || 
    filters.maxPrice > 0

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-primary-600 hover:text-primary-700"
          >
            Limpiar
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Categories */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Categoría</h3>
          <select
            id="filter-category"
            name="category"
            value={filters.category}
            onChange={(e) => onFilterChange({ category: e.target.value, subcategory: '' })}
            className="w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
            aria-label="Filtrar por categoría"
          >
            <option value="">Todas las categorías</option>
            {categories
              .filter(cat => !cat.parent_id) // Only parent categories
              .map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
          </select>
        </div>

        {/* Subcategories */}
        {filters.category && subcategories.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Subcategoría</h3>
            <select
              id="filter-subcategory"
              name="subcategory"
              value={filters.subcategory}
              onChange={(e) => onFilterChange({ subcategory: e.target.value })}
              className="w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
              aria-label="Filtrar por subcategoría"
            >
              <option value="">Todas las subcategorías</option>
              {subcategories.map((subcategory) => (
                <option key={subcategory} value={subcategory}>
                  {subcategory}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Brands */}
        {brands.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Marca</h3>
            <select
              id="filter-brand"
              name="brand"
              value={filters.brand}
              onChange={(e) => onFilterChange({ brand: e.target.value })}
              className="w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
              aria-label="Filtrar por marca"
            >
              <option value="">Todas las marcas</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Price Range */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Rango de Precio</h3>
          <div className="space-y-3">
            <Input
              id="price-min"
              name="priceMin"
              type="number"
              placeholder="Precio mínimo"
              value={priceRange.min}
              onChange={(e) => handlePriceChange('min', e.target.value)}
              min="0"
              step="0.01"
              aria-label="Precio mínimo"
            />
            <Input
              id="price-max"
              name="priceMax"
              type="number"
              placeholder="Precio máximo"
              value={priceRange.max}
              onChange={(e) => handlePriceChange('max', e.target.value)}
              min="0"
              step="0.01"
              aria-label="Precio máximo"
            />
          </div>
        </div>

        {/* Quick Price Filters */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Rangos Rápidos</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPriceRange({ min: '0', max: '50' })
                onFilterChange({ minPrice: 0, maxPrice: 50 })
              }}
              className={filters.minPrice === 0 && filters.maxPrice === 50 ? 'bg-primary-50 border-primary-300' : ''}
            >
              &lt; 50€
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPriceRange({ min: '50', max: '100' })
                onFilterChange({ minPrice: 50, maxPrice: 100 })
              }}
              className={filters.minPrice === 50 && filters.maxPrice === 100 ? 'bg-primary-50 border-primary-300' : ''}
            >
              50€ - 100€
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPriceRange({ min: '100', max: '200' })
                onFilterChange({ minPrice: 100, maxPrice: 200 })
              }}
              className={filters.minPrice === 100 && filters.maxPrice === 200 ? 'bg-primary-50 border-primary-300' : ''}
            >
              100€ - 200€
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPriceRange({ min: '200', max: '0' })
                onFilterChange({ minPrice: 200, maxPrice: 0 })
              }}
              className={filters.minPrice === 200 && filters.maxPrice === 0 ? 'bg-primary-50 border-primary-300' : ''}
            >
              &gt; 200€
            </Button>
          </div>
        </div>

        {/* Availability Filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Disponibilidad</h3>
          <label className="flex items-center">
            <input
              id="filter-availability"
              name="availability"
              type="checkbox"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              defaultChecked
              aria-label="Solo productos disponibles"
            />
            <span className="ml-2 text-sm text-gray-700">Solo productos disponibles</span>
          </label>
        </div>
      </div>
    </div>
  )
}