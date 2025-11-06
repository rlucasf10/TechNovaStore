/**
 * Página de prueba para el componente ProductGallery
 * Ruta: /test-gallery
 * 
 * Esta página es solo para desarrollo y testing.
 * NO debe estar en producción.
 * 
 * ELIMINAR antes del deploy final.
 */

'use client'

import { ProductGallery } from '@/components/products'

export default function TestGalleryPage() {
  // Imágenes de ejemplo para testing
  const testImages = [
    'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800',
    'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test: Galería de Imágenes de Producto
          </h1>
          <p className="text-gray-600">
            Página de prueba para verificar la funcionalidad de ProductGallery
          </p>
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ Esta es una página de prueba temporal. Debe eliminarse antes de producción.
            </p>
          </div>
        </div>

        {/* Características implementadas */}
        <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Características implementadas:
          </h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>Imagen principal grande con zoom:</strong> Click en la imagen para abrir lightbox, click nuevamente para zoom 2x</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>Thumbnails con scroll horizontal:</strong> Miniaturas desplazables con indicador de imagen activa</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>Lightbox con navegación:</strong> Modal fullscreen con flechas, teclado (← →) y ESC para cerrar</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>Indicador de imagen actual:</strong> Contador "X / Y" visible en todo momento</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>Lazy loading:</strong> Primera imagen con priority, resto con lazy loading</span>
            </li>
          </ul>
        </div>

        {/* Instrucciones de uso */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">
            Instrucciones de prueba:
          </h2>
          <ol className="space-y-2 text-blue-800 list-decimal list-inside">
            <li>Haz hover sobre la imagen principal para ver las flechas de navegación</li>
            <li>Click en la imagen principal para abrir el lightbox</li>
            <li>En el lightbox, click nuevamente para activar zoom 2x</li>
            <li>Mueve el mouse para cambiar el punto de zoom</li>
            <li>Usa las flechas del teclado (← →) para navegar entre imágenes</li>
            <li>Presiona ESC para cerrar el lightbox</li>
            <li>Desplaza las miniaturas horizontalmente</li>
            <li>Click en una miniatura para cambiar la imagen principal</li>
          </ol>
        </div>

        {/* Galería de prueba */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Galería de Producto de Ejemplo
          </h2>
          <div className="max-w-2xl mx-auto">
            <ProductGallery 
              images={testImages} 
              productName="Laptop Gaming Pro"
            />
          </div>
        </div>

        {/* Caso con una sola imagen */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Caso: Una sola imagen
          </h2>
          <div className="max-w-2xl mx-auto">
            <ProductGallery 
              images={[testImages[0]]} 
              productName="Producto con una imagen"
            />
          </div>
        </div>

        {/* Caso sin imágenes (placeholder) */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Caso: Sin imágenes (placeholder)
          </h2>
          <div className="max-w-2xl mx-auto">
            <ProductGallery 
              images={[]} 
              productName="Producto sin imágenes"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
