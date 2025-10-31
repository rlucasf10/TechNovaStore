/**
 * Ejemplos de uso del componente Tabs
 * 
 * Este archivo muestra diferentes casos de uso y configuraciones
 * del componente Tabs para referencia de los desarrolladores.
 */

import { Tabs, TabItem } from './Tabs'

// Iconos de ejemplo (usando SVG simple)
const DescriptionIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
  </svg>
)

const SpecsIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
)

const ReviewsIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
)

// Ejemplo 1: Tabs básicos (variante default)
export function BasicTabsExample() {
  const tabs: TabItem[] = [
    {
      id: 'description',
      label: 'Descripción',
      content: (
        <div className="prose max-w-none">
          <h3>Descripción del Producto</h3>
          <p>
            Este es un ejemplo de contenido de descripción. Aquí puedes incluir
            información detallada sobre el producto, sus características principales
            y beneficios para el usuario.
          </p>
        </div>
      ),
    },
    {
      id: 'specifications',
      label: 'Especificaciones',
      content: (
        <div>
          <h3 className="text-lg font-semibold mb-4">Especificaciones Técnicas</h3>
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b">
                <td className="py-2 font-medium">Procesador</td>
                <td className="py-2">Intel Core i7-12700K</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-medium">RAM</td>
                <td className="py-2">32GB DDR5</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-medium">Almacenamiento</td>
                <td className="py-2">1TB NVMe SSD</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    },
    {
      id: 'reviews',
      label: 'Reviews',
      content: (
        <div>
          <h3 className="text-lg font-semibold mb-4">Opiniones de Clientes</h3>
          <p className="text-gray-600">
            Aún no hay reviews para este producto. ¡Sé el primero en dejar tu opinión!
          </p>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Tabs Básicos (Default)</h2>
      <Tabs tabs={tabs} defaultActiveTab="description" />
    </div>
  )
}

// Ejemplo 2: Tabs con iconos
export function TabsWithIconsExample() {
  const tabs: TabItem[] = [
    {
      id: 'description',
      label: 'Descripción',
      icon: <DescriptionIcon />,
      content: <p>Contenido de descripción con icono.</p>,
    },
    {
      id: 'specifications',
      label: 'Especificaciones',
      icon: <SpecsIcon />,
      content: <p>Contenido de especificaciones con icono.</p>,
    },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: <ReviewsIcon />,
      content: <p>Contenido de reviews con icono.</p>,
    },
  ]

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Tabs con Iconos</h2>
      <Tabs tabs={tabs} variant="default" />
    </div>
  )
}

// Ejemplo 3: Variante Pills
export function PillsTabsExample() {
  const tabs: TabItem[] = [
    {
      id: 'all',
      label: 'Todos',
      content: <p>Mostrando todos los productos...</p>,
    },
    {
      id: 'active',
      label: 'Activos',
      content: <p>Mostrando productos activos...</p>,
    },
    {
      id: 'draft',
      label: 'Borradores',
      content: <p>Mostrando borradores...</p>,
    },
    {
      id: 'archived',
      label: 'Archivados',
      content: <p>Mostrando productos archivados...</p>,
    },
  ]

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Tabs Variante Pills</h2>
      <Tabs tabs={tabs} variant="pills" align="center" />
    </div>
  )
}

// Ejemplo 4: Variante Underline
export function UnderlineTabsExample() {
  const tabs: TabItem[] = [
    {
      id: 'overview',
      label: 'Resumen',
      content: <p>Vista general del dashboard...</p>,
    },
    {
      id: 'analytics',
      label: 'Analíticas',
      content: <p>Gráficos y métricas...</p>,
    },
    {
      id: 'reports',
      label: 'Reportes',
      content: <p>Reportes detallados...</p>,
    },
  ]

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Tabs Variante Underline</h2>
      <Tabs tabs={tabs} variant="underline" />
    </div>
  )
}

// Ejemplo 5: Tabs con tab deshabilitado
export function DisabledTabExample() {
  const tabs: TabItem[] = [
    {
      id: 'available',
      label: 'Disponible',
      content: <p>Este contenido está disponible.</p>,
    },
    {
      id: 'coming-soon',
      label: 'Próximamente',
      content: <p>Este contenido estará disponible pronto.</p>,
      disabled: true,
    },
    {
      id: 'premium',
      label: 'Premium',
      content: <p>Contenido exclusivo para usuarios premium.</p>,
      disabled: true,
    },
  ]

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Tabs con Deshabilitados</h2>
      <Tabs tabs={tabs} />
    </div>
  )
}

// Ejemplo 6: Tabs con callback de cambio
export function TabsWithCallbackExample() {
  const handleTabChange = (tabId: string) => {
    console.log('Tab cambiado a:', tabId)
    // Aquí podrías hacer tracking, cargar datos, etc.
  }

  const tabs: TabItem[] = [
    {
      id: 'tab1',
      label: 'Tab 1',
      content: <p>Contenido del Tab 1</p>,
    },
    {
      id: 'tab2',
      label: 'Tab 2',
      content: <p>Contenido del Tab 2</p>,
    },
    {
      id: 'tab3',
      label: 'Tab 3',
      content: <p>Contenido del Tab 3</p>,
    },
  ]

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Tabs con Callback</h2>
      <p className="text-sm text-gray-600 mb-4">
        Abre la consola del navegador para ver los eventos de cambio de tab.
      </p>
      <Tabs tabs={tabs} onTabChange={handleTabChange} />
    </div>
  )
}

// Ejemplo 7: Tabs alineados a la derecha
export function RightAlignedTabsExample() {
  const tabs: TabItem[] = [
    {
      id: 'settings',
      label: 'Configuración',
      content: <p>Opciones de configuración...</p>,
    },
    {
      id: 'profile',
      label: 'Perfil',
      content: <p>Información del perfil...</p>,
    },
    {
      id: 'logout',
      label: 'Cerrar Sesión',
      content: <p>¿Estás seguro que deseas cerrar sesión?</p>,
    },
  ]

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Tabs Alineados a la Derecha</h2>
      <Tabs tabs={tabs} align="end" />
    </div>
  )
}

// Ejemplo completo para página de producto
export function ProductDetailTabsExample() {
  const tabs: TabItem[] = [
    {
      id: 'description',
      label: 'Descripción',
      icon: <DescriptionIcon />,
      content: (
        <div className="prose max-w-none">
          <h3>Laptop Gaming de Alto Rendimiento</h3>
          <p>
            Experimenta el máximo rendimiento con esta laptop gaming equipada con
            los últimos componentes de hardware. Perfecta para gaming, diseño 3D
            y edición de video profesional.
          </p>
          <h4>Características Destacadas:</h4>
          <ul>
            <li>Procesador Intel Core i7 de 12ª generación</li>
            <li>Tarjeta gráfica NVIDIA RTX 4070</li>
            <li>Pantalla 15.6" QHD 165Hz</li>
            <li>Sistema de refrigeración avanzado</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'specifications',
      label: 'Especificaciones',
      icon: <SpecsIcon />,
      content: (
        <div>
          <h3 className="text-lg font-semibold mb-4">Especificaciones Técnicas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Hardware</h4>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Procesador</td>
                    <td className="py-2">Intel Core i7-12700H</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">RAM</td>
                    <td className="py-2">32GB DDR5 4800MHz</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">GPU</td>
                    <td className="py-2">NVIDIA RTX 4070 8GB</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Almacenamiento</td>
                    <td className="py-2">1TB NVMe PCIe 4.0</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Display</h4>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Tamaño</td>
                    <td className="py-2">15.6 pulgadas</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Resolución</td>
                    <td className="py-2">2560 x 1440 (QHD)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Tasa de refresco</td>
                    <td className="py-2">165Hz</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Panel</td>
                    <td className="py-2">IPS, 100% sRGB</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'reviews',
      label: 'Reviews (24)',
      icon: <ReviewsIcon />,
      content: (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Opiniones de Clientes</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex text-yellow-400">
                  {'★'.repeat(4)}{'☆'}
                </div>
                <span className="text-sm text-gray-600">4.5 de 5 (24 reviews)</span>
              </div>
            </div>
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              Escribir Review
            </button>
          </div>
          <div className="space-y-4">
            <div className="border-b pb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">Juan Pérez</span>
                <span className="text-sm text-gray-500">• hace 2 días</span>
              </div>
              <div className="flex text-yellow-400 text-sm mb-2">
                {'★'.repeat(5)}
              </div>
              <p className="text-gray-700">
                Excelente laptop para gaming. El rendimiento es impresionante y la
                pantalla de 165Hz hace una gran diferencia. Muy recomendada.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Ejemplo: Página de Producto</h2>
      <Tabs tabs={tabs} defaultActiveTab="description" />
    </div>
  )
}
