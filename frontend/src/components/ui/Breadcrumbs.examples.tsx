/**
 * Ejemplos de uso del componente Breadcrumbs
 * 
 * Este archivo muestra diferentes casos de uso y configuraciones
 * del componente Breadcrumbs para navegación jerárquica.
 */

import { Breadcrumbs, ChevronSeparator, HomeIcon } from './Breadcrumbs'

/**
 * Ejemplo 1: Breadcrumbs básico
 * Uso más simple con separador por defecto
 */
export function BasicBreadcrumbs() {
  return (
    <Breadcrumbs
      items={[
        { label: 'Inicio', href: '/' },
        { label: 'Productos', href: '/productos' },
        { label: 'Laptops', href: '/productos/laptops' },
        { label: 'MacBook Pro 16"' },
      ]}
    />
  )
}

/**
 * Ejemplo 2: Breadcrumbs con separador personalizado (chevron)
 * Usa el componente ChevronSeparator incluido
 */
export function BreadcrumbsWithChevron() {
  return (
    <Breadcrumbs
      items={[
        { label: 'Inicio', href: '/' },
        { label: 'Categorías', href: '/categorias' },
        { label: 'Componentes PC', href: '/categorias/componentes' },
        { label: 'Tarjetas Gráficas' },
      ]}
      separator={<ChevronSeparator />}
    />
  )
}

/**
 * Ejemplo 3: Breadcrumbs con icono de inicio
 * Muestra un icono de casa en el primer elemento
 */
export function BreadcrumbsWithHomeIcon() {
  return (
    <Breadcrumbs
      items={[
        { label: 'Inicio', href: '/', icon: <HomeIcon /> },
        { label: 'Mi Cuenta', href: '/dashboard' },
        { label: 'Pedidos', href: '/dashboard/pedidos' },
        { label: 'Pedido #12345' },
      ]}
      separator={<ChevronSeparator />}
    />
  )
}

/**
 * Ejemplo 4: Breadcrumbs con texto largo (truncado)
 * Demuestra el truncado automático de textos largos
 */
export function BreadcrumbsWithLongText() {
  return (
    <Breadcrumbs
      items={[
        { label: 'Inicio', href: '/' },
        { label: 'Laptops Gaming de Alto Rendimiento', href: '/laptops-gaming' },
        { label: 'ASUS ROG Strix G15 Gaming Laptop con RTX 4070' },
      ]}
      maxLength={25}
      separator={<ChevronSeparator />}
    />
  )
}

/**
 * Ejemplo 5: Breadcrumbs con comportamiento móvil personalizado
 * Muestra todos los elementos en móvil (no solo el último)
 */
export function BreadcrumbsFullMobile() {
  return (
    <Breadcrumbs
      items={[
        { label: 'Inicio', href: '/', icon: <HomeIcon /> },
        { label: 'Productos', href: '/productos' },
        { label: 'Periféricos', href: '/productos/perifericos' },
        { label: 'Teclados Mecánicos' },
      ]}
      mobileLastOnly={false}
      separator={<ChevronSeparator />}
    />
  )
}

/**
 * Ejemplo 6: Breadcrumbs para página de producto
 * Caso de uso real en una página de detalle de producto
 */
export function ProductPageBreadcrumbs() {
  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumbs
        items={[
          { label: 'Inicio', href: '/', icon: <HomeIcon /> },
          { label: 'Laptops', href: '/categoria/laptops' },
          { label: 'Apple', href: '/marca/apple' },
          { label: 'MacBook Pro 16" M3 Max 2024' },
        ]}
        separator={<ChevronSeparator />}
      />
    </div>
  )
}

/**
 * Ejemplo 7: Breadcrumbs para dashboard de usuario
 * Navegación en el panel de control del usuario
 */
export function DashboardBreadcrumbs() {
  return (
    <Breadcrumbs
      items={[
        { label: 'Dashboard', href: '/dashboard', icon: <HomeIcon /> },
        { label: 'Mis Pedidos', href: '/dashboard/pedidos' },
        { label: 'Seguimiento', href: '/dashboard/seguimiento' },
        { label: 'Pedido #ORD-2024-001234' },
      ]}
      separator={<ChevronSeparator />}
    />
  )
}

/**
 * Ejemplo 8: Breadcrumbs con separador de texto personalizado
 * Usa un separador de texto diferente al por defecto
 */
export function BreadcrumbsCustomTextSeparator() {
  return (
    <Breadcrumbs
      items={[
        { label: 'Inicio', href: '/' },
        { label: 'Blog', href: '/blog' },
        { label: 'Tecnología', href: '/blog/tecnologia' },
        { label: 'Guía de compra de laptops 2024' },
      ]}
      separator="›"
    />
  )
}

/**
 * Ejemplo 9: Breadcrumbs mínimo (solo 2 niveles)
 * Caso más simple con solo inicio y página actual
 */
export function MinimalBreadcrumbs() {
  return (
    <Breadcrumbs
      items={[
        { label: 'Inicio', href: '/', icon: <HomeIcon /> },
        { label: 'Contacto' },
      ]}
      separator={<ChevronSeparator />}
    />
  )
}

/**
 * Ejemplo 10: Breadcrumbs para checkout
 * Navegación durante el proceso de compra
 */
export function CheckoutBreadcrumbs() {
  return (
    <Breadcrumbs
      items={[
        { label: 'Carrito', href: '/carrito' },
        { label: 'Información de Envío', href: '/checkout/envio' },
        { label: 'Pago', href: '/checkout/pago' },
        { label: 'Confirmación' },
      ]}
      separator={<ChevronSeparator />}
      className="mb-6"
    />
  )
}

/**
 * Ejemplo de demostración completa
 * Muestra todos los ejemplos en una página
 */
export function BreadcrumbsShowcase() {
  return (
    <div className="space-y-8 p-8 bg-gray-50">
      <div>
        <h3 className="text-lg font-semibold mb-3">Básico</h3>
        <BasicBreadcrumbs />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Con Chevron</h3>
        <BreadcrumbsWithChevron />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Con Icono de Inicio</h3>
        <BreadcrumbsWithHomeIcon />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Texto Largo (Truncado)</h3>
        <BreadcrumbsWithLongText />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Todos los Elementos en Móvil</h3>
        <BreadcrumbsFullMobile />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Página de Producto</h3>
        <ProductPageBreadcrumbs />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Dashboard</h3>
        <DashboardBreadcrumbs />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Separador Personalizado</h3>
        <BreadcrumbsCustomTextSeparator />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Mínimo</h3>
        <MinimalBreadcrumbs />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Checkout</h3>
        <CheckoutBreadcrumbs />
      </div>
    </div>
  )
}
