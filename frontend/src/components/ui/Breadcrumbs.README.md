# Breadcrumbs Component

Componente de navegación jerárquica (breadcrumbs) que muestra la ruta de navegación actual del usuario en la aplicación.

## Características

- ✅ **Navegación jerárquica clara**: Muestra la ruta completa desde el inicio hasta la página actual
- ✅ **Separadores personalizables**: Usa separadores de texto o componentes personalizados
- ✅ **Truncado automático**: Acorta textos largos para mantener la legibilidad
- ✅ **Responsive**: En móvil muestra solo el primer y último elemento por defecto
- ✅ **Accesible**: Implementa ARIA labels y navegación por teclado
- ✅ **Iconos opcionales**: Soporta iconos en cada elemento (ej: icono de casa para inicio)
- ✅ **TypeScript**: Completamente tipado para mejor DX

## Uso Básico

```tsx
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'

function ProductPage() {
  return (
    <Breadcrumbs
      items={[
        { label: 'Inicio', href: '/' },
        { label: 'Laptops', href: '/categoria/laptops' },
        { label: 'MacBook Pro 16"' }
      ]}
    />
  )
}
```

## Props

### `BreadcrumbsProps`

| Prop | Tipo | Por Defecto | Descripción |
|------|------|-------------|-------------|
| `items` | `BreadcrumbItem[]` | **Requerido** | Array de elementos de navegación |
| `separator` | `ReactNode` | `'/'` | Separador entre elementos |
| `maxLength` | `number` | `30` | Longitud máxima antes de truncar |
| `className` | `string` | `undefined` | Clases CSS adicionales |
| `mobileLastOnly` | `boolean` | `true` | Mostrar solo primer y último elemento en móvil |

### `BreadcrumbItem`

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `label` | `string` | Texto a mostrar |
| `href` | `string` (opcional) | URL de destino (omitir para el último elemento) |
| `icon` | `ReactNode` (opcional) | Icono a mostrar antes del label |

## Ejemplos

### Con Separador Chevron

```tsx
import { Breadcrumbs, ChevronSeparator } from '@/components/ui/Breadcrumbs'

<Breadcrumbs
  items={[
    { label: 'Inicio', href: '/' },
    { label: 'Productos', href: '/productos' },
    { label: 'Laptops' }
  ]}
  separator={<ChevronSeparator />}
/>
```

### Con Icono de Inicio

```tsx
import { Breadcrumbs, HomeIcon, ChevronSeparator } from '@/components/ui/Breadcrumbs'

<Breadcrumbs
  items={[
    { label: 'Inicio', href: '/', icon: <HomeIcon /> },
    { label: 'Mi Cuenta', href: '/dashboard' },
    { label: 'Pedidos' }
  ]}
  separator={<ChevronSeparator />}
/>
```

### Con Texto Largo (Truncado)

```tsx
<Breadcrumbs
  items={[
    { label: 'Inicio', href: '/' },
    { label: 'Laptops Gaming de Alto Rendimiento', href: '/laptops' },
    { label: 'ASUS ROG Strix G15 con RTX 4070' }
  ]}
  maxLength={25}
/>
```

### Mostrar Todos los Elementos en Móvil

```tsx
<Breadcrumbs
  items={[
    { label: 'Inicio', href: '/' },
    { label: 'Productos', href: '/productos' },
    { label: 'Periféricos', href: '/perifericos' },
    { label: 'Teclados' }
  ]}
  mobileLastOnly={false}
/>
```

### Separador de Texto Personalizado

```tsx
<Breadcrumbs
  items={[
    { label: 'Inicio', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: 'Artículo' }
  ]}
  separator="›"
/>
```

## Componentes Auxiliares

### `ChevronSeparator`

Separador con icono de chevron (flecha derecha) para usar en lugar del separador por defecto.

```tsx
import { ChevronSeparator } from '@/components/ui/Breadcrumbs'

<Breadcrumbs
  items={items}
  separator={<ChevronSeparator />}
/>
```

### `HomeIcon`

Icono de casa para usar en el primer elemento (Inicio).

```tsx
import { HomeIcon } from '@/components/ui/Breadcrumbs'

<Breadcrumbs
  items={[
    { label: 'Inicio', href: '/', icon: <HomeIcon /> },
    // ... más items
  ]}
/>
```

## Casos de Uso

### Página de Producto

```tsx
function ProductDetailPage({ product }) {
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Inicio', href: '/', icon: <HomeIcon /> },
          { label: product.category, href: `/categoria/${product.categorySlug}` },
          { label: product.brand, href: `/marca/${product.brandSlug}` },
          { label: product.name }
        ]}
        separator={<ChevronSeparator />}
      />
      {/* Resto del contenido */}
    </div>
  )
}
```

### Dashboard de Usuario

```tsx
function OrderTrackingPage({ orderId }) {
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard', icon: <HomeIcon /> },
          { label: 'Mis Pedidos', href: '/dashboard/pedidos' },
          { label: 'Seguimiento', href: '/dashboard/seguimiento' },
          { label: `Pedido #${orderId}` }
        ]}
        separator={<ChevronSeparator />}
      />
      {/* Resto del contenido */}
    </div>
  )
}
```

### Proceso de Checkout

```tsx
function CheckoutPage({ step }) {
  const steps = [
    { label: 'Carrito', href: '/carrito' },
    { label: 'Envío', href: '/checkout/envio' },
    { label: 'Pago', href: '/checkout/pago' },
    { label: 'Confirmación' }
  ]

  return (
    <div>
      <Breadcrumbs
        items={steps.slice(0, step + 1)}
        separator={<ChevronSeparator />}
      />
      {/* Resto del contenido */}
    </div>
  )
}
```

## Comportamiento Responsive

Por defecto, el componente implementa un comportamiento responsive optimizado:

- **Desktop**: Muestra todos los elementos de la ruta
- **Móvil**: Muestra solo el primer y último elemento (configurable con `mobileLastOnly`)

Ejemplo visual:

**Desktop:**
```
Inicio > Productos > Laptops > MacBook Pro 16"
```

**Móvil (mobileLastOnly=true):**
```
Inicio > ... > MacBook Pro 16"
```

**Móvil (mobileLastOnly=false):**
```
Inicio > Productos > Laptops > MacBook Pro 16"
```

## Accesibilidad

El componente implementa las mejores prácticas de accesibilidad:

- ✅ Usa `<nav>` con `aria-label="Breadcrumb"`
- ✅ Usa `<ol>` para lista ordenada semántica
- ✅ Marca el último elemento con `aria-current="page"`
- ✅ Los links tienen `aria-label` descriptivos
- ✅ Los iconos tienen `aria-hidden="true"`
- ✅ Navegación completa por teclado (Tab, Enter)
- ✅ Focus visible con ring de enfoque

## Estilos

El componente usa Tailwind CSS y sigue el sistema de diseño de TechNovaStore:

- **Colores**: Gris para elementos intermedios, azul primary para hover, negro para elemento actual
- **Tipografía**: Texto pequeño (text-sm) con peso medio (font-medium)
- **Espaciado**: Gap de 2 (0.5rem) entre elementos
- **Transiciones**: Suaves en hover y focus
- **Focus**: Ring azul primary con offset

## Integración con Next.js

El componente usa `next/link` para navegación optimizada:

```tsx
import Link from 'next/link'

// Dentro del componente
<Link href={item.href}>
  {item.label}
</Link>
```

Esto proporciona:
- Prefetching automático de rutas
- Navegación sin recarga de página
- Optimización de rendimiento

## Personalización

### Separador Personalizado

Puedes crear tu propio separador:

```tsx
function CustomSeparator() {
  return <span className="text-gray-400 mx-2">•</span>
}

<Breadcrumbs
  items={items}
  separator={<CustomSeparator />}
/>
```

### Iconos Personalizados

Puedes usar cualquier icono:

```tsx
import { ShoppingBag } from 'lucide-react'

<Breadcrumbs
  items={[
    { label: 'Tienda', href: '/tienda', icon: <ShoppingBag className="w-4 h-4" /> },
    // ... más items
  ]}
/>
```

### Estilos Personalizados

Puedes agregar clases CSS adicionales:

```tsx
<Breadcrumbs
  items={items}
  className="bg-white p-4 rounded-lg shadow-sm"
/>
```

## Requisitos Cumplidos

Este componente cumple con los requisitos especificados en el documento de diseño:

- ✅ **Requisito 8.1**: Navegación jerárquica en páginas de detalle de producto
- ✅ Implementa navegación jerárquica clara
- ✅ Separadores personalizables (texto o componentes)
- ✅ Truncado automático para rutas largas
- ✅ Responsive: solo último item en móvil por defecto
- ✅ Accesible según WCAG 2.1 AA

## Notas de Implementación

- El componente no renderiza nada si `items` está vacío
- El último elemento nunca tiene link (representa la página actual)
- Los separadores no se muestran después del último elemento
- El truncado preserva los primeros caracteres y agrega "..."
- En móvil, el separador entre elementos ocultos también se oculta
