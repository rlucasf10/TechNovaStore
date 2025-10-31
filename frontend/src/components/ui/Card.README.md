# Componente Card

Componente contenedor versátil con bordes redondeados y sombras para agrupar contenido relacionado.

## Características

- ✅ Bordes redondeados (8px)
- ✅ Sombra sutil por defecto
- ✅ Variantes de padding configurables (none, sm, md, lg)
- ✅ Efecto de elevación en hover (opcional)
- ✅ Soporte para tema oscuro
- ✅ Subcomponentes para estructura semántica
- ✅ Totalmente accesible
- ✅ TypeScript con tipos completos

## Requisitos

- **Requisito 21.3**: Implementar uso estratégico de espacios en blanco para mejorar legibilidad

## Uso Básico

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Título del Card</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Contenido del card</p>
      </CardContent>
    </Card>
  )
}
```

## Props del Card Principal

### `padding`
- **Tipo**: `'none' | 'sm' | 'md' | 'lg'`
- **Default**: `'md'`
- **Descripción**: Controla el padding interno del card

```tsx
<Card padding="none">Sin padding</Card>
<Card padding="sm">Padding pequeño (12px)</Card>
<Card padding="md">Padding medio (16-24px)</Card>
<Card padding="lg">Padding grande (24-32px)</Card>
```

### `hoverable`
- **Tipo**: `boolean`
- **Default**: `false`
- **Descripción**: Habilita efecto de elevación al pasar el mouse

```tsx
<Card hoverable>
  Este card se eleva al hacer hover
</Card>
```

### `bordered`
- **Tipo**: `boolean`
- **Default**: `false`
- **Descripción**: Muestra un borde visible alrededor del card

```tsx
<Card bordered>
  Card con borde
</Card>
```

### `clickable`
- **Tipo**: `boolean`
- **Default**: `false`
- **Descripción**: Hace el card clickeable con efectos visuales apropiados

```tsx
<Card clickable onClick={() => console.log('Clicked!')}>
  Card clickeable
</Card>
```

## Subcomponentes

### CardHeader

Sección de encabezado del card. Útil para títulos y acciones.

```tsx
<CardHeader bordered>
  <CardTitle>Título</CardTitle>
</CardHeader>
```

**Props:**
- `bordered`: Agrega borde inferior

### CardTitle

Título del card con estilos predefinidos.

```tsx
<CardTitle as="h2">Mi Título</CardTitle>
```

**Props:**
- `as`: Nivel del heading (`'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'`), default: `'h3'`

### CardDescription

Descripción o subtítulo del card.

```tsx
<CardDescription>
  Descripción del contenido
</CardDescription>
```

### CardContent

Contenedor para el contenido principal del card.

```tsx
<CardContent>
  <p>Contenido principal</p>
</CardContent>
```

### CardFooter

Pie del card, típicamente usado para acciones o botones.

```tsx
<CardFooter bordered>
  <Button>Cancelar</Button>
  <Button variant="primary">Guardar</Button>
</CardFooter>
```

**Props:**
- `bordered`: Agrega borde superior

## Ejemplos de Uso

### Card de Producto

```tsx
<Card hoverable clickable padding="none" className="overflow-hidden">
  <div className="aspect-square bg-gray-100">
    <img src="/product.jpg" alt="Producto" />
  </div>
  <div className="p-4">
    <CardTitle as="h4">Laptop Gaming Pro</CardTitle>
    <p className="text-xl font-bold">$999.99</p>
    <Button className="w-full mt-2">Agregar al Carrito</Button>
  </div>
</Card>
```

### Card de Estadística (KPI)

```tsx
<Card padding="md" hoverable>
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-500">Ventas Totales</p>
      <p className="text-3xl font-bold">$24,567</p>
      <p className="text-sm text-success">↑ 12.5%</p>
    </div>
    <div className="text-4xl">💰</div>
  </div>
</Card>
```

### Card de Formulario

```tsx
<Card padding="lg">
  <CardHeader bordered>
    <CardTitle>Información Personal</CardTitle>
    <CardDescription>
      Actualiza tu información de perfil
    </CardDescription>
  </CardHeader>
  
  <CardContent>
    <form className="space-y-4">
      <Input label="Nombre" />
      <Input label="Email" type="email" />
    </form>
  </CardContent>
  
  <CardFooter bordered>
    <Button variant="secondary">Cancelar</Button>
    <Button variant="primary">Guardar Cambios</Button>
  </CardFooter>
</Card>
```

### Grid de Cards

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id} hoverable>
      <CardTitle>{item.title}</CardTitle>
      <CardContent>{item.description}</CardContent>
    </Card>
  ))}
</div>
```

### Card de Notificación

```tsx
<Card bordered className="border-l-4 border-l-info">
  <div className="flex gap-3">
    <div className="text-info">ℹ️</div>
    <div>
      <CardTitle as="h4">Nueva actualización</CardTitle>
      <CardDescription>
        Hay una nueva versión disponible
      </CardDescription>
      <Button size="sm" className="mt-2">
        Actualizar
      </Button>
    </div>
  </div>
</Card>
```

## Tema Oscuro

El componente Card se adapta automáticamente al tema oscuro:

```tsx
<div className="dark">
  <Card>
    <CardContent>
      Este card se ve bien en modo oscuro
    </CardContent>
  </Card>
</div>
```

## Accesibilidad

- ✅ Estructura semántica con HTML apropiado
- ✅ Contraste de colores WCAG 2.1 AA
- ✅ Soporte completo para navegación por teclado (cuando es clickeable)
- ✅ Estados de focus visibles

## Mejores Prácticas

### ✅ Hacer

- Usar `hoverable` para cards interactivos
- Usar `clickable` cuando el card completo es clickeable
- Combinar con otros componentes UI (Button, Input, etc.)
- Usar padding apropiado según el contenido
- Usar subcomponentes para estructura clara

### ❌ Evitar

- No anidar cards dentro de cards (puede crear confusión visual)
- No usar padding muy grande con contenido mínimo
- No hacer cards clickeables sin indicación visual clara
- No omitir títulos cuando el contenido no es obvio

## Variaciones Comunes

### Card Compacto

```tsx
<Card padding="sm" bordered>
  <div className="flex items-center gap-2">
    <span>🔔</span>
    <span className="text-sm">3 notificaciones nuevas</span>
  </div>
</Card>
```

### Card con Imagen de Fondo

```tsx
<Card 
  padding="lg" 
  className="bg-cover bg-center text-white"
  style={{ backgroundImage: 'url(/hero.jpg)' }}
>
  <div className="bg-black/50 -m-8 p-8 rounded-lg">
    <CardTitle className="text-white">Título sobre imagen</CardTitle>
    <CardContent className="text-white/90">
      Contenido con fondo oscuro para legibilidad
    </CardContent>
  </div>
</Card>
```

### Card de Carga (Skeleton)

```tsx
<Card padding="md">
  <div className="animate-pulse space-y-3">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
  </div>
</Card>
```

## Integración con Otros Componentes

El Card funciona perfectamente con otros componentes del sistema de diseño:

```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

<Card>
  <CardHeader>
    <CardTitle>Formulario de Contacto</CardTitle>
  </CardHeader>
  <CardContent>
    <Input label="Nombre" />
    <Input label="Email" type="email" />
  </CardContent>
  <CardFooter>
    <Button variant="primary">Enviar</Button>
  </CardFooter>
</Card>
```

## Personalización Avanzada

Puedes personalizar completamente el card usando la prop `className`:

```tsx
<Card 
  className="bg-gradient-to-br from-blue-500 to-purple-600 text-white"
  padding="lg"
>
  <CardTitle className="text-white">Card Personalizado</CardTitle>
  <CardContent className="text-white/90">
    Con gradiente de fondo
  </CardContent>
</Card>
```

## Testing

```tsx
import { render, screen } from '@testing-library/react'
import { Card, CardTitle, CardContent } from './Card'

test('renderiza el card con contenido', () => {
  render(
    <Card>
      <CardTitle>Test Title</CardTitle>
      <CardContent>Test Content</CardContent>
    </Card>
  )
  
  expect(screen.getByText('Test Title')).toBeInTheDocument()
  expect(screen.getByText('Test Content')).toBeInTheDocument()
})
```

## Recursos Adicionales

- Ver `Card.examples.tsx` para más ejemplos de uso
- Consultar `variables.css` para personalizar colores y sombras
- Revisar el sistema de diseño completo en `/src/styles/DESIGN_SYSTEM.md`
