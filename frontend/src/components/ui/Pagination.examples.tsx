/**
 * Ejemplos de uso del componente Pagination
 * 
 * Este archivo muestra diferentes casos de uso del componente Pagination.
 * NO es un archivo de tests, sino una guía de implementación.
 */

import { useState } from 'react'
import { Pagination } from './Pagination'

/**
 * Ejemplo 1: Paginación básica
 */
export function BasicPaginationExample() {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = 10

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Paginación Básica</h3>
      <p className="text-sm text-gray-600">
        Ejemplo simple con 10 páginas
      </p>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
      
      <div className="text-sm text-gray-500">
        Página actual: {currentPage}
      </div>
    </div>
  )
}

/**
 * Ejemplo 2: Paginación con muchas páginas
 */
export function ManyPagesPaginationExample() {
  const [currentPage, setCurrentPage] = useState(15)
  const totalPages = 100

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Paginación con Muchas Páginas</h3>
      <p className="text-sm text-gray-600">
        Ejemplo con 100 páginas mostrando ellipsis
      </p>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
      
      <div className="text-sm text-gray-500">
        Página actual: {currentPage} de {totalPages}
      </div>
    </div>
  )
}

/**
 * Ejemplo 3: Paginación sin información de página
 */
export function NoPageInfoExample() {
  const [currentPage, setCurrentPage] = useState(5)
  const totalPages = 20

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Sin Información de Página</h3>
      <p className="text-sm text-gray-600">
        Paginación sin el texto "Página X de Y"
      </p>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        showPageInfo={false}
      />
    </div>
  )
}

/**
 * Ejemplo 4: Paginación deshabilitada
 */
export function DisabledPaginationExample() {
  const [currentPage] = useState(5)
  const totalPages = 20

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Paginación Deshabilitada</h3>
      <p className="text-sm text-gray-600">
        Útil durante la carga de datos
      </p>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={() => {}}
        disabled={true}
      />
    </div>
  )
}

/**
 * Ejemplo 5: Paginación con pocas páginas
 */
export function FewPagesPaginationExample() {
  const [currentPage, setCurrentPage] = useState(2)
  const totalPages = 5

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Pocas Páginas</h3>
      <p className="text-sm text-gray-600">
        Con 5 páginas o menos, se muestran todas sin ellipsis
      </p>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}

/**
 * Ejemplo 6: Paginación en primera página
 */
export function FirstPageExample() {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = 20

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Primera Página</h3>
      <p className="text-sm text-gray-600">
        Botones "Primera" y "Anterior" deshabilitados
      </p>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}

/**
 * Ejemplo 7: Paginación en última página
 */
export function LastPageExample() {
  const [currentPage, setCurrentPage] = useState(20)
  const totalPages = 20

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Última Página</h3>
      <p className="text-sm text-gray-600">
        Botones "Siguiente" y "Última" deshabilitados
      </p>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}

/**
 * Ejemplo 8: Uso en catálogo de productos
 */
export function ProductCatalogExample() {
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  
  const totalProducts = 250
  const productsPerPage = 12
  const totalPages = Math.ceil(totalProducts / productsPerPage)

  const handlePageChange = (page: number) => {
    setIsLoading(true)
    setCurrentPage(page)
    
    // Simular carga de datos
    setTimeout(() => {
      setIsLoading(false)
      // Scroll al inicio de la página
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 500)
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Ejemplo: Catálogo de Productos</h3>
      
      {/* Simulación de grid de productos */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: productsPerPage }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-64 bg-gray-100 rounded-lg flex items-center justify-center',
              isLoading && 'animate-pulse'
            )}
          >
            {isLoading ? (
              <span className="text-gray-400">Cargando...</span>
            ) : (
              <span className="text-gray-600">
                Producto {(currentPage - 1) * productsPerPage + i + 1}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Paginación */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        disabled={isLoading}
      />
      
      <div className="text-sm text-gray-500 text-center">
        Mostrando {(currentPage - 1) * productsPerPage + 1} -{' '}
        {Math.min(currentPage * productsPerPage, totalProducts)} de {totalProducts} productos
      </div>
    </div>
  )
}

/**
 * Ejemplo 9: Uso con URL query params
 */
export function URLQueryParamsExample() {
  // En una aplicación real, usarías useSearchParams de Next.js
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = 50

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    
    // Actualizar URL sin recargar la página
    const url = new URL(window.location.href)
    url.searchParams.set('page', page.toString())
    window.history.pushState({}, '', url.toString())
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Con URL Query Params</h3>
      <p className="text-sm text-gray-600">
        La página actual se sincroniza con la URL (?page=X)
      </p>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
      
      <div className="text-sm text-gray-500">
        URL actual: ?page={currentPage}
      </div>
    </div>
  )
}

/**
 * Ejemplo 10: Paginación personalizada
 */
export function CustomizedPaginationExample() {
  const [currentPage, setCurrentPage] = useState(8)
  const totalPages = 50

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Paginación Personalizada</h3>
      <p className="text-sm text-gray-600">
        Con menos botones visibles (maxButtons=5)
      </p>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        maxButtons={5}
        className="bg-gray-50 p-4 rounded-lg"
      />
    </div>
  )
}

// Helper para cn (si no está disponible)
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
