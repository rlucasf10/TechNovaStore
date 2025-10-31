import { useState, useEffect } from 'react'
import { Loading, LoadingOverlay } from './Loading'
import { Button } from './Button'

/**
 * Ejemplos de uso del componente Loading
 * 
 * Este archivo muestra diferentes casos de uso del Loading component
 * para documentación y testing visual.
 */

export function LoadingExamples() {
  const [showOverlay, setShowOverlay] = useState(false)
  const [showTransparentOverlay, setShowTransparentOverlay] = useState(false)

  // Auto-cerrar overlays después de 3 segundos
  useEffect(() => {
    if (showOverlay) {
      const timer = setTimeout(() => setShowOverlay(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showOverlay])

  useEffect(() => {
    if (showTransparentOverlay) {
      const timer = setTimeout(() => setShowTransparentOverlay(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showTransparentOverlay])

  return (
    <div className="space-y-8 p-8">
      {/* Tamaños del Spinner */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Tamaños del Spinner</h2>
        <div className="flex flex-wrap items-center gap-8">
          <div className="text-center">
            <Loading size="sm" />
            <p className="mt-2 text-sm text-gray-600">Small (16px)</p>
          </div>
          <div className="text-center">
            <Loading size="md" />
            <p className="mt-2 text-sm text-gray-600">Medium (32px)</p>
          </div>
          <div className="text-center">
            <Loading size="lg" />
            <p className="mt-2 text-sm text-gray-600">Large (48px)</p>
          </div>
        </div>
      </section>

      {/* Spinner en diferentes contextos */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Spinner en Diferentes Contextos</h2>
        <div className="space-y-4">
          {/* En un card */}
          <div className="border rounded-lg p-6 bg-white shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Cargando datos...</h3>
            <Loading size="md" />
          </div>

          {/* En un botón */}
          <div className="flex gap-4">
            <Button loading>
              Guardando...
            </Button>
            <Button loading variant="secondary">
              Procesando...
            </Button>
          </div>

          {/* Inline con texto */}
          <div className="flex items-center gap-3">
            <Loading size="sm" />
            <span className="text-gray-600">Cargando productos...</span>
          </div>
        </div>
      </section>

      {/* Loading Overlay */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Loading Overlay</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Overlay con Fondo Sólido</h3>
            <p className="text-gray-600 mb-4">
              Bloquea toda la pantalla con un fondo blanco sólido
            </p>
            <Button onClick={() => setShowOverlay(true)}>
              Mostrar Overlay Sólido
            </Button>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Overlay Transparente</h3>
            <p className="text-gray-600 mb-4">
              Bloquea la pantalla con un fondo semi-transparente y blur
            </p>
            <Button onClick={() => setShowTransparentOverlay(true)}>
              Mostrar Overlay Transparente
            </Button>
          </div>
        </div>
      </section>

      {/* Casos de uso comunes */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Casos de Uso Comunes</h2>
        <div className="space-y-6">
          {/* Cargando lista de productos */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Cargando Lista de Productos</h3>
            <div className="border rounded-lg p-6 bg-white">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loading size="lg" />
                  <p className="mt-4 text-gray-600">Cargando productos...</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cargando detalles */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Cargando Detalles</h3>
            <div className="border rounded-lg p-6 bg-white">
              <div className="flex items-center gap-3">
                <Loading size="sm" />
                <span className="text-sm text-gray-600">
                  Obteniendo información del producto...
                </span>
              </div>
            </div>
          </div>

          {/* Procesando pago */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Procesando Pago</h3>
            <div className="border rounded-lg p-6 bg-white">
              <div className="text-center py-8">
                <Loading size="lg" />
                <p className="mt-4 text-lg font-medium text-gray-900">
                  Procesando pago...
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Por favor, no cierres esta ventana
                </p>
              </div>
            </div>
          </div>

          {/* Subiendo archivo */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Subiendo Archivo</h3>
            <div className="border rounded-lg p-6 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Loading size="sm" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      imagen-producto.jpg
                    </p>
                    <p className="text-xs text-gray-600">Subiendo... 45%</p>
                  </div>
                </div>
                <button className="text-sm text-red-600 hover:text-red-700">
                  Cancelar
                </button>
              </div>
            </div>
          </div>

          {/* Sincronizando datos */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Sincronizando Datos</h3>
            <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-3">
                <Loading size="sm" className="text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Sincronizando con el servidor
                  </p>
                  <p className="text-xs text-blue-700">
                    Última actualización: hace 2 segundos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Variaciones de color */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Variaciones de Color</h2>
        <div className="flex flex-wrap gap-8">
          <div className="text-center">
            <Loading size="md" className="text-primary-600" />
            <p className="mt-2 text-sm text-gray-600">Primary (default)</p>
          </div>
          <div className="text-center">
            <Loading size="md" className="text-green-600" />
            <p className="mt-2 text-sm text-gray-600">Success</p>
          </div>
          <div className="text-center">
            <Loading size="md" className="text-blue-600" />
            <p className="mt-2 text-sm text-gray-600">Info</p>
          </div>
          <div className="text-center">
            <Loading size="md" className="text-gray-600" />
            <p className="mt-2 text-sm text-gray-600">Gray</p>
          </div>
          <div className="text-center bg-gray-900 p-4 rounded">
            <Loading size="md" className="text-white" />
            <p className="mt-2 text-sm text-gray-300">White</p>
          </div>
        </div>
      </section>

      {/* Overlays activos */}
      {showOverlay && (
        <LoadingOverlay 
          text="Procesando solicitud..."
          transparent={false}
        />
      )}

      {showTransparentOverlay && (
        <LoadingOverlay 
          text="Guardando cambios..."
          transparent={true}
        />
      )}
    </div>
  )
}

export default LoadingExamples
