'use client'

import { useState, useMemo } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { Button, Loading } from '@/components/ui'
import { ProductCard, ProductFilters, SearchBar } from './index'

interface ProductCatalogProps {
  initialCategory?: string
  initialSearch?: string
}

interface FilterState {
  category: string
  subcategory: string
  brand: string
  minPrice: number
  maxPrice: number
  sortBy: string
  search: string
}

export function ProductCatalog({ initialCategory = '', initialSearch = '' }: ProductCatalogProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<FilterState>({
    category: initialCategory,
    subcategory: '',
    brand: '',
    minPrice: 0,
    maxPrice: 0,
    sortBy: 'name',
    search: initialSearch
  })

  const { data: categoriesData, isLoading: categoriesLoading } = useCategories()
  const { data: productsData, isLoading: productsLoading, error } = useProducts({
    page: currentPage,
    limit: 12,
    category: filters.category || undefined,
    search: filters.search || undefined,
    sort: filters.sortBy,
    minPrice: filters.minPrice > 0 ? filters.minPrice : undefined,
    maxPrice: filters.maxPrice > 0 ? filters.maxPrice : undefined
  })

  const categories = categoriesData || []
  const products = useMemo(() => productsData?.data || [], [productsData?.data])
  const pagination = productsData?.pagination

  // Get unique brands and subcategories from current products
  const availableFilters = useMemo(() => {
    const brands = new Set<string>()
    const subcategories = new Set<string>()

    products.forEach(product => {
      if (product.brand) brands.add(product.brand)
      if (product.subcategory) subcategories.add(product.subcategory)
    })

    return {
      brands: Array.from(brands).sort(),
      subcategories: Array.from(subcategories).sort()
    }
  }, [products])

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handleSearch = (searchTerm: string) => {
    handleFilterChange({ search: searchTerm })
  }

  const clearFilters = () => {
    setFilters({
      category: '',
      subcategory: '',
      brand: '',
      minPrice: 0,
      maxPrice: 0,
      sortBy: 'name',
      search: ''
    })
    setCurrentPage(1)
  }

  if (categoriesLoading) {
    return <Loading />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Catálogo de Productos
        </h1>

        {/* Search Bar */}
        <SearchBar
          onSearch={handleSearch}
          initialValue={filters.search}
          placeholder="Buscar productos..."
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <ProductFilters
            categories={categories}
            brands={availableFilters.brands}
            subcategories={availableFilters.subcategories}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-gray-600">
              {pagination && (
                <>
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1}-
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} productos
                </>
              )}
            </div>

            {/* Sort Options */}
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
              className="rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="name">Nombre A-Z</option>
              <option value="-name">Nombre Z-A</option>
              <option value="our_price">Precio: Menor a Mayor</option>
              <option value="-our_price">Precio: Mayor a Menor</option>
              <option value="-created_at">Más Recientes</option>
              <option value="created_at">Más Antiguos</option>
            </select>
          </div>

          {/* Products Grid */}
          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">Error al cargar los productos</p>
              <Button onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No se encontraron productos</p>
              <Button onClick={clearFilters} variant="secondary">
                Limpiar filtros
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>

                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    )
                  })}

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                    disabled={currentPage === pagination.pages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}