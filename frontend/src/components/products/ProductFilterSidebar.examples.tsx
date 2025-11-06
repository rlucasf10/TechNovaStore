/**
 * Ejemplos de uso del componente ProductFilterSidebar
 * 
 * Este archivo contiene ejemplos de cómo usar el componente en diferentes escenarios.
 * NO es un archivo de prueba, solo ejemplos de implementación.
 */

import { useState } from 'react'
import { ProductFilterSidebar, ProductFilters, CategoryOption, BrandOption, SpecOption } from './ProductFilterSidebar'

/**
 * Ejemplo 1: Uso básico con datos estáticos
 */
export function BasicExample() {
  const [filters, setFilters] = useState<ProductFilters>({
    categories: [],
    brands: [],
    priceRange: [0, 5000],
    specs: {},
    inStock: false
  })

  const categories: CategoryOption[] = [
    { id: '1', name: 'Laptops', slug: 'laptops', count: 45 },
    { id: '2', name: 'Componentes', slug: 'componentes', count: 123 },
    { id: '3', name: 'Periféricos', slug: 'perifericos', count: 78 },
    { id: '4', name: 'Móviles', slug: 'moviles', count: 34 },
    { id: '5', name: 'Tablets', slug: 'tablets', count: 28 }
  ]

  const brands: BrandOption[] = [
    { name: 'Apple', count: 23 },
    { name: 'Dell', count: 34 },
    { name: 'HP', count: 28 },
    { name: 'Lenovo', count: 31 },
    { name: 'Asus', count: 25 },
    { name: 'Acer', count: 19 },
    { name: 'MSI', count: 15 },
    { name: 'Samsung', count: 22 }
  ]

  const specs: SpecOption[] = [
    {
      category: 'processor',
      label: 'Procesador',
      options: [
        { value: 'intel-i3', label: 'Intel Core i3', count: 12 },
        { value: 'intel-i5', label: 'Intel Core i5', count: 25 },
        { value: 'intel-i7', label: 'Intel Core i7', count: 32 },
        { value: 'intel-i9', label: 'Intel Core i9', count: 8 },
        { value: 'amd-ryzen3', label: 'AMD Ryzen 3', count: 10 },
        { value: 'amd-ryzen5', label: 'AMD Ryzen 5', count: 18 },
        { value: 'amd-ryzen7', label: 'AMD Ryzen 7', count: 22 },
        { value: 'amd-ryzen9', label: 'AMD Ryzen 9', count: 6 }
      ]
    },
    {
      category: 'ram',
      label: 'Memoria RAM',
      options: [
        { value: '4gb', label: '4 GB', count: 15 },
        { value: '8gb', label: '8 GB', count: 35 },
        { value: '16gb', label: '16 GB', count: 45 },
        { value: '32gb', label: '32 GB', count: 18 },
        { value: '64gb', label: '64 GB', count: 5 }
      ]
    },
    {
      category: 'storage',
      label: 'Almacenamiento',
      options: [
        { value: '256gb-ssd', label: '256 GB SSD', count: 28 },
        { value: '512gb-ssd', label: '512 GB SSD', count: 42 },
        { value: '1tb-ssd', label: '1 TB SSD', count: 35 },
        { value: '2tb-ssd', label: '2 TB SSD', count: 12 },
        { value: '1tb-hdd', label: '1 TB HDD', count: 20 }
      ]
    },
    {
      category: 'screen',
      label: 'Pantalla',
      options: [
        { value: '13-inch', label: '13 pulgadas', count: 18 },
        { value: '14-inch', label: '14 pulgadas', count: 22 },
        { value: '15-inch', label: '15 pulgadas', count: 35 },
        { value: '17-inch', label: '17 pulgadas', count: 15 }
      ]
    }
  ]

  const handleApplyFilters = () => {
    console.log('Aplicando filtros:', filters)
    // Aquí iría la lógica para aplicar los filtros
  }

  const handleClearFilters = () => {
    setFilters({
      categories: [],
      brands: [],
      priceRange: [0, 5000],
      specs: {},
      inStock: false
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <ProductFilterSidebar
            categories={categories}
            brands={brands}
            specs={specs}
            filters={filters}
            priceRange={[0, 5000]}
            onFilterChange={setFilters}
            onApplyFilters={handleApplyFilters}
            onClearFilters={handleClearFilters}
            totalProducts={246}
          />
        </div>
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Filtros Seleccionados</h2>
            <pre className="bg-gray-50 p-4 rounded-md overflow-auto">
              {JSON.stringify(filters, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Ejemplo 2: Integración con API
 */
export function ApiIntegrationExample() {
  const [filters, setFilters] = useState<ProductFilters>({
    categories: [],
    brands: [],
    priceRange: [0, 5000],
    specs: {},
    inStock: false
  })

  const [filterOptions] = useState({
    categories: [] as CategoryOption[],
    brands: [] as BrandOption[],
    specs: [] as SpecOption[],
    priceRange: [0, 5000] as [number, number]
  })

  const [products, setProducts] = useState([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [loading, setLoading] = useState(false)

  // Cargar opciones de filtros al montar el componente
  // const loadFilterOptions = async () => {
  //   try {
  //     const response = await fetch('/api/products/filter-options')
  //     const data = await response.json()
  //     setFilterOptions(data)
  //   } catch (error) {
  //     console.error('Error cargando opciones de filtros:', error)
  //   }
  // }

  // Aplicar filtros y cargar productos
  const handleApplyFilters = async () => {
    setLoading(true)
    try {
      // Construir query params
      const params = new URLSearchParams()
      
      filters.categories.forEach(cat => params.append('categories[]', cat))
      filters.brands.forEach(brand => params.append('brands[]', brand))
      
      if (filters.priceRange[0] > 0) {
        params.append('minPrice', filters.priceRange[0].toString())
      }
      if (filters.priceRange[1] < 5000) {
        params.append('maxPrice', filters.priceRange[1].toString())
      }
      
      Object.entries(filters.specs).forEach(([category, values]) => {
        values.forEach(value => {
          params.append(`specs[${category}][]`, value)
        })
      })
      
      if (filters.inStock) {
        params.append('inStock', 'true')
      }

      const response = await fetch(`/api/products?${params.toString()}`)
      const data = await response.json()
      
      setProducts(data.products)
      setTotalProducts(data.total)
    } catch (error) {
      console.error('Error aplicando filtros:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClearFilters = () => {
    setFilters({
      categories: [],
      brands: [],
      priceRange: filterOptions.priceRange,
      specs: {},
      inStock: false
    })
    handleApplyFilters()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <ProductFilterSidebar
            categories={filterOptions.categories}
            brands={filterOptions.brands}
            specs={filterOptions.specs}
            filters={filters}
            priceRange={filterOptions.priceRange}
            onFilterChange={setFilters}
            onApplyFilters={handleApplyFilters}
            onClearFilters={handleClearFilters}
            totalProducts={totalProducts}
          />
        </div>
        <div className="lg:col-span-3">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Cargando productos...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product: any) => (
                <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-primary-600 font-bold mt-2">€{product.price}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Ejemplo 3: Sincronización con URL
 */
export function UrlSyncExample() {
  const [filters, setFilters] = useState<ProductFilters>({
    categories: [],
    brands: [],
    priceRange: [0, 5000],
    specs: {},
    inStock: false
  })

  // Leer filtros de la URL al montar
  // const loadFiltersFromUrl = () => {
  //   const params = new URLSearchParams(window.location.search)
  //   
  //   const categories = params.getAll('categories[]')
  //   const brands = params.getAll('brands[]')
  //   const minPrice = Number(params.get('minPrice')) || 0
  //   const maxPrice = Number(params.get('maxPrice')) || 5000
  //   const inStock = params.get('inStock') === 'true'
  //   
  //   // Parsear specs
  //   const specs: Record<string, string[]> = {}
  //   params.forEach((value, key) => {
  //     const match = key.match(/specs\[(\w+)\]\[\]/)
  //     if (match) {
  //       const category = match[1]
  //       if (!specs[category]) specs[category] = []
  //       specs[category].push(value)
  //     }
  //   })
  //
  //   setFilters({
  //     categories,
  //     brands,
  //     priceRange: [minPrice, maxPrice],
  //     specs,
  //     inStock
  //   })
  // }

  // Actualizar URL cuando cambian los filtros
  const updateUrl = (newFilters: ProductFilters) => {
    const params = new URLSearchParams()
    
    newFilters.categories.forEach(cat => params.append('categories[]', cat))
    newFilters.brands.forEach(brand => params.append('brands[]', brand))
    
    if (newFilters.priceRange[0] > 0) {
      params.append('minPrice', newFilters.priceRange[0].toString())
    }
    if (newFilters.priceRange[1] < 5000) {
      params.append('maxPrice', newFilters.priceRange[1].toString())
    }
    
    Object.entries(newFilters.specs).forEach(([category, values]) => {
      values.forEach(value => {
        params.append(`specs[${category}][]`, value)
      })
    })
    
    if (newFilters.inStock) {
      params.append('inStock', 'true')
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.pushState({}, '', newUrl)
  }

  const handleFilterChange = (newFilters: ProductFilters) => {
    setFilters(newFilters)
    updateUrl(newFilters)
  }

  const handleApplyFilters = () => {
    console.log('Aplicando filtros:', filters)
    // Aquí iría la lógica para aplicar los filtros
  }

  const handleClearFilters = () => {
    const clearedFilters = {
      categories: [],
      brands: [],
      priceRange: [0, 5000] as [number, number],
      specs: {},
      inStock: false
    }
    setFilters(clearedFilters)
    updateUrl(clearedFilters)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <ProductFilterSidebar
            categories={[]}
            brands={[]}
            specs={[]}
            filters={filters}
            priceRange={[0, 5000]}
            onFilterChange={handleFilterChange}
            onApplyFilters={handleApplyFilters}
            onClearFilters={handleClearFilters}
            totalProducts={0}
          />
        </div>
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">URL Actual</h2>
            <code className="bg-gray-50 p-4 rounded-md block overflow-auto">
              {window.location.href}
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}
