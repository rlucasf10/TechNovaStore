'use client'

import { useState } from 'react'
import { Pagination, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

/**
 * Página de demostración del componente Pagination
 */
export default function PaginationExamplesPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Componente Pagination
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Ejemplos de uso del componente de paginación con diferentes configuraciones
                    </p>
                </div>

                {/* Ejemplos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <BasicPaginationExample />
                    <ManyPagesPaginationExample />
                    <NoPageInfoExample />
                    <DisabledPaginationExample />
                    <FewPagesPaginationExample />
                    <FirstPageExample />
                    <LastPageExample />
                    <CustomizedPaginationExample />
                </div>

                {/* Ejemplo grande: Catálogo de productos */}
                <ProductCatalogExample />
            </div>
        </div>
    )
}

/**
 * Ejemplo 1: Paginación básica
 */
function BasicPaginationExample() {
    const [currentPage, setCurrentPage] = useState(1)
    const totalPages = 10

    return (
        <Card>
            <CardHeader>
                <CardTitle>Paginación Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                    Ejemplo simple con 10 páginas
                </p>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />

                <div className="text-sm text-gray-500">
                    Página actual: <span className="font-medium">{currentPage}</span>
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * Ejemplo 2: Paginación con muchas páginas
 */
function ManyPagesPaginationExample() {
    const [currentPage, setCurrentPage] = useState(15)
    const totalPages = 100

    return (
        <Card>
            <CardHeader>
                <CardTitle>Muchas Páginas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                    Ejemplo con 100 páginas mostrando ellipsis
                </p>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />

                <div className="text-sm text-gray-500">
                    Página actual: <span className="font-medium">{currentPage}</span> de {totalPages}
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * Ejemplo 3: Sin información de página
 */
function NoPageInfoExample() {
    const [currentPage, setCurrentPage] = useState(5)
    const totalPages = 20

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sin Información de Página</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                    Paginación sin el texto &quot;Página X de Y&quot;
                </p>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    showPageInfo={false}
                />
            </CardContent>
        </Card>
    )
}

/**
 * Ejemplo 4: Paginación deshabilitada
 */
function DisabledPaginationExample() {
    const [currentPage] = useState(5)
    const totalPages = 20

    return (
        <Card>
            <CardHeader>
                <CardTitle>Paginación Deshabilitada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                    Útil durante la carga de datos
                </p>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={() => { }}
                    disabled={true}
                />
            </CardContent>
        </Card>
    )
}

/**
 * Ejemplo 5: Pocas páginas
 */
function FewPagesPaginationExample() {
    const [currentPage, setCurrentPage] = useState(2)
    const totalPages = 5

    return (
        <Card>
            <CardHeader>
                <CardTitle>Pocas Páginas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                    Con 5 páginas o menos, se muestran todas sin ellipsis
                </p>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </CardContent>
        </Card>
    )
}

/**
 * Ejemplo 6: Primera página
 */
function FirstPageExample() {
    const [currentPage, setCurrentPage] = useState(1)
    const totalPages = 20

    return (
        <Card>
            <CardHeader>
                <CardTitle>Primera Página</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                    Botones &quot;Primera&quot; y &quot;Anterior&quot; deshabilitados
                </p>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </CardContent>
        </Card>
    )
}

/**
 * Ejemplo 7: Última página
 */
function LastPageExample() {
    const [currentPage, setCurrentPage] = useState(20)
    const totalPages = 20

    return (
        <Card>
            <CardHeader>
                <CardTitle>Última Página</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                    Botones &quot;Siguiente&quot; y &quot;Última&quot; deshabilitados
                </p>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </CardContent>
        </Card>
    )
}

/**
 * Ejemplo 8: Personalizado
 */
function CustomizedPaginationExample() {
    const [currentPage, setCurrentPage] = useState(8)
    const totalPages = 50

    return (
        <Card>
            <CardHeader>
                <CardTitle>Paginación Personalizada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
        </Card>
    )
}

/**
 * Ejemplo 9: Catálogo de productos
 */
function ProductCatalogExample() {
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
            // Scroll al inicio de la sección
            document.getElementById('product-catalog')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            })
        }, 500)
    }

    return (
        <Card id="product-catalog">
            <CardHeader>
                <CardTitle>Ejemplo: Catálogo de Productos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="text-sm text-gray-600">
                    Simulación de un catálogo de productos con paginación
                </p>

                {/* Simulación de grid de productos */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: productsPerPage }).map((_, i) => (
                        <div
                            key={i}
                            className={`
                h-64 bg-gray-100 rounded-lg flex flex-col items-center justify-center
                transition-all duration-200
                ${isLoading ? 'animate-pulse' : 'hover:shadow-md'}
              `}
                        >
                            {isLoading ? (
                                <span className="text-gray-400 text-sm">Cargando...</span>
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-gray-300 rounded-lg mb-2" />
                                    <span className="text-gray-600 text-sm font-medium">
                                        Producto {(currentPage - 1) * productsPerPage + i + 1}
                                    </span>
                                    <span className="text-primary-600 text-sm font-bold mt-1">
                                        ${((((currentPage - 1) * productsPerPage + i + 1) * 37) % 900 + 100).toFixed(2)}
                                    </span>
                                </>
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
            </CardContent>
        </Card>
    )
}
