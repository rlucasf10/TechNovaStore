# Skeleton Component

Componente base para crear efectos de carga tipo skeleton con animación shimmer.

## Uso Básico

```tsx
import { Skeleton, SkeletonText } from '@/components/ui';

// Skeleton rectangular
<Skeleton width={200} height={100} />

// Skeleton circular (para avatares)
<Skeleton width={50} height={50} variant="circular" />

// Skeleton de texto (una línea)
<Skeleton variant="text" width="100%" height={16} />

// Múltiples líneas de texto
<SkeletonText lines={3} lastLineWidth={60} />
```

## Props

### Skeleton

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `width` | `number \| string` | - | Ancho del skeleton |
| `height` | `number \| string` | - | Alto del skeleton |
| `variant` | `'text' \| 'circular' \| 'rectangular'` | `'rectangular'` | Variante del skeleton |
| `className` | `string` | `''` | Clases CSS adicionales |
| `noAnimation` | `boolean` | `false` | Deshabilitar animación shimmer |

### SkeletonText

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `lines` | `number` | `3` | Número de líneas de texto |
| `lastLineWidth` | `number` | `60` | Ancho de la última línea (porcentaje) |
| `className` | `string` | `''` | Clases CSS adicionales |

## Ejemplos

### Skeleton para Card

```tsx
<div className="bg-white rounded-lg p-4 space-y-3">
  <Skeleton height={200} width="100%" />
  <SkeletonText lines={2} lastLineWidth={70} />
  <Skeleton height={40} width="100%" />
</div>
```

### Skeleton para Avatar con Texto

```tsx
<div className="flex items-center gap-3">
  <Skeleton width={48} height={48} variant="circular" />
  <div className="flex-1">
    <Skeleton height={16} width="60%" variant="text" />
    <Skeleton height={14} width="40%" variant="text" />
  </div>
</div>
```

## Animación Shimmer

La animación shimmer está implementada con CSS y se aplica automáticamente a todos los skeletons. Para deshabilitarla, usa la prop `noAnimation`.

## Accesibilidad

- Todos los skeletons tienen `aria-hidden="true"` para que los lectores de pantalla los ignoren
- Se recomienda agregar un mensaje de carga visible para usuarios de lectores de pantalla

## Tema Oscuro

Los skeletons se adaptan automáticamente al tema oscuro usando las clases de Tailwind.
