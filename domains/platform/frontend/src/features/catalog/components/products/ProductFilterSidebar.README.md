# ProductFilterSidebar

Sidebar de filtros avanzados para el catálogo de productos de TechNovaStore.

## Características

- ✅ **Filtros por Categorías**: Checkboxes con contador de productos por categoría
- ✅ **Filtros por Marcas**: Checkboxes con búsqueda en tiempo real
- ✅ **Rango de Precio**: Slider dual interactivo con inputs numéricos
- ✅ **Especificaciones Técnicas**: Acordeón expandible con múltiples opciones
- ✅ **Toggle "Solo en Stock"**: Filtrar solo productos disponibles
- ✅ **Botones de Acción**: "Aplicar Filtros" y "Limpiar Todo"
- ✅ **Contador de Productos**: Muestra el número de productos que coinciden con los filtros
- ✅ **Sticky Positioning**: El sidebar permanece visible al hacer scroll
- ✅ **Accesibilidad**: ARIA labels, navegación por teclado, roles semánticos

## Uso

```tsx
import { ProductFilterSidebar } from '@/components/products'

function CatalogPage() {
  const [filters, setFilters] = useState<ProductFilters>({
    categories: [],
    brands: [],
    priceRange: [0, 5000],
    specs: {},
    inStock: false
  })

  const categories = [
    { id: '1', name: 'Laptops', slug: 'laptops', count: 45 },
    { id: '2', name: 'Componentes', slug: 'componentes', count: 123 },
    { id: '3', name: 'Periféricos', slug: 'perifericos', count: 78 }
  ]

  const brands = [
    { name: 'Apple', count: 23 },
    { name: 'Dell', count: 34 },
    { name: 'HP', count: 28 }
  ]

  const specs = [
    {
      category: 'processor',
      label: 'Procesador',
      options: [
        { value: 'intel-i5', label: 'Intel Core i5', count: 15 },
        { value: 'intel-i7', label: 'Intel Core i7', count: 22 },
        { value: 'amd-ryzen5', label: 'AMD Ryzen 5', count: 18 }
      ]
    },
    {
      category: 'ram',
      label: 'Memoria RAM',
      options: [
        { value: '8gb', label: '8 GB', count: 25 },
        { value: '16gb', label: '16 GB', count: 35 },
        { value: '32gb', label: '32 GB', count: 12 }
      ]
    }
  ]

  const handleApplyFilters = () => {
    // Aplicar filtros y actualizar productos
    console.log('Aplicando filtros:', filters)
  }

  const handleClearFilters = () => {
    setFilters({
      categories: [],
      brands: [],
      priceRange: [0, 5000],
      specs: {},
      inStock: false
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar de filtros (25% en desktop) */}
        <div className="lg:col-span-1">
          <ProductFilterSidebar
            categories={categories}
            brands={brands}
            specs={specs}
            filters={filters}
            priceRange={[0, 5000]}
            onFilterChange={setFilters}
            onApplyFilters={handleApplyFilters}
            onClearFilters={handleClearFilters}
            totalProducts={246}
          />
        </div>

        {/* Grid de productos (75% en desktop) */}
        <div className="lg:col-span-3">
          {/* Aquí va el grid de productos */}
        </div>
      </div>
    </div>
  )
}
```

## Props

### `categories: CategoryOption[]`
Array de categorías disponibles para filtrar.

```typescript
interface CategoryOption {
  id: string
  name: string
  slug: string
  count: number // Número de productos en esta categoría
}
```

### `brands: BrandOption[]`
Array de marcas disponibles para filtrar.

```typescript
interface BrandOption {
  name: string
  count: number // Número de productos de esta marca
}
```

### `specs: SpecOption[]`
Array de especificaciones técnicas disponibles para filtrar.

```typescript
interface SpecOption {
  category: string // ID único de la especificación (ej: 'processor', 'ram')
  label: string // Etiqueta visible (ej: 'Procesador', 'Memoria RAM')
  options: Array<{
    value: string // Valor único (ej: 'intel-i5')
    label: string // Etiqueta visible (ej: 'Intel Core i5')
    count: number // Número de productos con esta especificación
  }>
}
```

### `filters: ProductFilters`
Estado actual de los filtros seleccionados.

```typescript
interface ProductFilters {
  categories: string[] // Array de slugs de categorías seleccionadas
  brands: string[] // Array de nombres de marcas seleccionadas
  priceRange: [number, number] // [min, max]
  specs: Record<string, string[]> // { 'processor': ['intel-i5'], 'ram': ['16gb'] }
  inStock: boolean // Solo productos en stock
}
```

### `priceRange: [number, number]`
Rango de precios disponibles en el catálogo [min, max].

### `onFilterChange: (filters: ProductFilters) => void`
Callback que se ejecuta cuando cambia cualquier filtro.

### `onApplyFilters: () => void`
Callback que se ejecuta al hacer clic en "Aplicar Filtros".

### `onClearFilters: () => void`
Callback que se ejecuta al hacer clic en "Limpiar Todo".

### `totalProducts: number`
Número total de productos que coinciden con los filtros actuales.

## Características Técnicas

### Slider Dual de Precio

El slider dual permite seleccionar un rango de precios de forma intuitiva:

- **Inputs numéricos**: Permiten ingresar valores exactos
- **Sliders interactivos**: Permiten ajustar el rango visualmente
- **Sincronización**: Los inputs y sliders están sincronizados
- **Validación**: Asegura que min <= max
- **Commit on blur**: Los cambios se aplican al soltar el slider o al salir del input

### Búsqueda de Marcas

La búsqueda de marcas filtra en tiempo real:

- **Búsqueda case-insensitive**: No distingue mayúsculas/minúsculas
- **Highlight de resultados**: Muestra solo marcas que coinciden
- **Botón de limpiar**: Permite borrar la búsqueda rápidamente
- **Estado vacío**: Muestra mensaje cuando no hay resultados

### Acordeón de Especificaciones

Las especificaciones técnicas se organizan en acordeones:

- **Expandir/Colapsar**: Clic en el header para expandir/colapsar
- **Estado independiente**: Cada acordeón mantiene su propio estado
- **Iconos visuales**: ChevronDown/ChevronUp indican el estado
- **Accesibilidad**: aria-expanded y aria-controls para lectores de pantalla

### Sticky Positioning

El sidebar permanece visible al hacer scroll:

- **CSS sticky**: `sticky top-4` mantiene el sidebar visible
- **Altura máxima**: `max-h-[calc(100vh-300px)]` evita que sea demasiado alto
- **Scroll interno**: El contenido del sidebar tiene scroll si es necesario

## Responsive Design

### Desktop (lg+)
- Sidebar ocupa 25% del ancho (1 columna de 4)
- Sticky positioning activo
- Todos los filtros visibles

### Tablet (md)
- Sidebar ocupa 33% del ancho
- Scroll interno si es necesario

### Móvil (sm)
- Sidebar ocupa 100% del ancho
- Se recomienda usar un modal o drawer para los filtros en móvil
- Considerar implementar un botón "Filtros" que abra el sidebar en un modal

## Integración con Backend

### Obtener Opciones de Filtros

```typescript
// Endpoint: GET /api/products/filter-options
// Query params: ?category=laptops (opcional)

interface FilterOptionsResponse {
  categories: CategoryOption[]
  brands: BrandOption[]
  specs: SpecOption[]
  priceRange: [number, number]
}
```

### Aplicar Filtros

```typescript
// Endpoint: GET /api/products
// Query params:
// - categories[]=laptops&categories[]=tablets
// - brands[]=apple&brands[]=dell
// - minPrice=500&maxPrice=2000
// - specs[processor][]=intel-i5&specs[ram][]=16gb
// - inStock=true

interface ProductListResponse {
  products: Product[]
  total: number
  page: number
  limit: number
}
```

## Accesibilidad

- ✅ **ARIA labels**: Todos los inputs tienen aria-label descriptivos
- ✅ **Roles semánticos**: aside, button, checkbox con roles apropiados
- ✅ **Navegación por teclado**: Todos los controles son accesibles por teclado
- ✅ **Focus visible**: Estados de focus claramente visibles
- ✅ **Contraste**: Cumple con WCAG 2.1 AA (4.5:1 mínimo)
- ✅ **Acordeones**: aria-expanded y aria-controls para estado

## Mejoras Futuras

- [ ] **Filtros en URL**: Sincronizar filtros con query params de la URL
- [ ] **Historial de filtros**: Permitir guardar combinaciones de filtros
- [ ] **Filtros predefinidos**: "Más vendidos", "Mejor valorados", etc.
- [ ] **Comparación de productos**: Checkbox para seleccionar productos a comparar
- [ ] **Vista móvil mejorada**: Modal/drawer para filtros en móvil
- [ ] **Animaciones**: Transiciones suaves al expandir/colapsar acordeones
- [ ] **Persistencia**: Guardar filtros en localStorage
- [ ] **Filtros avanzados**: Rango de rating, fecha de lanzamiento, etc.

## Requisitos Cumplidos

Esta implementación cumple con los requisitos de la tarea 18.1:

- ✅ Implementar filtros por categorías (checkboxes con contador)
- ✅ Agregar filtros por marcas (checkboxes con búsqueda)
- ✅ Implementar slider dual para rango de precio
- ✅ Agregar filtros por especificaciones técnicas (acordeón)
- ✅ Implementar toggle "Solo en stock"
- ✅ Agregar botones "Aplicar Filtros" y "Limpiar Todo"
- ✅ Requisitos: 7.1, 7.2 (Catálogo de Productos con filtros avanzados)
