'use client'

/**
 * Página de ejemplos del componente Tabs
 * 
 * Esta página muestra todos los casos de uso del componente Tabs
 * para facilitar el testing visual y la documentación.
 */

import {
  BasicTabsExample,
  TabsWithIconsExample,
  PillsTabsExample,
  UnderlineTabsExample,
  DisabledTabExample,
  TabsWithCallbackExample,
  RightAlignedTabsExample,
  ProductDetailTabsExample,
} from '@/components/ui/Tabs.examples'

export default function TabsExamplesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Componente Tabs
          </h1>
          <p className="text-lg text-gray-600">
            Ejemplos de uso del componente de navegación por pestañas con soporte
            completo para accesibilidad y navegación por teclado.
          </p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">
              💡 Navegación por Teclado
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <kbd className="px-2 py-1 bg-white rounded border">←</kbd> / <kbd className="px-2 py-1 bg-white rounded border">→</kbd> - Navegar entre tabs</li>
              <li>• <kbd className="px-2 py-1 bg-white rounded border">Home</kbd> - Ir al primer tab</li>
              <li>• <kbd className="px-2 py-1 bg-white rounded border">End</kbd> - Ir al último tab</li>
              <li>• <kbd className="px-2 py-1 bg-white rounded border">Tab</kbd> - Mover foco al contenido</li>
            </ul>
          </div>
        </div>

        {/* Ejemplos */}
        <div className="space-y-12">
          <BasicTabsExample />
          <TabsWithIconsExample />
          <PillsTabsExample />
          <UnderlineTabsExample />
          <DisabledTabExample />
          <TabsWithCallbackExample />
          <RightAlignedTabsExample />
          <ProductDetailTabsExample />
        </div>

        {/* Footer con información adicional */}
        <div className="mt-12 p-6 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Características</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">✅ Accesibilidad</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Cumple con WCAG 2.1 AA</li>
                <li>• Roles ARIA correctos</li>
                <li>• Navegación por teclado completa</li>
                <li>• Indicadores visuales de foco</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🎨 Personalización</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 3 variantes visuales</li>
                <li>• Soporte para iconos</li>
                <li>• Tabs deshabilitados</li>
                <li>• Alineación configurable</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">⚡ Rendimiento</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Renderizado optimizado</li>
                <li>• Gestión eficiente de foco</li>
                <li>• Sin re-renders innecesarios</li>
                <li>• Lazy loading de contenido</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🔧 Funcionalidad</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Callback de cambio de tab</li>
                <li>• Control del tab activo</li>
                <li>• Navegación circular</li>
                <li>• Contenido dinámico</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Documentación */}
        <div className="mt-12 p-6 bg-gray-100 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Documentación</h2>
          <p className="text-gray-700 mb-4">
            Para más información sobre el uso del componente, consulta los siguientes archivos:
          </p>
          <ul className="space-y-2">
            <li>
              <code className="px-2 py-1 bg-white rounded text-sm">
                frontend/src/components/ui/Tabs.tsx
              </code>
              <span className="text-gray-600 ml-2">- Implementación del componente</span>
            </li>
            <li>
              <code className="px-2 py-1 bg-white rounded text-sm">
                frontend/src/components/ui/Tabs.README.md
              </code>
              <span className="text-gray-600 ml-2">- Documentación completa</span>
            </li>
            <li>
              <code className="px-2 py-1 bg-white rounded text-sm">
                frontend/src/components/ui/Tabs.examples.tsx
              </code>
              <span className="text-gray-600 ml-2">- Ejemplos de código</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
