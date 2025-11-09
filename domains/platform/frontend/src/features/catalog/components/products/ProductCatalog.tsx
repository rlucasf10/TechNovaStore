'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useProducts } from '@/catalog'
import { useCategories } from '@/catalog'
import { Button, Loading } from '@/ui'
import { ProductGrid, ProductFilterSidebar, SearchBar, ProductPagination, ProductToolbar } from './index'
import type { ProductFilters } from './ProductFilterSidebar'

interface ProductCatalogProps {
  initialCategory?: string
  initialSearch?: string
}

interface FilterState {
  categories: string[]
  brands: string[]
  priceRange: [number, number]
  specs: Record<string, string[]>
  inStock: boolean
  sortBy: string
  search: string
}

export function ProductCatalog({ initialCategory = '', initialSearch = '' }: ProductCatalogProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Inicializar estado desde URL o props
  const getInitialFilters = (): FilterState => {
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || []
    if (initialCategory && categories.length === 0) {
      categories.push(initialCategory)
    }
    
    return {
      categories,
      brands: searchParams.get('brands')?.split(',').filter(Boolean) || [],
      priceRange: [
        Number(searchParams.get('minPrice')) || 0,
        Number(searchParams.get('maxPrice')) || 5000
      ],
      specs: {},
      inStock: searchParams.get('inStock') === 'true',
      sortBy: searchParams.get('sortBy') || 'name',
      search: searchParams.get('search') || initialSearch
    }
  }

  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>((searchParams.get('view') as 'grid' | 'list') || 'grid')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>(getInitialFilters())

  const { data: categoriesData, isLoading: categoriesLoading } = useCategories()
  const { data: productsData, isLoading: productsLoading, error } = useProducts({
    page: currentPage,
    limit: 12,
    category: filters.categories.length > 0 ? filters.categories : undefined,
    brand: filters.brands.length > 0 ? filters.brands : undefined,
    search: filters.search || undefined,
    sortBy: filters.sortBy as any,
    minPrice: filters.priceRange[0] > 0 ? filters.priceRange[0] : undefined,
    maxPrice: filters.priceRange[1] < 5000 ? filters.priceRange[1] : undefined,
    inStock: filters.inStock ? true : undefined
  })

  const categories = categoriesData || []
  const products = useMemo(() => productsData?.data || [], [productsData?.data])
  const pagination = productsData?.pagination

  // Get unique brands, subcategories and specifications from current products
  const availableFilters = useMemo(() => {
    const brands = new Set<string>()
    const subcategories = new Set<string>()
    const specifications: Record<string, Set<string>> = {}

    // Solo extraer de los productos actuales (ya filtrados por el backend)
    products.forEach((product: any) => {
      if (product.brand) brands.add(product.brand)
      if (product.subcategory) subcategories.add(product.subcategory)
      
      // Extraer especificaciones técnicas solo de productos visibles
      if (product.specifications && typeof product.specifications === 'object') {
        Object.entries(product.specifications).forEach(([key, value]) => {
          // Filtrar especificaciones irrelevantes o muy técnicas
          const excludedSpecs = ['cores', 'threads', 'id', '_id', 'createdAt', 'updatedAt']
          if (excludedSpecs.includes(key.toLowerCase())) return
          
          if (!specifications[key]) {
            specifications[key] = new Set<string>()
          }
          if (value) {
            specifications[key].add(String(value))
          }
        })
      }
    })

    // Diccionario de traducción de especificaciones técnicas
    const specTranslations: Record<string, string> = {
      'processor': 'Procesador',
      'ram': 'Memoria RAM',
      'storage': 'Almacenamiento',
      'graphics_card': 'Tarjeta Gráfica',
      'screen_size': 'Tamaño de Pantalla',
      'resolution': 'Resolución',
      'battery': 'Batería',
      'weight': 'Peso',
      'connectivity': 'Conectividad',
      'conexiones': 'Conexiones',
      'ports': 'Puertos',
      'operating_system': 'Sistema Operativo',
      'warranty': 'Garantía',
      'disk_type': 'Tipo de Disco',
      'tecnologia_disco_duro': 'Tecnología de Disco Duro',
      'disco_duro': 'Disco Duro',
      'velocidad_rotacion': 'Velocidad de Rotación',
      'pulgadas': 'Pulgadas',
      'plataforma': 'Plataforma',
      'interface': 'Interfaz',
      'form_factor': 'Factor de Forma'
    }

    // Convertir Sets a arrays ordenados con la estructura correcta para ProductFilterSidebar
    // Solo incluir especificaciones que tengan al menos 2 valores diferentes
    const specsArray = Object.entries(specifications)
      .filter(([_, values]) => values.size >= 1) // Mostrar incluso si hay 1 valor
      .map(([name, values]) => ({
        category: name,
        label: specTranslations[name.toLowerCase()] || name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' '),
        options: Array.from(values).sort().map(value => ({
          value,
          label: value,
          count: 0 // TODO: calcular el conteo real de productos por especificación
        }))
      }))

    return {
      brands: Array.from(brands).sort(),
      subcategories: Array.from(subcategories).sort(),
      specifications: specsArray
    }
  }, [products])

  // Función para actualizar URL con los filtros actuales
  const updateURL = (newFilters: FilterState, page: number, view: 'grid' | 'list') => {
    const params = new URLSearchParams()

    // Agregar filtros a la URL solo si tienen valor
    if (newFilters.categories.length > 0) params.set('categories', newFilters.categories.join(','))
    if (newFilters.brands.length > 0) params.set('brands', newFilters.brands.join(','))
    if (newFilters.priceRange[0] > 0) params.set('minPrice', newFilters.priceRange[0].toString())
    if (newFilters.priceRange[1] < 5000) params.set('maxPrice', newFilters.priceRange[1].toString())
    if (newFilters.inStock) params.set('inStock', 'true')
    if (newFilters.sortBy && newFilters.sortBy !== 'name') params.set('sortBy', newFilters.sortBy)
    if (newFilters.search) params.set('search', newFilters.search)
    if (page > 1) params.set('page', page.toString())
    if (view !== 'grid') params.set('view', view)

    // Actualizar URL sin recargar la página
    const newURL = params.toString() ? `?${params.toString()}` : window.location.pathname
    router.push(newURL, { scroll: false })
  }

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    setCurrentPage(1) // Reset to first page when filters change
    updateURL(updatedFilters, 1, viewMode)
  }

  const handleSearch = (searchTerm: string) => {
    handleFilterChange({ search: searchTerm })
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateURL(filters, page, viewMode)
    // Scroll suave al inicio del catálogo
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    updateURL(filters, currentPage, mode)
  }

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      categories: [],
      brands: [],
      priceRange: [0, 5000],
      specs: {},
      inStock: false,
      sortBy: 'name',
      search: ''
    }
    setFilters(clearedFilters)
    setCurrentPage(1)
    updateURL(clearedFilters, 1, viewMode)
  }

  // Adaptador para convertir ProductFilters a FilterState
  const handleSidebarFilterChange = (newFilters: ProductFilters) => {
    const updatedFilters: FilterState = {
      ...filters,
      categories: newFilters.categories,
      brands: newFilters.brands,
      priceRange: newFilters.priceRange,
      specs: newFilters.specs,
      inStock: newFilters.inStock
    }
    setFilters(updatedFilters)
    setCurrentPage(1)
    updateURL(updatedFilters, 1, viewMode)
  }

  // Sincronizar con cambios en la URL (navegación del navegador)
  useEffect(() => {
    const handlePopState = () => {
      const newFilters = getInitialFilters()
      setFilters(newFilters)
      setCurrentPage(Number(searchParams.get('page')) || 1)
      setViewMode((searchParams.get('view') as 'grid' | 'list') || 'grid')
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [searchParams])

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
        {/* Filters Sidebar - Desktop */}
        <aside className="hidden lg:block lg:w-64 flex-shrink-0">
          <ProductFilterSidebar
            categories={categories.map(cat => ({
              id: cat.id,
              name: cat.name,
              slug: cat.slug,
              count: 0
            }))}
            brands={availableFilters.brands.map(brand => ({
              name: brand,
              count: 0
            }))}
            specs={availableFilters.specifications}
            filters={filters}
            priceRange={[0, 5000]}
            onFilterChange={handleSidebarFilterChange}
            onApplyFilters={() => {}}
            onClearFilters={clearFilters}
            totalProducts={pagination?.total || 0}
          />
        </aside>

        {/* Filters Sidebar - Mobile Modal */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowMobileFilters(false)}
              aria-hidden="true"
            />

            {/* Modal */}
            <div className="fixed inset-y-0 left-0 w-full max-w-sm bg-white shadow-xl overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    aria-label="Cerrar filtros"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <ProductFilterSidebar
                  categories={categories.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    slug: cat.slug,
                    count: 0
                  }))}
                  brands={availableFilters.brands.map(brand => ({
                    name: brand,
                    count: 0
                  }))}
                  specs={availableFilters.specifications}
                  filters={filters}
                  priceRange={[0, 5000]}
                  onFilterChange={handleSidebarFilterChange}
                  onApplyFilters={() => setShowMobileFilters(false)}
                  onClearFilters={clearFilters}
                  totalProducts={pagination?.total || 0}
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1">
          {/* Toolbar con contador, ordenamiento y vista */}
          <ProductToolbar
            totalProducts={pagination?.total || 0}
            currentSort={filters.sortBy}
            onSortChange={(sort) => handleFilterChange({ sortBy: sort })}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            onOpenFilters={() => setShowMobileFilters(true)}
            showFiltersButton={true}
          />

          {/* Products Grid */}
          {error ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Error al cargar los productos
              </h3>
              <p className="text-gray-600 mb-4">
                Hubo un problema al cargar el catálogo. Por favor, intenta de nuevo.
              </p>
              <Button onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </div>
          ) : (
            <>
              {/* Grid de productos con skeleton loading */}
              <ProductGrid
                products={products}
                isLoading={productsLoading}
                skeletonCount={12}
                className="mb-8"
                viewMode={viewMode}
              />

              {/* Paginación mejorada */}
              {!productsLoading && pagination && pagination.pages > 1 && (
                <ProductPagination
                  currentPage={currentPage}
                  totalPages={pagination.pages}
                  totalProducts={pagination.total}
                  productsPerPage={pagination.limit}
                  onPageChange={handlePageChange}
                  isLoading={productsLoading}
                />
              )}

              {/* Botón para limpiar filtros si no hay productos */}
              {!productsLoading && products.length === 0 && (
                <div className="text-center mt-8">
                  <Button onClick={clearFilters} variant="secondary">
                    Limpiar filtros
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