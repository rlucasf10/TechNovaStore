/**
 * Ejemplos de uso del componente Button
 * Este archivo muestra todas las variantes, tamaños y estados del botón
 */

import { Button } from './Button'

// Iconos de ejemplo (puedes usar cualquier librería de iconos como lucide-react, heroicons, etc.)
const ShoppingCartIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

const TrashIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const ArrowRightIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
)

export function ButtonExamples() {
  return (
    <div className="p-8 space-y-12 bg-gray-50">
      <div>
        <h2 className="text-2xl font-bold mb-6">Componente Button - Ejemplos</h2>
        <p className="text-gray-600 mb-8">
          Todas las variantes, tamaños y estados del componente Button según el diseño de TechNovaStore.
        </p>
      </div>

      {/* Variantes */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Variantes</h3>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="danger">Danger Button</Button>
        </div>
      </section>

      {/* Tamaños */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Tamaños</h3>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="sm">Small Button</Button>
          <Button size="md">Medium Button</Button>
          <Button size="lg">Large Button</Button>
        </div>
      </section>

      {/* Estados */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Estados</h3>
        <div className="flex flex-wrap gap-4">
          <Button>Default</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
        </div>
      </section>

      {/* Iconos */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Con Iconos</h3>
        <div className="flex flex-wrap gap-4">
          <Button iconLeft={<ShoppingCartIcon />}>
            Agregar al Carrito
          </Button>
          <Button variant="secondary" iconRight={<ArrowRightIcon />}>
            Continuar
          </Button>
          <Button variant="danger" iconLeft={<TrashIcon />}>
            Eliminar
          </Button>
        </div>
      </section>

      {/* Combinaciones */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Combinaciones</h3>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button size="sm" iconLeft={<ShoppingCartIcon />}>
              Small con Icono
            </Button>
            <Button size="md" iconLeft={<ShoppingCartIcon />}>
              Medium con Icono
            </Button>
            <Button size="lg" iconLeft={<ShoppingCartIcon />}>
              Large con Icono
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" loading>
              Procesando Pago
            </Button>
            <Button variant="secondary" loading>
              Guardando
            </Button>
            <Button variant="danger" loading>
              Eliminando
            </Button>
          </div>
        </div>
      </section>

      {/* Casos de uso reales */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Casos de Uso Reales</h3>
        <div className="space-y-6">
          {/* Carrito de compras */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h4 className="font-medium mb-4">Carrito de Compras</h4>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary">
                Continuar Comprando
              </Button>
              <Button variant="primary" iconRight={<ArrowRightIcon />}>
                Proceder al Checkout
              </Button>
            </div>
          </div>

          {/* Detalle de producto */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h4 className="font-medium mb-4">Detalle de Producto</h4>
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="primary" 
                size="lg" 
                iconLeft={<ShoppingCartIcon />}
              >
                Agregar al Carrito
              </Button>
              <Button variant="secondary" size="lg">
                Comprar Ahora
              </Button>
            </div>
          </div>

          {/* Gestión de cuenta */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h4 className="font-medium mb-4">Gestión de Cuenta</h4>
            <div className="flex flex-wrap gap-3">
              <Button variant="ghost">
                Cancelar
              </Button>
              <Button variant="primary">
                Guardar Cambios
              </Button>
              <Button variant="danger" iconLeft={<TrashIcon />}>
                Eliminar Cuenta
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Código de ejemplo */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Código de Ejemplo</h3>
        <div className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto">
          <pre className="text-sm">
{`// Importar el componente
import { Button } from '@/components/ui/Button'

// Uso básico
<Button>Click me</Button>

// Con variante y tamaño
<Button variant="primary" size="lg">
  Agregar al Carrito
</Button>

// Con iconos
<Button 
  variant="secondary" 
  iconLeft={<ShoppingCartIcon />}
  iconRight={<ArrowRightIcon />}
>
  Ver Carrito
</Button>

// Con estado de carga
<Button loading>
  Procesando...
</Button>

// Deshabilitado
<Button disabled>
  No disponible
</Button>

// Con evento onClick
<Button 
  variant="danger"
  onClick={() => handleDelete()}
>
  Eliminar
</Button>`}
          </pre>
        </div>
      </section>
    </div>
  )
}
