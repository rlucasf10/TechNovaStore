/**
 * Página de prueba para sincronización con URL
 * Ruta: /test-url-sync
 * 
 * Esta página es solo para desarrollo y testing.
 * NO debe estar en producción.
 * 
 * Demuestra:
 * - Sincronización de filtros con URL query params
 * - Navegación del navegador (back/forward)
 * - URLs compartibles con filtros aplicados
 */

'use client'

import { useURLFilters } from '@/hooks/useURLFilters'
import { Button } from '@/components/ui'

interface TestFilters {
  category: string
  brand: string
  minPrice: number
  maxPrice: number
  search: string
  sortBy: string
  inStock: boolean
}

export default function TestURLSyncPage() {
  const { filters, updateFilters, clearFilters } = useURLFilters<TestFilters>({
    category: '',
    brand: '',
    minPrice: 0,
    maxPrice: 0,
    search: '',
    sortBy: 'name',
    inStock: false
  })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Test: Sincronización con URL
        </h1>

        {/* URL Actual */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            URL Actual
          </h2>
          <code className="block bg-gray-50 p-4 rounded-md overflow-auto text-sm">
            {typeof window !== 'undefined' ? window.location.href : ''}
          </code>
          <p className="text-sm text-gray-600 mt-2">
            ✓ Esta URL se puede compartir y mantiene todos los filtros aplicados
          </p>
        </div>

        {/* Controles de Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Controles de Filtros
          </h2>

          <div className="space-y-4">
            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={filters.category}
                onChange={(e) => updateFilters({ category: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">Todas</option>
                <option value="laptops">Laptops</option>
                <option value="componentes">Componentes</option>
                <option value="perifericos">Periféricos</option>
                <option value="moviles">Móviles</option>
              </select>
            </div>

            {/* Marca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marca
              </label>
              <select
                value={filters.brand}
                onChange={(e) => updateFilters({ brand: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">Todas</option>
                <option value="apple">Apple</option>
                <option value="dell">Dell</option>
                <option value="hp">HP</option>
                <option value="lenovo">Lenovo</option>
              </select>
            </div>

            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Búsqueda
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                placeholder="Buscar productos..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            {/* Rango de Precio */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Mínimo
                </label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => updateFilters({ minPrice: Number(e.target.value) })}
                  min="0"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Máximo
                </label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => updateFilters({ maxPrice: Number(e.target.value) })}
                  min="0"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Ordenamiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordenar por
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilters({ sortBy: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="name">Nombre A-Z</option>
                <option value="-name">Nombre Z-A</option>
                <option value="price">Precio: Menor a Mayor</option>
                <option value="-price">Precio: Mayor a Menor</option>
              </select>
            </div>

            {/* Solo en stock */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="inStock"
                checked={filters.inStock}
                onChange={(e) => updateFilters({ inStock: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="inStock" className="ml-2 text-sm text-gray-700">
                Solo productos en stock
              </label>
            </div>

            {/* Botón limpiar */}
            <div className="pt-4">
              <Button onClick={clearFilters} variant="secondary" className="w-full">
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Estado Actual */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Estado Actual de Filtros
          </h2>
          <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm">
            {JSON.stringify(filters, null, 2)}
          </pre>
        </div>

        {/* Instrucciones */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">
            Instrucciones de Prueba
          </h2>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>✓ Cambia cualquier filtro y observa cómo se actualiza la URL</li>
            <li>✓ Copia la URL y ábrela en una nueva pestaña - los filtros se mantienen</li>
            <li>✓ Usa los botones atrás/adelante del navegador - los filtros se sincronizan</li>
            <li>✓ Haz clic en "Limpiar Filtros" para resetear todo</li>
            <li>✓ Los valores por defecto no aparecen en la URL (URL más limpia)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
