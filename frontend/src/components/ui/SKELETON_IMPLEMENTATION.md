# Implementación de Skeleton Loaders

## Resumen

Se han implementado componentes de skeleton loader con animación shimmer para mejorar la experiencia de usuario durante la carga de contenido.

## Componentes Implementados

### 1. Skeleton (Base)
**Archivo:** `Skeleton.tsx`

Componente base reutilizable para crear skeletons personalizados.

**Características:**
- Tres variantes: `text`, `circular`, `rectangular`
- Animación shimmer configurable
- Soporte para tema oscuro
- Props flexibles para width y height

**Uso:**
```tsx
<Skeleton width={200} height={100} variant="rectangular" />
<Skeleton width={60} height={60} variant="circular" />
```

### 2. SkeletonText
**Archivo:** `Skeleton.tsx`

Componente optimizado para texto con múltiples líneas.

**Características:**
- Configurable número de líneas
- Ancho personalizable para última línea
- Espaciado automático entre líneas

**Uso:**
```tsx
<SkeletonText lines={3} lastLineWidth={70} />
```

### 3. ProductCardSkeleton
**Archivo:** `ProductCardSkeleton.tsx`

Skeleton para tarjetas de producto en el catálogo.

**Características:**
- Imagen con aspect ratio 1:1
- Badge de descuento placeholder
- Nombre (2 líneas)
- Rating placeholder
- Precio placeholder
- Botón de acción

**Uso:**
```tsx
<ProductCardSkeleton />
```

### 4. ProductCardSkeletonGrid
**Archivo:** `ProductCardSkeleton.tsx`

Grid responsivo de múltiples ProductCardSkeleton.

**Características:**
- Grid responsivo (1-4 columnas según viewport)
- Número configurable de skeletons
- Espaciado consistente

**Uso:**
```tsx
<ProductCardSkeletonGrid count={8} />
```

### 5. ProductDetailSkeleton
**Archivo:** `ProductDetailSkeleton.tsx`

Skeleton completo para página de detalle de producto.

**Características:**
- Breadcrumbs
- Galería de imágenes (principal + thumbnails)
- Información del producto
- Precio y disponibilidad
- Comparador de precios
- Tabs de contenido
- Especificaciones técnicas
- Productos relacionados

**Uso:**
```tsx
<ProductDetailSkeleton />
```

### 6. DashboardSkeleton
**Archivo:** `DashboardSkeleton.tsx`

Skeleton completo para dashboard de usuario.

**Características:**
- Header con saludo
- Grid de KPIs (4 tarjetas)
- Layout de dos columnas
- Pedidos recientes
- Gráficos
- Notificaciones
- Acciones rápidas

**Uso:**
```tsx
<DashboardSkeleton />
```

### 7. DashboardCardSkeleton
**Archivo:** `DashboardSkeleton.tsx`

Skeleton para tarjetas individuales del dashboard.

**Características:**
- Variante con gráfico
- Variante con texto
- Espaciado consistente

**Uso:**
```tsx
<DashboardCardSkeleton />
<DashboardCardSkeleton withChart />
```

## Animación Shimmer

La animación shimmer está implementada en `globals.css`:

```css
.animate-shimmer {
  background: linear-gradient(
    90deg,
    rgba(229, 231, 235, 1) 0%,
    rgba(243, 244, 246, 1) 50%,
    rgba(229, 231, 235, 1) 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s linear infinite;
}
```

**Características:**
- Animación suave de 2 segundos
- Gradiente de izquierda a derecha
- Soporte para tema oscuro
- Puede deshabilitarse con prop `noAnimation`

## Integración con Tailwind

La animación shimmer está configurada en `tailwind.config.js`:

```javascript
keyframes: {
  shimmer: {
    '0%': { backgroundPosition: '-1000px 0' },
    '100%': { backgroundPosition: '1000px 0' },
  },
}
```

## Accesibilidad

Todos los skeletons incluyen:
- `aria-hidden="true"` para ocultar de lectores de pantalla
- `aria-label` descriptivo en componentes complejos
- Contraste adecuado en tema claro y oscuro

## Tema Oscuro

Los skeletons se adaptan automáticamente al tema oscuro:
- Colores base: `bg-gray-200` (claro) / `bg-gray-700` (oscuro)
- Gradiente shimmer ajustado para cada tema
- Transiciones suaves entre temas

## Ejemplos de Uso

### En Catálogo de Productos

```tsx
import { ProductCardSkeletonGrid } from '@/components/ui';

function ProductCatalog() {
  const { data: products, isLoading } = useProducts();

  if (isLoading) {
    return <ProductCardSkeletonGrid count={12} />;
  }

  return (
    <div className="grid grid-cols-4 gap-6">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### En Detalle de Producto

```tsx
import { ProductDetailSkeleton } from '@/components/ui';

function ProductDetailPage({ params }: { params: { id: string } }) {
  const { data: product, isLoading } = useProduct(params.id);

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  return <ProductDetail product={product} />;
}
```

### En Dashboard

```tsx
import { DashboardSkeleton } from '@/components/ui';

function UserDashboard() {
  const { data: dashboardData, isLoading } = useDashboardData();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return <Dashboard data={dashboardData} />;
}
```

## Testing

Para ver todos los skeletons en acción, visita:
```
http://localhost:3000/ejemplos/skeleton
```

## Requisitos Cumplidos

✅ **3.1** - Implementar skeleton loaders para mejorar la percepción de rendimiento  
✅ **ProductCardSkeleton** - Skeleton para tarjetas de producto  
✅ **ProductDetailSkeleton** - Skeleton para página de detalle  
✅ **DashboardSkeleton** - Skeleton para dashboard de usuario  
✅ **Animación shimmer** - Efecto de carga animado  

## Próximos Pasos

Los skeleton loaders están listos para ser integrados en:
- Página de catálogo de productos (Fase 7)
- Página de detalle de producto (Fase 7)
- Dashboard de usuario (Fase 12)
- Dashboard de administración (Fase 13)

## Notas Técnicas

- Los skeletons son componentes client-side (`'use client'` no necesario en componentes puros)
- No tienen dependencias externas (solo React y Tailwind)
- Performance optimizado (sin re-renders innecesarios)
- Tamaño del bundle mínimo (~2KB gzipped)
