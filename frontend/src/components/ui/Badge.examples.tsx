import { Badge } from './Badge'

/**
 * Ejemplos de uso del componente Badge
 * 
 * Este archivo muestra diferentes casos de uso del Badge component
 * para documentación y testing visual.
 */

export function BadgeExamples() {
  return (
    <div className="space-y-8 p-8">
      {/* Variantes de color */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Variantes de Color</h2>
        <div className="flex flex-wrap gap-3">
          <Badge variant="default">Default</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="secondary">Secondary</Badge>
        </div>
      </section>

      {/* Tamaños */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Tamaños</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Badge size="sm" variant="primary">Small</Badge>
          <Badge size="md" variant="primary">Medium</Badge>
          <Badge size="lg" variant="primary">Large</Badge>
        </div>
      </section>

      {/* Con iconos */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Con Iconos</h2>
        <div className="flex flex-wrap gap-3">
          <Badge 
            variant="success" 
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            }
          >
            Completado
          </Badge>
          <Badge 
            variant="warning" 
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          >
            Pendiente
          </Badge>
          <Badge 
            variant="error" 
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
          >
            Error
          </Badge>
          <Badge 
            variant="info" 
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          >
            Información
          </Badge>
        </div>
      </section>

      {/* Con punto indicador */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Con Punto Indicador</h2>
        <div className="flex flex-wrap gap-3">
          <Badge variant="success" dot>En línea</Badge>
          <Badge variant="warning" dot>Ausente</Badge>
          <Badge variant="error" dot>Desconectado</Badge>
          <Badge variant="info" dot>Ocupado</Badge>
        </div>
      </section>

      {/* Casos de uso comunes */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Casos de Uso Comunes</h2>
        <div className="space-y-4">
          {/* Estados de pedido */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Estados de Pedido</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="warning">Pendiente</Badge>
              <Badge variant="info">Procesando</Badge>
              <Badge variant="primary">Enviado</Badge>
              <Badge variant="success">Entregado</Badge>
              <Badge variant="error">Cancelado</Badge>
            </div>
          </div>

          {/* Descuentos */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Descuentos</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="error" size="lg">-20%</Badge>
              <Badge variant="error" size="lg">-50%</Badge>
              <Badge variant="error" size="lg">OFERTA</Badge>
            </div>
          </div>

          {/* Disponibilidad */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Disponibilidad</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success" dot>En stock</Badge>
              <Badge variant="warning" dot>Pocas unidades</Badge>
              <Badge variant="error" dot>Agotado</Badge>
            </div>
          </div>

          {/* Notificaciones */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Notificaciones</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="error" size="sm">3</Badge>
              <Badge variant="primary" size="sm">12</Badge>
              <Badge variant="success" size="sm">Nuevo</Badge>
            </div>
          </div>

          {/* Categorías */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Categorías</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Laptops</Badge>
              <Badge variant="secondary">Componentes</Badge>
              <Badge variant="secondary">Periféricos</Badge>
              <Badge variant="secondary">Móviles</Badge>
            </div>
          </div>

          {/* Prioridades */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Prioridades de Tickets</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Baja</Badge>
              <Badge variant="info">Media</Badge>
              <Badge variant="warning">Alta</Badge>
              <Badge variant="error">Crítica</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Combinaciones con iconos y puntos */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Combinaciones Avanzadas</h2>
        <div className="flex flex-wrap gap-3">
          <Badge 
            variant="success" 
            size="lg"
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          >
            Verificado
          </Badge>
          <Badge 
            variant="primary" 
            size="lg"
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            }
          >
            Premium
          </Badge>
          <Badge 
            variant="warning" 
            size="lg"
            dot
          >
            Modo Básico
          </Badge>
        </div>
      </section>
    </div>
  )
}

export default BadgeExamples
