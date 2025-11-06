# useURLFilters Hook

Hook personalizado para sincronizar filtros con URL query params en Next.js.

## Características

- ✅ Sincronización automática de estado con URL
- ✅ URLs compartibles con filtros aplicados
- ✅ Soporte para navegación del navegador (back/forward)
- ✅ Actualización sin recargar la página
- ✅ URLs limpias (valores por defecto no aparecen)
- ✅ Type-safe con TypeScript
- ✅ Parseo automático de tipos (string, number, boolean)

## Uso Básico

```tsx
import { useURLFilters } from '@/hooks/useURLFilters'

interface MyFilters {
  category: string
  minPrice: number
  maxPrice: number
  inStock: boolean
}

function MyComponent() {
  const { filters, updateFilters, clearFilters } = useURLFilters<MyFilters>({
    category: '',
    minPrice: 0,
    maxPrice: 0,
    inStock: false
  })

  return (
    <div>
      <select
        value={filters.category}
        onChange={(e) => updateFilters({ category: e.target.value })}
      >
        <option value="">Todas</option>
        <option value="laptops">Laptops</option>
      </select>

      <button onClick={clearFilters}>
        Limpiar Filtros
      </button>
    </div>
  )
}
```

## API

### Parámetros

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `defaultFilters` | `T extends Record<string, any>` | Objeto con los valores por defecto de los filtros |

### Retorno

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `filters` | `T` | Estado actual de los filtros |
| `updateFilters` | `(newFilters: Partial<T>) => void` | Actualiza filtros y URL |
| `clearFilters` | `() => void` | Resetea todos los filtros a valores por defecto |
| `setFiltersFromURL` | `() => void` | Sincroniza filtros desde URL (útil para efectos) |

## Ejemplos

### Ejemplo 1: Filtros de Catálogo

```tsx
interface CatalogFilters {
  category: string
  brand: string
  minPrice: number
  maxPrice: number
  sortBy: string
  search: string
}

function ProductCatalog() {
  const { filters, updateFilters, clearFilters } = useURLFilters<CatalogFilters>({
    category: '',
    brand: '',
    minPrice: 0,
    maxPrice: 0,
    sortBy: 'name',
    search: ''
  })

  // Los filtros se sincronizan automáticamente con la URL
  // Ejemplo de URL: /productos?category=laptops&minPrice=500&sortBy=price
}
```

### Ejemplo 2: Paginación

```tsx
interface PaginationFilters {
  page: number
  limit: number
}

function PaginatedList() {
  const { filters, updateFilters } = useURLFilters<PaginationFilters>({
    page: 1,
    limit: 20
  })

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage })
  }

  // URL: /lista?page=3&limit=20
}
```

### Ejemplo 3: Búsqueda con Debounce

```tsx
import { useEffect, useState } from 'react'
import { useURLFilters } from '@/hooks/useURLFilters'

function SearchComponent() {
  const { filters, updateFilters } = useURLFilters({ search: '' })
  const [localSearch, setLocalSearch] = useState(filters.search)

  // Debounce: actualizar URL solo después de 300ms sin escribir
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilters({ search: localSearch })
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearch])

  return (
    <input
      value={localSearch}
      onChange={(e) => setLocalSearch(e.target.value)}
      placeholder="Buscar..."
    />
  )
}
```

## Comportamiento

### Parseo de Tipos

El hook parsea automáticamente los valores de la URL según el tipo del valor por defecto:

```tsx
// Valores por defecto
{
  category: '',      // string
  minPrice: 0,       // number
  inStock: false     // boolean
}

// URL: ?category=laptops&minPrice=500&inStock=true

// Resultado parseado
{
  category: 'laptops',  // string
  minPrice: 500,        // number (parseado)
  inStock: true         // boolean (parseado)
}
```

### URLs Limpias

Los valores por defecto no aparecen en la URL para mantenerla limpia:

```tsx
const { filters, updateFilters } = useURLFilters({
  category: '',
  minPrice: 0,
  sortBy: 'name'
})

// Si category = '', minPrice = 0, sortBy = 'name'
// URL: /productos (sin query params)

// Si category = 'laptops', minPrice = 500, sortBy = 'name'
// URL: /productos?category=laptops&minPrice=500
// (sortBy no aparece porque es el valor por defecto)
```

### Navegación del Navegador

El hook escucha los eventos `popstate` para sincronizar los filtros cuando el usuario usa los botones atrás/adelante:

```tsx
// Usuario aplica filtros
updateFilters({ category: 'laptops' })
// URL: /productos?category=laptops

// Usuario hace clic en "Atrás"
// Los filtros se resetean automáticamente
// URL: /productos
```

## Integración con ProductCatalog

```tsx
import { useURLFilters } from '@/hooks/useURLFilters'

interface FilterState {
  category: string
  brand: string
  minPrice: number
  maxPrice: number
  sortBy: string
  search: string
}

export function ProductCatalog() {
  const { filters, updateFilters, clearFilters } = useURLFilters<FilterState>({
    category: '',
    brand: '',
    minPrice: 0,
    maxPrice: 0,
    sortBy: 'name',
    search: ''
  })

  return (
    <div>
      <ProductFilters
        filters={filters}
        onFilterChange={updateFilters}
        onClearFilters={clearFilters}
      />
      
      <ProductGrid filters={filters} />
    </div>
  )
}
```

## Página de Prueba

Puedes probar el hook en: `/test-url-sync`

Esta página incluye:
- Controles interactivos para todos los tipos de filtros
- Visualización de la URL actual
- Estado de filtros en tiempo real
- Instrucciones de prueba

## Ventajas

1. **URLs Compartibles**: Los usuarios pueden compartir URLs con filtros aplicados
2. **SEO Friendly**: Los motores de búsqueda pueden indexar páginas con filtros
3. **Experiencia de Usuario**: Navegación del navegador funciona correctamente
4. **Persistencia**: Los filtros se mantienen al recargar la página
5. **Type-Safe**: TypeScript garantiza tipos correctos
6. **Reutilizable**: Funciona con cualquier tipo de filtros

## Requisitos Cumplidos

- ✅ **7.3**: Sincronizar filtros con URL
- ✅ **7.3**: Implementar navegación con historial del navegador
- ✅ **7.3**: Permitir compartir URLs con filtros aplicados

## Notas de Implementación

- Usa `useRouter` y `useSearchParams` de Next.js 13+ (App Router)
- Compatible con Server Components (el hook se usa en Client Components)
- No recarga la página al actualizar filtros (`scroll: false`)
- Limpia automáticamente valores por defecto de la URL
