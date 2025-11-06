/**
 * Página de prueba para el Grid de Productos
 * Ruta: /test-product-grid
 * 
 * Esta página es solo para desarrollo y testing.
 * NO debe estar en producción.
 * 
 * Prueba los siguientes componentes:
 * - ProductGrid con diferentes números de productos
 * - ProductPagination con diferentes configuraciones
 * - Skeleton loading
 * - Estados vacíos
 */

'use client'

import { useState } from 'react'
import { ProductGrid } from '@/components/products/ProductGrid'
import { ProductPagination } from '@/components/products/ProductPagination'
import { Button } from '@/components/ui/Button'
import { Product } from '@/types'

// Datos de prueba
const mockProducts: Product[] = Array.from({ length: 24 }, (_, i) => ({
  id: `product-${i + 1}`,
  sku: `SKU-${i + 1}`,
  name: `Producto de Prueba ${i + 1} - Laptop Gaming Ultra Pro Max`,
  description: `Descripción del producto ${i + 1}`,
  our_price: 999.99 + (i * 100),
  original_price: i % 3 === 0 ? 1299.99 + (i * 100) : undefined,
  discount_percentage: i % 3 === 0 ? 23 : 0,
  markup_percentage: 15,
  images: ['/placeholder-product.svg'],
  rating: 4.5,
  review_count: 123 + i,
  is_active: i % 5 !== 0, // Algunos productos no disponibles
  providers: i % 5 !== 0 ? [{
    name: 'Amazon',
    price: 999.99 + (i * 100),
    shipping_cost: 0,
    availability: true,
    delivery_time: 2,
    last_updated: new Date().toISOString()
  }] : [],
  category: 'Laptops',
  subcategory: 'Gaming',
  brand: ['Dell', 'HP', 'Lenovo', 'Asus'][i % 4],
  specifications: {
    processor: 'Intel Core i7',
    ram: '16GB',
    storage: '512GB SSD'
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}))

export default function TestProductGridPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [productsPerPage] = useState(8)
  const [showEmpty, setShowEmpty] = useState(false)

  // Calcular productos de la página actual
  const indexOfLastProduct = currentPage * productsPerPage
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage
  const currentProducts = showEmpty ? [] : mockProducts.slice(indexOfFirstProduct, indexOfLastProduct)
  const totalPages = Math.ceil(mockProducts.length / productsPerPage)

  // Simular carga
  const handleSimulateLoading = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test: Grid de Productos
          </h1>
          <p className="text-gray-600">
            Página de prueba para verificar el funcionamiento del grid responsivo de productos
          </p>
        </div>

        {/* Controles de prueba */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Controles de Prueba
          </h2>
          <div className="flex flex-wrap gap-4">
            <Button
              variant="secondary"
              onClick={handleSimulateLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Cargando...' : 'Simular Carga (2s)'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowEmpty(!showEmpty)}
            >
              {showEmpty ? 'Mostrar Productos' : 'Mostrar Estado Vacío'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setCurrentPage(1)}
            >
              Ir a Primera Página
            </Button>
          </div>
        </div>

        {/* Información del estado actual */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            Estado Actual:
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Página actual: {currentPage} de {totalPages}</li>
            <li>• Productos por página: {productsPerPage}</li>
            <li>• Total de productos: {mockProducts.length}</li>
            <li>• Productos mostrados: {currentProducts.length}</li>
            <li>• Estado de carga: {isLoading ? 'Cargando' : 'Listo'}</li>
            <li>• Estado vacío: {showEmpty ? 'Sí' : 'No'}</li>
          </ul>
        </div>

        {/* Grid de productos */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Grid Responsivo (4-3-2-1 columnas)
          </h2>
          <ProductGrid
            products={currentProducts}
            isLoading={isLoading}
            skeletonCount={productsPerPage}
            onAddToCart={(product) => {
              alert(`Producto agregado al carrito: ${product.name}`)
            }}
            onQuickView={(product) => {
              alert(`Vista rápida: ${product.name}`)
            }}
          />
        </div>

        {/* Paginación */}
        {!isLoading && !showEmpty && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Paginación
            </h2>
            <ProductPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalProducts={mockProducts.length}
              productsPerPage={productsPerPage}
              onPageChange={setCurrentPage}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Información de breakpoints */}
        <div className="bg-gray-100 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Breakpoints Responsivos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="bg-white p-4 rounded border border-gray-200">
              <div className="font-semibold text-gray-900 mb-1">Móvil</div>
              <div className="text-gray-600">&lt; 640px</div>
              <div className="text-primary-600 font-medium">1 columna</div>
            </div>
            <div className="bg-white p-4 rounded border border-gray-200">
              <div className="font-semibold text-gray-900 mb-1">Tablet</div>
              <div className="text-gray-600">≥ 640px</div>
              <div className="text-primary-600 font-medium">2 columnas</div>
            </div>
            <div className="bg-white p-4 rounded border border-gray-200">
              <div className="font-semibold text-gray-900 mb-1">Desktop</div>
              <div className="text-gray-600">≥ 1024px</div>
              <div className="text-primary-600 font-medium">3 columnas</div>
            </div>
            <div className="bg-white p-4 rounded border border-gray-200">
              <div className="font-semibold text-gray-900 mb-1">Desktop XL</div>
              <div className="text-gray-600">≥ 1280px</div>
              <div className="text-primary-600 font-medium">4 columnas</div>
            </div>
          </div>
        </div>

        {/* Nota de desarrollo */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Nota:</strong> Esta es una página de prueba temporal. 
            Debe eliminarse antes de producción.
          </p>
        </div>
      </div>
    </div>
  )
}
