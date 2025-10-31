# Badge Component

Componente Badge para mostrar etiquetas, estados, categorías y notificaciones de forma visual y compacta.

## Características

- ✅ **7 variantes de color**: default, primary, success, warning, error, info, secondary
- ✅ **3 tamaños**: sm, md, lg
- ✅ **Soporte para iconos**: Muestra iconos antes del texto
- ✅ **Punto indicador**: Opción de mostrar un punto de estado
- ✅ **Totalmente accesible**: Cumple con WCAG 2.1 AA
- ✅ **TypeScript**: Tipado completo con IntelliSense
- ✅ **Responsive**: Se adapta a diferentes tamaños de pantalla

## Uso Básico

```tsx
import { Badge } from '@/components/ui/Badge'

// Badge simple
<Badge>Default</Badge>

// Con variante de color
<Badge variant="success">Completado</Badge>

// Con tamaño
<Badge size="lg" variant="primary">Grande</Badge>
```

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `variant` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'error' \| 'info' \| 'secondary'` | `'default'` | Variante de color del badge |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamaño del badge |
| `icon` | `ReactNode` | `undefined` | Icono a mostrar antes del texto |
| `dot` | `boolean` | `false` | Si muestra un punto indicador |
| `className` | `string` | `undefined` | Clases CSS adicionales |

## Variantes de Color

### Default
Uso general, información neutra.
```tsx
<Badge variant="default">Default</Badge>
```

### Primary
Información destacada, acciones principales.
```tsx
<Badge variant="primary">Primary</Badge>
```

### Success
Estados exitosos, confirmaciones.
```tsx
<Badge variant="success">Success</Badge>
```

### Warning
Advertencias, estados pendientes.
```tsx
<Badge variant="warning">Warning</Badge>
```

### Error
Errores, estados críticos.
```tsx
<Badge variant="error">Error</Badge>
```

### Info
Información adicional, estados informativos.
```tsx
<Badge variant="info">Info</Badge>
```

### Secondary
Categorías, etiquetas secundarias.
```tsx
<Badge variant="secondary">Secondary</Badge>
```

## Tamaños

### Small (sm)
Para espacios reducidos o texto pequeño.
```tsx
<Badge size="sm">Small</Badge>
```

### Medium (md)
Tamaño estándar, uso general.
```tsx
<Badge size="md">Medium</Badge>
```

### Large (lg)
Para mayor visibilidad o énfasis.
```tsx
<Badge size="lg">Large</Badge>
```

## Con Iconos

Puedes agregar iconos SVG antes del texto:

```tsx
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
```

## Con Punto Indicador

Útil para mostrar estados de conexión o disponibilidad:

```tsx
<Badge variant="success" dot>En línea</Badge>
<Badge variant="warning" dot>Ausente</Badge>
<Badge variant="error" dot>Desconectado</Badge>
```

## Casos de Uso Comunes

### Estados de Pedido

```tsx
<Badge variant="warning">Pendiente</Badge>
<Badge variant="info">Procesando</Badge>
<Badge variant="primary">Enviado</Badge>
<Badge variant="success">Entregado</Badge>
<Badge variant="error">Cancelado</Badge>
```

### Descuentos en Productos

```tsx
<Badge variant="error" size="lg">-20%</Badge>
<Badge variant="error" size="lg">-50%</Badge>
<Badge variant="error" size="lg">OFERTA</Badge>
```

### Disponibilidad de Stock

```tsx
<Badge variant="success" dot>En stock</Badge>
<Badge variant="warning" dot>Pocas unidades</Badge>
<Badge variant="error" dot>Agotado</Badge>
```

### Notificaciones

```tsx
<Badge variant="error" size="sm">3</Badge>
<Badge variant="primary" size="sm">12</Badge>
<Badge variant="success" size="sm">Nuevo</Badge>
```

### Categorías de Productos

```tsx
<Badge variant="secondary">Laptops</Badge>
<Badge variant="secondary">Componentes</Badge>
<Badge variant="secondary">Periféricos</Badge>
```

### Prioridades de Tickets

```tsx
<Badge variant="default">Baja</Badge>
<Badge variant="info">Media</Badge>
<Badge variant="warning">Alta</Badge>
<Badge variant="error">Crítica</Badge>
```

### Estado del Chatbot

```tsx
<Badge variant="warning" dot>Modo Básico</Badge>
<Badge variant="success" dot>IA Activa</Badge>
```

### Verificación de Usuario

```tsx
<Badge 
  variant="success" 
  icon={<CheckIcon />}
>
  Verificado
</Badge>
```

## Accesibilidad

El componente Badge está diseñado siguiendo las mejores prácticas de accesibilidad:

- ✅ Los iconos tienen `aria-hidden="true"` para evitar redundancia
- ✅ El contenido de texto es legible por lectores de pantalla
- ✅ Los colores cumplen con el contraste mínimo WCAG 2.1 AA (4.5:1)
- ✅ El componente es semántico usando `<span>`

## Personalización

Puedes personalizar el Badge usando la prop `className`:

```tsx
<Badge className="uppercase tracking-wider">Custom</Badge>
```

## Integración con Otros Componentes

### En ProductCard

```tsx
<div className="relative">
  <img src={product.image} alt={product.name} />
  {product.discount && (
    <Badge 
      variant="error" 
      size="lg" 
      className="absolute top-2 right-2"
    >
      -{product.discount}%
    </Badge>
  )}
</div>
```

### En Header (Notificaciones)

```tsx
<button className="relative">
  <BellIcon />
  {notificationCount > 0 && (
    <Badge 
      variant="error" 
      size="sm" 
      className="absolute -top-1 -right-1"
    >
      {notificationCount}
    </Badge>
  )}
</button>
```

### En Dashboard (Estado de Servicios)

```tsx
<div className="flex items-center gap-2">
  <span>Chatbot</span>
  <Badge variant="success" dot>Activo</Badge>
</div>
```

## Notas de Implementación

- El componente usa `forwardRef` para permitir refs
- Utiliza la función `cn()` de `@/lib/utils` para combinar clases
- Los tamaños de iconos se ajustan automáticamente según el tamaño del badge
- El punto indicador cambia de color según la variante
- Todas las props HTML estándar de `<span>` son soportadas

## Requisitos Relacionados

Este componente cumple con el **Requisito 2.4** del documento de requisitos:
- Indicador visual cuando el sistema está usando SimpleFallbackRecognizer (Modo Básico)
- Estados de disponibilidad y notificaciones
- Categorización visual de información

## Ver También

- [Button Component](./Button.README.md)
- [Card Component](./Card.README.md)
- [Modal Component](./Modal.README.md)
