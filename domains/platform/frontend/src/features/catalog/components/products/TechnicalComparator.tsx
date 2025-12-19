'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { useComparisonStore } from '@/store/comparison.store'
import { Button } from '@/ui'
import { AnimatedModal } from '@/ui/AnimatedModal'
import { useCartStore } from '@/commerce'
import { Product } from '@/types'

// ✅ PERFORMANCE: Usar dynamic imports para librerías pesadas (jspdf ~500KB, html2canvas ~200KB)
// Estas librerías solo se cargan cuando el usuario exporta, no al cargar la página

export function TechnicalComparator() {
  const { products, isOpen, closeModal, removeProduct, clearAll } = useComparisonStore()
  const addItem = useCartStore((state) => state.addItem)
  const tableRef = useRef<HTMLDivElement>(null)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  // Extraer todas las especificaciones únicas de todos los productos
  const getAllSpecKeys = () => {
    const allKeys = new Set<string>()
    products.forEach(product => {
      if (product.specifications) {
        Object.keys(product.specifications).forEach(key => allKeys.add(key))
      }
    })
    return Array.from(allKeys).sort()
  }

  const specKeys = getAllSpecKeys()

  // Determinar si una especificación tiene diferencias significativas
  const hasDifferences = (specKey: string) => {
    const values = products.map(p => 
      p.specifications?.[specKey] ? String(p.specifications[specKey]) : null
    ).filter(Boolean)
    
    const uniqueValues = new Set(values)
    return uniqueValues.size > 1
  }

  // Exportar como PDF
  // ✅ PERFORMANCE: Cargar jspdf y html2canvas dinámicamente solo cuando se necesitan
  const exportAsPDF = async () => {
    if (!tableRef.current) return

    try {
      // Cargar librerías dinámicamente (solo cuando el usuario exporta)
      const [html2canvas, jsPDF] = await Promise.all([
        import('html2canvas').then(mod => mod.default),
        import('jspdf').then(mod => mod.default),
      ]);

      const canvas = await html2canvas(tableRef.current, {
        scale: 2,
        logging: false,
        useCORS: true
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      const imgWidth = 297 // A4 landscape width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      pdf.save(`comparacion-productos-${Date.now()}.pdf`)
    } catch (error) {
      console.error('Error al exportar PDF:', error)
    }
  }

  // Exportar como imagen
  // ✅ PERFORMANCE: Cargar html2canvas dinámicamente solo cuando se necesita
  const exportAsImage = async () => {
    if (!tableRef.current) return

    try {
      // Cargar librería dinámicamente (solo cuando el usuario exporta)
      const html2canvas = await import('html2canvas').then(mod => mod.default);

      const canvas = await html2canvas(tableRef.current, {
        scale: 2,
        logging: false,
        useCORS: true
      })

      const link = document.createElement('a')
      link.download = `comparacion-productos-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Error al exportar imagen:', error)
    }
  }

  const handleAddToCart = (product: Product) => {
    addItem({
      id: `cart-${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: product.our_price,
      image: product.images[0] || '/placeholder-product.svg',
      sku: product.sku,
      brand: product.brand
    }, 1)
  }

  if (products.length === 0) {
    return (
      <AnimatedModal isOpen={isOpen} onClose={closeModal} title="Comparador Técnico" size="xl" animationType="scale">
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay productos para comparar
          </h3>
          <p className="text-gray-600">
            Agrega productos desde el catálogo o la página de detalle para comenzar a comparar
          </p>
        </div>
      </AnimatedModal>
    )
  }

  return (
    <AnimatedModal isOpen={isOpen} onClose={closeModal} title="Comparador Técnico" size="full" animationType="scale">
      <div className="flex flex-col h-full">
        {/* Header con acciones */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Comparación de Productos ({products.length}/{5})
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Compara especificaciones técnicas lado a lado
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={exportAsImage}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Exportar Imagen
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={exportAsPDF}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Exportar PDF
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={clearAll}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Limpiar Todo
            </Button>
          </div>
        </div>

        {/* Tabla de comparación con scroll horizontal */}
        <div className="flex-1 overflow-auto" ref={tableRef}>
          <table className="w-full border-collapse bg-white">
            {/* Sticky header con imágenes de productos */}
            <thead className="sticky top-0 z-10 bg-white shadow-sm">
              <tr>
                <th className="sticky left-0 z-20 bg-gray-100 border-b-2 border-r-2 border-gray-300 p-4 text-left font-semibold text-gray-700 min-w-[200px]">
                  Especificación
                </th>
                {products.map((product) => (
                  <th
                    key={product.id}
                    className="border-b-2 border-gray-300 p-4 min-w-[250px] max-w-[300px]"
                  >
                    <div className="flex flex-col items-center gap-3">
                      {/* Imagen del producto */}
                      <div className="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                          src={product.images[0] || '/placeholder-product.svg'}
                          alt={product.name}
                          width={128}
                          height={128}
                          className="w-full h-full object-contain"
                          loading="lazy"
                          placeholder="blur"
                          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
                        />
                      </div>

                      {/* Nombre del producto */}
                      <div className="text-center">
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">{product.brand}</p>
                      </div>

                      {/* Precio */}
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary-600">
                          {formatPrice(product.our_price)}
                        </div>
                        {product.original_price && product.original_price > product.our_price && (
                          <div className="text-sm text-gray-500 line-through">
                            {formatPrice(product.original_price)}
                          </div>
                        )}
                      </div>

                      {/* Botones de acción */}
                      <div className="flex flex-col gap-2 w-full">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAddToCart(product)}
                          className="w-full"
                        >
                          Agregar al Carrito
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProduct(product.id)}
                          className="w-full text-red-600 hover:bg-red-50"
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Cuerpo de la tabla con especificaciones */}
            <tbody>
              {/* Información básica */}
              <tr className="bg-gray-50">
                <td
                  colSpan={products.length + 1}
                  className="sticky left-0 z-10 bg-gray-200 border-b border-gray-300 px-4 py-2 font-bold text-gray-900"
                >
                  Información General
                </td>
              </tr>

              <tr className="hover:bg-gray-50">
                <td className="sticky left-0 z-10 bg-white border-b border-r border-gray-200 px-4 py-3 font-medium text-gray-700">
                  SKU
                </td>
                {products.map((product) => (
                  <td key={product.id} className="border-b border-gray-200 px-4 py-3 text-gray-900">
                    {product.sku}
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-gray-50">
                <td className="sticky left-0 z-10 bg-white border-b border-r border-gray-200 px-4 py-3 font-medium text-gray-700">
                  Categoría
                </td>
                {products.map((product) => (
                  <td key={product.id} className="border-b border-gray-200 px-4 py-3 text-gray-900">
                    {product.category}
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-gray-50">
                <td className="sticky left-0 z-10 bg-white border-b border-r border-gray-200 px-4 py-3 font-medium text-gray-700">
                  Subcategoría
                </td>
                {products.map((product) => (
                  <td key={product.id} className="border-b border-gray-200 px-4 py-3 text-gray-900">
                    {product.subcategory}
                  </td>
                ))}
              </tr>

              {products.some(p => p.rating) && (
                <tr className="hover:bg-gray-50">
                  <td className="sticky left-0 z-10 bg-white border-b border-r border-gray-200 px-4 py-3 font-medium text-gray-700">
                    Valoración
                  </td>
                  {products.map((product) => (
                    <td key={product.id} className="border-b border-gray-200 px-4 py-3">
                      {product.rating ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-5 h-5 ${
                                  i < Math.floor(product.rating!)
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            ({product.review_count || 0})
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin valoraciones</span>
                      )}
                    </td>
                  ))}
                </tr>
              )}

              {/* Especificaciones técnicas */}
              {specKeys.length > 0 && (
                <>
                  <tr className="bg-gray-50">
                    <td
                      colSpan={products.length + 1}
                      className="sticky left-0 z-10 bg-gray-200 border-b border-gray-300 px-4 py-2 font-bold text-gray-900"
                    >
                      Especificaciones Técnicas
                    </td>
                  </tr>

                  {specKeys.map((specKey) => {
                    const isDifferent = hasDifferences(specKey)
                    
                    return (
                      <tr
                        key={specKey}
                        className={`hover:bg-gray-50 ${isDifferent ? 'bg-yellow-50' : ''}`}
                      >
                        <td className={`sticky left-0 z-10 ${isDifferent ? 'bg-yellow-50' : 'bg-white'} border-b border-r border-gray-200 px-4 py-3 font-medium text-gray-700`}>
                          <div className="flex items-center gap-2">
                            {isDifferent && (
                              <svg className="w-4 h-4 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            )}
                            <span className="capitalize">
                              {specKey.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>
                        {products.map((product) => {
                          const value = product.specifications?.[specKey]
                          
                          return (
                            <td
                              key={product.id}
                              className={`border-b border-gray-200 px-4 py-3 ${
                                isDifferent ? 'bg-yellow-50 font-semibold' : ''
                              }`}
                            >
                              {value !== undefined && value !== null ? (
                                <span className="text-gray-900">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              ) : (
                                <span className="text-gray-400 italic">No especificado</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Leyenda */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-50 border border-yellow-200 rounded"></div>
              <span>Diferencias significativas</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>Especificación con diferencias</span>
            </div>
          </div>
        </div>
      </div>
    </AnimatedModal>
  )
}
