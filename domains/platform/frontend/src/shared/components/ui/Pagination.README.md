# Componente Pagination

Componente de paginación para navegación entre páginas de contenido.

## Características

- ✅ **Botones de navegación**: Primera, Anterior, Siguiente, Última página
- ✅ **Números de página con ellipsis**: Muestra páginas relevantes con "..." para rangos omitidos
- ✅ **Información de página**: Muestra "Página X de Y"
- ✅ **Deshabilita botones en límites**: Los botones se deshabilitan cuando no hay más páginas
- ✅ **Accesible**: Implementa ARIA labels y navegación por teclado
- ✅ **Responsive**: Se adapta a móviles ocultando texto en botones
- ✅ **Personalizable**: Permite configurar número de botones, estilos y comportamiento

## Uso Básico

```tsx
import { Pagination } from '@/components/ui/Pagination'
import { useState } from 'react'

function MyComponent() {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = 20

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
    />
  )
}
```

## Props

| Prop | Tipo | Por defecto | Descripción |
|------|------|-------------|-------------|
| `currentPage` | `number` | **Requerido** | Página actual (1-indexed) |
| `totalPages` | `number` | **Requerido** | Número total de páginas |
| `onPageChange` | `(page: number) => void` | **Requerido** | Callback cuando cambia la página |
| `maxButtons` | `number` | `7` | Número máximo de botones de página a mostrar |
| `showPageInfo` | `boolean` | `true` | Mostrar texto "Página X de Y" |
| `className` | `string` | `undefined` | Clase CSS adicional para el contenedor |
| `disabled` | `boolean` | `false` | Deshabilitar toda la paginación |

## Ejemplos de Uso

### Paginación Básica

```tsx
<Pagination
  currentPage={5}
  totalPages={20}
  onPageChange={(page) => console.log('Ir a página', page)}
/>
```

### Sin Información de Página

```tsx
<Pagination
  currentPage={5}
  totalPages={20}
  onPageChange={setCurrentPage}
  showPageInfo={false}
/>
```

### Paginación Deshabilitada (durante carga)

```tsx
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
  disabled={isLoading}
/>
```

### Con Menos Botones Visibles

```tsx
<Pagination
  currentPage={currentPage}
  totalPages={50}
  onPageChange={setCurrentPage}
  maxButtons={5}
/>
```

### Uso en Catálogo de Productos

```tsx
function ProductCatalog() {
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  
  const totalProducts = 250
  const productsPerPage = 12
  const totalPages = Math.ceil(totalProducts / productsPerPage)

  const handlePageChange = async (page: number) => {
    setIsLoading(true)
    setCurrentPage(page)
    
    // Cargar productos de la nueva página
    await fetchProducts(page)
    
    setIsLoading(false)
    
    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div>
      {/* Grid de productos */}
      <ProductGrid products={products} isLoading={isLoading} />
      
      {/* Paginación */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        disabled={isLoading}
      />
    </div>
  )
}
```

### Sincronización con URL Query Params

```tsx
'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Pagination } from '@/components/ui/Pagination'

function ProductList() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentPage = Number(searchParams.get('page')) || 1
  const totalPages = 50

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`?${params.toString()}`)
  }

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
    />
  )
}
```

### Con React Query

```tsx
import { useQuery } from '@tanstack/react-query'
import { Pagination } from '@/components/ui/Pagination'
import { useState } from 'react'

function ProductList() {
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 20

  const { data, isLoading } = useQuery({
    queryKey: ['products', currentPage],
    queryFn: () => fetchProducts({ page: currentPage, limit: productsPerPage }),
  })

  const totalPages = data ? Math.ceil(data.total / productsPerPage) : 0

  return (
    <div>
      {isLoading ? (
        <ProductGridSkeleton />
      ) : (
        <ProductGrid products={data.products} />
      )}
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        disabled={isLoading}
      />
    </div>
  )
}
```

## Algoritmo de Ellipsis

El componente usa un algoritmo inteligente para mostrar números de página:

### Pocas páginas (≤ maxButtons)
```
[1] [2] [3] [4] [5]
```

### Muchas páginas - Inicio
```
[1] [2] [3] ... [20]
```

### Muchas páginas - Medio
```
[1] ... [8] [9] [10] ... [20]
```

### Muchas páginas - Final
```
[1] ... [18] [19] [20]
```

## Comportamiento Responsive

### Desktop
- Muestra todos los botones con texto completo
- Botones "Primera" y "Última" visibles
- Texto "Anterior" y "Siguiente" visible

### Móvil
- Oculta botones "Primera" y "Última"
- Solo muestra iconos en "Anterior" y "Siguiente"
- Mantiene números de página visibles

## Accesibilidad

El componente implementa las siguientes características de accesibilidad:

- ✅ **ARIA labels**: Cada botón tiene un `aria-label` descriptivo
- ✅ **ARIA current**: La página actual tiene `aria-current="page"`
- ✅ **Role navigation**: El contenedor tiene `role="navigation"`
- ✅ **Navegación por teclado**: Todos los botones son accesibles con Tab
- ✅ **Focus visible**: Los botones muestran un anillo de enfoque claro
- ✅ **Estados deshabilitados**: Los botones deshabilitados tienen `disabled` y estilos apropiados

## Estilos y Personalización

### Clases CSS Aplicadas

El componente usa Tailwind CSS con las siguientes clases principales:

- **Botones normales**: `bg-white border border-gray-300 hover:bg-gray-50`
- **Botón activo**: `bg-primary-600 text-white`
- **Botón deshabilitado**: `bg-gray-100 text-gray-400 cursor-not-allowed`
- **Focus ring**: `focus:ring-2 focus:ring-primary-500`

### Personalización con className

```tsx
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
  className="bg-gray-50 p-4 rounded-lg shadow-sm"
/>
```

## Integración con Backend

### Ejemplo con API REST

```tsx
async function fetchProducts(page: number) {
  const response = await fetch(`/api/products?page=${page}&limit=20`)
  const data = await response.json()
  
  return {
    products: data.products,
    total: data.total,
    page: data.page,
    totalPages: Math.ceil(data.total / 20),
  }
}
```

### Ejemplo con GraphQL

```tsx
const GET_PRODUCTS = gql`
  query GetProducts($page: Int!, $limit: Int!) {
    products(page: $page, limit: $limit) {
      items {
        id
        name
        price
      }
      total
      page
      totalPages
    }
  }
`

function ProductList() {
  const [currentPage, setCurrentPage] = useState(1)
  
  const { data, loading } = useQuery(GET_PRODUCTS, {
    variables: { page: currentPage, limit: 20 },
  })

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={data?.products.totalPages || 0}
      onPageChange={setCurrentPage}
      disabled={loading}
    />
  )
}
```

## Casos de Uso Comunes

### 1. Catálogo de Productos
```tsx
<Pagination
  currentPage={currentPage}
  totalPages={Math.ceil(totalProducts / productsPerPage)}
  onPageChange={handlePageChange}
/>
```

### 2. Lista de Pedidos
```tsx
<Pagination
  currentPage={currentPage}
  totalPages={Math.ceil(totalOrders / ordersPerPage)}
  onPageChange={handlePageChange}
  showPageInfo={true}
/>
```

### 3. Resultados de Búsqueda
```tsx
<Pagination
  currentPage={currentPage}
  totalPages={Math.ceil(searchResults.total / resultsPerPage)}
  onPageChange={handlePageChange}
  disabled={isSearching}
/>
```

### 4. Dashboard de Administración
```tsx
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={handlePageChange}
  maxButtons={5}
  className="mt-6"
/>
```

## Mejores Prácticas

### ✅ Hacer

- Usar `disabled={isLoading}` durante la carga de datos
- Hacer scroll al inicio al cambiar de página
- Sincronizar con URL query params para compartir enlaces
- Mostrar skeleton loaders mientras se cargan los datos
- Validar que `currentPage` esté dentro del rango válido

### ❌ Evitar

- No cambiar `totalPages` sin actualizar `currentPage` si es necesario
- No olvidar manejar el caso de 0 páginas
- No usar índices 0-based (el componente espera 1-indexed)
- No bloquear la UI durante la carga (usar `disabled` en su lugar)

## Requisitos Cumplidos

Este componente cumple con los requisitos especificados en la tarea 6.2:

- ✅ **Implementar botones de navegación**: Primera, Anterior, Siguiente, Última
- ✅ **Agregar números de página con ellipsis**: Algoritmo inteligente de ellipsis
- ✅ **Mostrar "Página X de Y"**: Configurable con `showPageInfo`
- ✅ **Deshabilitar botones en límites**: Botones deshabilitados en primera/última página
- ✅ **Requisitos 7.1**: Integración con catálogo de productos

## Soporte de Navegadores

- ✅ Chrome/Edge (últimas 2 versiones)
- ✅ Firefox (últimas 2 versiones)
- ✅ Safari (últimas 2 versiones)
- ✅ Móviles (iOS Safari, Chrome Android)

## Dependencias

- React 18+
- Tailwind CSS 3+
- `@/lib/utils` (función `cn` para clases condicionales)

## Archivos Relacionados

- `Pagination.tsx` - Componente principal
- `Pagination.examples.tsx` - Ejemplos de uso
- `Pagination.README.md` - Este archivo de documentación
