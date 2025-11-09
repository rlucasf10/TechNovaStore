/**
 * Ejemplos de uso del componente Card
 * 
 * Este archivo muestra diferentes casos de uso del componente Card
 * y sus subcomponentes relacionados.
 */

import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from './Card'
import { Button } from './Button'

/**
 * Ejemplo 1: Card Básico
 * Card simple con padding medio y contenido básico
 */
export function BasicCardExample() {
  return (
    <Card>
      <CardContent>
        <p>Este es un card básico con contenido simple.</p>
      </CardContent>
    </Card>
  )
}

/**
 * Ejemplo 2: Card con Header y Footer
 * Card completo con todas las secciones
 */
export function CompleteCardExample() {
  return (
    <Card padding="md">
      <CardHeader bordered>
        <div>
          <CardTitle>Título del Card</CardTitle>
          <CardDescription>
            Descripción breve del contenido del card
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="mb-4">
          Este es el contenido principal del card. Puede contener cualquier
          tipo de contenido: texto, imágenes, formularios, etc.
        </p>
        <p>
          El card tiene bordes redondeados y una sombra sutil que le da
          profundidad visual.
        </p>
      </CardContent>
      
      <CardFooter bordered>
        <Button variant="secondary" size="sm">
          Cancelar
        </Button>
        <Button variant="primary" size="sm">
          Guardar
        </Button>
      </CardFooter>
    </Card>
  )
}

/**
 * Ejemplo 3: Card con Hover
 * Card que se eleva al pasar el mouse por encima
 */
export function HoverableCardExample() {
  return (
    <Card hoverable padding="lg">
      <CardHeader>
        <CardTitle>Card con Hover</CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          Pasa el mouse por encima de este card para ver el efecto de elevación.
          La sombra se hace más prominente creando un efecto de profundidad.
        </p>
      </CardContent>
    </Card>
  )
}

/**
 * Ejemplo 4: Card Clickeable
 * Card que actúa como un botón o enlace
 */
export function ClickableCardExample() {
  return (
    <Card 
      clickable 
      hoverable 
      onClick={() => alert('Card clickeado!')}
      className="cursor-pointer"
    >
      <CardHeader>
        <CardTitle>Card Clickeable</CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          Haz clic en este card para ver la acción. Los cards clickeables
          son útiles para navegación o selección de opciones.
        </p>
      </CardContent>
    </Card>
  )
}

/**
 * Ejemplo 5: Variantes de Padding
 * Muestra las diferentes opciones de padding disponibles
 */
export function PaddingVariantsExample() {
  return (
    <div className="space-y-4">
      <Card padding="none" bordered>
        <div className="p-4">
          <CardTitle>Padding: none</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Sin padding interno. Útil cuando necesitas control total del espaciado.
          </p>
        </div>
      </Card>

      <Card padding="sm">
        <CardTitle>Padding: sm</CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Padding pequeño (12px). Ideal para cards compactos.
        </p>
      </Card>

      <Card padding="md">
        <CardTitle>Padding: md (default)</CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Padding medio (16px en móvil, 24px en desktop). Balance perfecto.
        </p>
      </Card>

      <Card padding="lg">
        <CardTitle>Padding: lg</CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Padding grande (24px en móvil, 32px en desktop). Para contenido destacado.
        </p>
      </Card>
    </div>
  )
}

/**
 * Ejemplo 6: Card con Borde
 * Card con borde visible en lugar de solo sombra
 */
export function BorderedCardExample() {
  return (
    <Card bordered padding="md">
      <CardHeader>
        <CardTitle>Card con Borde</CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          Este card tiene un borde visible además de la sombra.
          Útil para crear separación visual más marcada.
        </p>
      </CardContent>
    </Card>
  )
}

/**
 * Ejemplo 7: Grid de Cards
 * Múltiples cards en un layout de grid
 */
export function CardGridExample() {
  const features = [
    {
      title: 'Rápido',
      description: 'Optimizado para máximo rendimiento',
      icon: '⚡',
    },
    {
      title: 'Seguro',
      description: 'Protección de datos de primera clase',
      icon: '🔒',
    },
    {
      title: 'Escalable',
      description: 'Crece con tu negocio',
      icon: '📈',
    },
    {
      title: 'Confiable',
      description: '99.9% de uptime garantizado',
      icon: '✓',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {features.map((feature) => (
        <Card key={feature.title} hoverable padding="md">
          <div className="text-4xl mb-3">{feature.icon}</div>
          <CardTitle as="h4">{feature.title}</CardTitle>
          <CardDescription>{feature.description}</CardDescription>
        </Card>
      ))}
    </div>
  )
}

/**
 * Ejemplo 8: Card de Producto
 * Ejemplo de uso real: card de producto en e-commerce
 */
export function ProductCardExample() {
  return (
    <Card hoverable clickable padding="none" className="overflow-hidden">
      {/* Imagen del producto */}
      <div className="aspect-square bg-gray-100 relative">
        <div className="absolute top-2 right-2 bg-error text-white text-xs font-bold px-2 py-1 rounded">
          -20%
        </div>
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          [Imagen del Producto]
        </div>
      </div>
      
      {/* Contenido del producto */}
      <div className="p-4">
        <CardTitle as="h4" className="text-base mb-2">
          Laptop Gaming Pro X
        </CardTitle>
        
        <div className="flex items-center gap-1 mb-2">
          <span className="text-yellow-400">★★★★☆</span>
          <span className="text-sm text-gray-500">(128)</span>
        </div>
        
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-xl font-bold text-gray-900">$999.99</span>
          <span className="text-sm text-gray-500 line-through">$1,249.99</span>
        </div>
        
        <Button variant="primary" size="sm" className="w-full">
          Agregar al Carrito
        </Button>
      </div>
    </Card>
  )
}

/**
 * Ejemplo 9: Card de Estadística
 * Card para mostrar métricas o KPIs
 */
export function StatCardExample() {
  return (
    <Card padding="md" hoverable>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">Ventas Totales</p>
          <p className="text-3xl font-bold text-gray-900">$24,567</p>
          <p className="text-sm text-success mt-1">
            ↑ 12.5% vs mes anterior
          </p>
        </div>
        <div className="text-4xl">💰</div>
      </div>
    </Card>
  )
}

/**
 * Ejemplo 10: Card de Notificación
 * Card para mostrar alertas o mensajes
 */
export function NotificationCardExample() {
  return (
    <Card bordered padding="md" className="border-l-4 border-l-info">
      <div className="flex gap-3">
        <div className="text-info text-xl">ℹ️</div>
        <div className="flex-1">
          <CardTitle as="h4" className="text-base mb-1">
            Nueva actualización disponible
          </CardTitle>
          <CardDescription>
            Hay una nueva versión del sistema disponible. 
            Actualiza ahora para obtener las últimas mejoras.
          </CardDescription>
          <div className="mt-3 flex gap-2">
            <Button variant="ghost" size="sm">
              Más tarde
            </Button>
            <Button variant="primary" size="sm">
              Actualizar ahora
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

/**
 * Ejemplo 11: Card en Tema Oscuro
 * Muestra cómo se ve el card en modo oscuro
 */
export function DarkModeCardExample() {
  return (
    <div className="dark bg-dark-bg-primary p-8">
      <Card padding="md" hoverable>
        <CardHeader bordered>
          <CardTitle>Card en Modo Oscuro</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            El componente Card se adapta automáticamente al tema oscuro,
            ajustando colores de fondo, texto y bordes para mantener
            la legibilidad y el contraste adecuado.
          </p>
        </CardContent>
        <CardFooter bordered>
          <Button variant="primary" size="sm">
            Acción Principal
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
