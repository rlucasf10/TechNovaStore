'use client'

/**
 * Página de demostración del componente Breadcrumbs
 * 
 * Esta página muestra todos los casos de uso y variantes del componente
 * Breadcrumbs para navegación jerárquica.
 */

import { 
  Breadcrumbs, 
  ChevronSeparator, 
  HomeIcon,
  type BreadcrumbItem,
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui'

export default function BreadcrumbsExamplePage() {
  // Datos de ejemplo para diferentes casos de uso
  const productBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Inicio', href: '/', icon: <HomeIcon /> },
    { label: 'Laptops', href: '/categoria/laptops' },
    { label: 'Apple', href: '/marca/apple' },
    { label: 'MacBook Pro 16" M3 Max 2024' },
  ]

  const dashboardBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: <HomeIcon /> },
    { label: 'Mis Pedidos', href: '/dashboard/pedidos' },
    { label: 'Seguimiento', href: '/dashboard/seguimiento' },
    { label: 'Pedido #ORD-2024-001234' },
  ]

  const longTextBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Inicio', href: '/' },
    { label: 'Laptops Gaming de Alto Rendimiento para Profesionales', href: '/laptops-gaming' },
    { label: 'ASUS ROG Strix G15 Gaming Laptop con NVIDIA RTX 4070 y Procesador Intel Core i9' },
  ]

  const checkoutBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Carrito', href: '/carrito' },
    { label: 'Información de Envío', href: '/checkout/envio' },
    { label: 'Método de Pago', href: '/checkout/pago' },
    { label: 'Confirmación' },
  ]

  const minimalBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Inicio', href: '/', icon: <HomeIcon /> },
    { label: 'Contacto' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Componente Breadcrumbs
          </h1>
          <p className="text-lg text-gray-600">
            Navegación jerárquica con separadores personalizables, truncado automático y diseño responsive.
          </p>
        </div>

        {/* Ejemplos */}
        <div className="space-y-8">
          {/* Ejemplo 1: Básico */}
          <Card>
            <CardHeader>
              <CardTitle>1. Breadcrumbs Básico</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Uso más simple con separador por defecto (/)
              </p>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <Breadcrumbs
                  items={[
                    { label: 'Inicio', href: '/' },
                    { label: 'Productos', href: '/productos' },
                    { label: 'Laptops', href: '/productos/laptops' },
                    { label: 'MacBook Pro 16"' },
                  ]}
                />
              </div>
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <code className="text-sm">
                  {`<Breadcrumbs
  items={[
    { label: 'Inicio', href: '/' },
    { label: 'Productos', href: '/productos' },
    { label: 'Laptops', href: '/productos/laptops' },
    { label: 'MacBook Pro 16"' },
  ]}
/>`}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Ejemplo 2: Con Chevron */}
          <Card>
            <CardHeader>
              <CardTitle>2. Con Separador Chevron</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Usa el componente ChevronSeparator para un look más moderno
              </p>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <Breadcrumbs
                  items={[
                    { label: 'Inicio', href: '/' },
                    { label: 'Categorías', href: '/categorias' },
                    { label: 'Componentes PC', href: '/categorias/componentes' },
                    { label: 'Tarjetas Gráficas' },
                  ]}
                  separator={<ChevronSeparator />}
                />
              </div>
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <code className="text-sm">
                  {`<Breadcrumbs
  items={items}
  separator={<ChevronSeparator />}
/>`}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Ejemplo 3: Con Icono de Inicio */}
          <Card>
            <CardHeader>
              <CardTitle>3. Con Icono de Inicio</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Muestra un icono de casa en el primer elemento
              </p>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <Breadcrumbs
                  items={productBreadcrumbs}
                  separator={<ChevronSeparator />}
                />
              </div>
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <code className="text-sm">
                  {`<Breadcrumbs
  items={[
    { label: 'Inicio', href: '/', icon: <HomeIcon /> },
    { label: 'Laptops', href: '/categoria/laptops' },
    { label: 'Apple', href: '/marca/apple' },
    { label: 'MacBook Pro 16" M3 Max 2024' },
  ]}
  separator={<ChevronSeparator />}
/>`}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Ejemplo 4: Texto Largo (Truncado) */}
          <Card>
            <CardHeader>
              <CardTitle>4. Texto Largo con Truncado</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Demuestra el truncado automático de textos largos (maxLength=25)
              </p>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <Breadcrumbs
                  items={longTextBreadcrumbs}
                  maxLength={25}
                  separator={<ChevronSeparator />}
                />
              </div>
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <code className="text-sm">
                  {`<Breadcrumbs
  items={longTextBreadcrumbs}
  maxLength={25}
  separator={<ChevronSeparator />}
/>`}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Ejemplo 5: Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle>5. Dashboard de Usuario</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Navegación en el panel de control del usuario
              </p>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <Breadcrumbs
                  items={dashboardBreadcrumbs}
                  separator={<ChevronSeparator />}
                />
              </div>
            </CardContent>
          </Card>

          {/* Ejemplo 6: Checkout */}
          <Card>
            <CardHeader>
              <CardTitle>6. Proceso de Checkout</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Navegación durante el proceso de compra
              </p>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <Breadcrumbs
                  items={checkoutBreadcrumbs}
                  separator={<ChevronSeparator />}
                />
              </div>
            </CardContent>
          </Card>

          {/* Ejemplo 7: Mínimo */}
          <Card>
            <CardHeader>
              <CardTitle>7. Breadcrumbs Mínimo</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Caso más simple con solo 2 niveles
              </p>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <Breadcrumbs
                  items={minimalBreadcrumbs}
                  separator={<ChevronSeparator />}
                />
              </div>
            </CardContent>
          </Card>

          {/* Ejemplo 8: Separador Personalizado */}
          <Card>
            <CardHeader>
              <CardTitle>8. Separador de Texto Personalizado</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Usa un separador de texto diferente (›)
              </p>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <Breadcrumbs
                  items={[
                    { label: 'Inicio', href: '/' },
                    { label: 'Blog', href: '/blog' },
                    { label: 'Tecnología', href: '/blog/tecnologia' },
                    { label: 'Guía de compra de laptops 2024' },
                  ]}
                  separator="›"
                />
              </div>
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <code className="text-sm">
                  {`<Breadcrumbs
  items={items}
  separator="›"
/>`}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Ejemplo 9: Todos los elementos en móvil */}
          <Card>
            <CardHeader>
              <CardTitle>9. Todos los Elementos en Móvil</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Muestra todos los elementos incluso en pantallas pequeñas (mobileLastOnly=false)
              </p>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
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
              </div>
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <code className="text-sm">
                  {`<Breadcrumbs
  items={items}
  mobileLastOnly={false}
  separator={<ChevronSeparator />}
/>`}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Información de Responsive */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">📱 Comportamiento Responsive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm text-blue-900">
                <div>
                  <strong>Desktop:</strong> Muestra todos los elementos de la ruta
                  <div className="mt-2 p-3 bg-white rounded border border-blue-200">
                    <code>Inicio &gt; Productos &gt; Laptops &gt; MacBook Pro 16"</code>
                  </div>
                </div>
                <div>
                  <strong>Móvil (mobileLastOnly=true, por defecto):</strong> Muestra solo primer y último elemento
                  <div className="mt-2 p-3 bg-white rounded border border-blue-200">
                    <code>Inicio &gt; ... &gt; MacBook Pro 16"</code>
                  </div>
                </div>
                <div>
                  <strong>Móvil (mobileLastOnly=false):</strong> Muestra todos los elementos
                  <div className="mt-2 p-3 bg-white rounded border border-blue-200">
                    <code>Inicio &gt; Productos &gt; Laptops &gt; MacBook Pro 16"</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Características */}
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-900">✨ Características</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-green-900">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Navegación jerárquica clara:</strong> Muestra la ruta completa desde el inicio</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Separadores personalizables:</strong> Texto o componentes React</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Truncado automático:</strong> Acorta textos largos para mantener legibilidad</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Responsive:</strong> Optimizado para móvil con opciones configurables</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Accesible:</strong> ARIA labels, navegación por teclado, WCAG 2.1 AA</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Iconos opcionales:</strong> Soporta iconos en cada elemento</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>TypeScript:</strong> Completamente tipado</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-600">
          <p>
            Para más información, consulta el archivo{' '}
            <code className="px-2 py-1 bg-gray-200 rounded text-sm">
              Breadcrumbs.README.md
            </code>
          </p>
        </div>
      </div>
    </div>
  )
}
