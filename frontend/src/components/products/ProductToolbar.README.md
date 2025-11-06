# ProductToolbar Component

Componente de barra de herramientas para el catálogo de productos que proporciona controles de visualización y ordenamiento.

## Características

- ✅ Contador de productos encontrados
- ✅ Selector de ordenamiento con múltiples opciones
- ✅ Toggle de vista (grid/list) con iconos visuales
- ✅ Botón de filtros para móvil (opcional)
- ✅ Diseño responsive
- ✅ Accesibilidad completa (ARIA labels, navegación por teclado)

## Uso Básico

```tsx
import { ProductToolbar } from '@/components/products'

function CatalogPage() {
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  return (
    <ProductToolbar
      totalProducts={150}
      currentSort={sortBy}
      onSortChange={setSortBy}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      onOpenFilters={() => setShowFilters(true)}
      showFiltersButton={true}
    />
  )
}
```

## Props

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `totalProducts` | `number` | ✅ | Número total de productos encontrados |
| `currentSort` | `string` | ✅ | Valor actual del ordenamiento |
| `onSortChange` | `(sort: string) => void` | ✅ | Callback cuando cambia el ordenamiento |
| `viewMode` | `'grid' \| 'list'` | ✅ | Modo de vista actual |
| `onViewModeChange` | `(mode: 'grid' \| 'list') => void` | ✅ | Callback cuando cambia el modo de vista |
| `onOpenFilters` | `() => void` | ❌ | Callback para abrir filtros (móvil) |
| `showFiltersButton` | `boolean` | ❌ | Mostrar botón de filtros (default: false) |

## Opciones de Ordenamiento

El selector de ordenamiento incluye las siguientes opciones:

- `name` - Nombre A-Z
- `-name` - Nombre Z-A
- `our_price` - Precio: Menor a Mayor
- `-our_price` - Precio: Mayor a Menor
- `-created_at` - Más Recientes
- `created_at` - Más Antiguos
- `-rating` - Mejor Valorados

## Modos de Vista

### Grid (Cuadrícula)
- Vista por defecto
- Productos en grid responsivo
- Mejor para explorar visualmente

### List (Lista)
- Vista horizontal
- Más información visible por producto
- Mejor para comparar detalles

## Responsive Design

### Desktop (≥1024px)
- Todos los controles visibles
- Botón de filtros oculto (sidebar siempre visible)
- Layout horizontal completo

### Tablet (640px - 1023px)
- Controles en dos filas si es necesario
- Botón de filtros visible
- Selector de ordenamiento con ancho completo

### Mobile (<640px)
- Controles apilados verticalmente
- Botón de filtros prominente
- Selector de ordenamiento con ancho completo

## Accesibilidad

- ✅ Etiquetas ARIA apropiadas
- ✅ Navegación por teclado completa
- ✅ Estados de botones (aria-pressed)
- ✅ Tooltips descriptivos
- ✅ Contraste de colores WCAG 2.1 AA

## Integración con ProductCatalog

El componente está diseñado para integrarse perfectamente con `ProductCatalog`:

```tsx
<ProductToolbar
  totalProducts={pagination?.total || 0}
  currentSort={filters.sortBy}
  onSortChange={(sort) => handleFilterChange({ sortBy: sort })}
  viewMode={viewMode}
  onViewModeChange={setViewMode}
  onOpenFilters={() => setShowMobileFilters(true)}
  showFiltersButton={true}
/>
```

## Ejemplos

### Toolbar Básico (sin filtros móviles)

```tsx
<ProductToolbar
  totalProducts={42}
  currentSort="our_price"
  onSortChange={setSortBy}
  viewMode="grid"
  onViewModeChange={setViewMode}
/>
```

### Toolbar Completo (con filtros móviles)

```tsx
<ProductToolbar
  totalProducts={150}
  currentSort="-rating"
  onSortChange={setSortBy}
  viewMode="list"
  onViewModeChange={setViewMode}
  onOpenFilters={() => setShowFilters(true)}
  showFiltersButton={true}
/>
```

## Página de Prueba

Puedes probar el componente en: `/test-toolbar`

Esta página incluye:
- Diferentes estados del toolbar
- Visualización del estado actual
- Instrucciones de prueba

## Requisitos Cumplidos

- ✅ **7.1**: Mostrar contador de productos
- ✅ **7.3**: Selector de ordenamiento
- ✅ **7.3**: Toggle de vista (grid/list)
- ✅ **7.3**: Botón de filtros para móvil

## Notas de Implementación

1. El componente es completamente controlado (controlled component)
2. No mantiene estado interno - todo se maneja por props
3. Los callbacks son opcionales para máxima flexibilidad
4. El diseño sigue el sistema de diseño de TechNovaStore
5. Compatible con modo oscuro (cuando se implemente)

## Próximas Mejoras

- [ ] Agregar animaciones de transición entre vistas
- [ ] Implementar persistencia de preferencias en localStorage
- [ ] Agregar más opciones de ordenamiento personalizadas
- [ ] Soporte para ordenamiento por múltiples campos
