# Loading Component

Componente de carga (spinner) para indicar procesos en curso, con variantes de overlay para bloquear la interacción del usuario.

## Características

- ✅ **3 tamaños**: sm, md, lg
- ✅ **Animación suave**: Spinner con animación CSS optimizada
- ✅ **Variante de overlay**: LoadingOverlay para bloquear pantalla completa
- ✅ **Variante de página**: LoadingPage para páginas de carga
- ✅ **Personalizable**: Colores y estilos personalizables con className
- ✅ **Totalmente accesible**: Incluye aria-label y role="status"
- ✅ **TypeScript**: Tipado completo con IntelliSense
- ✅ **Ligero**: Sin dependencias externas

## Componentes Disponibles

### 1. Loading (Spinner básico)
Spinner simple para usar en cualquier contexto.

### 2. LoadingOverlay
Overlay que cubre toda la pantalla para bloquear la interacción.

### 3. LoadingPage
Página completa de carga con diseño centrado.

## Uso Básico

```tsx
import { Loading, LoadingOverlay, LoadingPage } from '@/components/ui/Loading'

// Spinner simple
<Loading />

// Con tamaño específico
<Loading size="lg" />

// Overlay de carga
<LoadingOverlay text="Procesando..." />

// Página de carga
<LoadingPage />
```

## Props

### Loading Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamaño del spinner |
| `className` | `string` | `undefined` | Clases CSS adicionales |

### LoadingOverlay Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'lg'` | Tamaño del spinner |
| `text` | `string` | `'Cargando...'` | Texto a mostrar debajo del spinner |
| `transparent` | `boolean` | `false` | Si el overlay es transparente con blur |

## Tamaños

### Small (sm)
Para espacios reducidos o indicadores inline.
```tsx
<Loading size="sm" />
// 16px × 16px
```

### Medium (md)
Tamaño estándar, uso general.
```tsx
<Loading size="md" />
// 32px × 32px
```

### Large (lg)
Para mayor visibilidad en overlays y páginas.
```tsx
<Loading size="lg" />
// 48px × 48px
```

## Casos de Uso

### 1. Cargando Lista de Productos

```tsx
function ProductList() {
  const { data, isLoading } = useQuery('products', fetchProducts)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loading size="lg" />
          <p className="mt-4 text-gray-600">Cargando productos...</p>
        </div>
      </div>
    )
  }

  return <div>{/* Renderizar productos */}</div>
}
```

### 2. Botón con Estado de Carga

```tsx
function SaveButton() {
  const [isSaving, setIsSaving] = useState(false)

  return (
    <Button loading={isSaving} onClick={handleSave}>
      Guardar
    </Button>
  )
}
```

### 3. Indicador Inline

```tsx
<div className="flex items-center gap-3">
  <Loading size="sm" />
  <span className="text-gray-600">Sincronizando datos...</span>
</div>
```

### 4. Overlay Durante Proceso Crítico

```tsx
function CheckoutPage() {
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePayment = async () => {
    setIsProcessing(true)
    try {
      await processPayment()
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      {/* Contenido de la página */}
      
      {isProcessing && (
        <LoadingOverlay 
          text="Procesando pago..."
          transparent={true}
        />
      )}
    </>
  )
}
```

### 5. Overlay con Fondo Sólido

```tsx
// Para procesos que requieren atención completa
<LoadingOverlay 
  text="Guardando cambios..."
  transparent={false}
/>
```

### 6. Overlay Transparente con Blur

```tsx
// Para mantener contexto visual mientras se bloquea interacción
<LoadingOverlay 
  text="Subiendo archivo..."
  transparent={true}
/>
```

### 7. Página de Carga Completa

```tsx
// En loading.tsx de Next.js
export default function Loading() {
  return <LoadingPage />
}
```

### 8. Cargando Detalles de Producto

```tsx
function ProductDetail({ productId }: { productId: string }) {
  const { data, isLoading } = useQuery(['product', productId], () => 
    fetchProduct(productId)
  )

  if (isLoading) {
    return (
      <div className="border rounded-lg p-6">
        <div className="flex items-center gap-3">
          <Loading size="sm" />
          <span className="text-sm text-gray-600">
            Cargando información del producto...
          </span>
        </div>
      </div>
    )
  }

  return <div>{/* Renderizar producto */}</div>
}
```

### 9. Subiendo Archivo

```tsx
function FileUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  return (
    <div className="border rounded-lg p-6">
      {uploading && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Loading size="sm" />
            <div>
              <p className="text-sm font-medium">imagen-producto.jpg</p>
              <p className="text-xs text-gray-600">Subiendo... {progress}%</p>
            </div>
          </div>
          <button 
            onClick={() => setUploading(false)}
            className="text-sm text-red-600"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}
```

### 10. Sincronizando Datos

```tsx
function SyncStatus({ isSyncing }: { isSyncing: boolean }) {
  if (!isSyncing) return null

  return (
    <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
      <div className="flex items-center gap-3">
        <Loading size="sm" className="text-blue-600" />
        <div>
          <p className="text-sm font-medium text-blue-900">
            Sincronizando con el servidor
          </p>
          <p className="text-xs text-blue-700">
            Última actualización: hace 2 segundos
          </p>
        </div>
      </div>
    </div>
  )
}
```

## Personalización de Color

Puedes cambiar el color del spinner usando la prop `className`:

```tsx
// Primary (default)
<Loading className="text-primary-600" />

// Success
<Loading className="text-green-600" />

// Info
<Loading className="text-blue-600" />

// Gray
<Loading className="text-gray-600" />

// White (para fondos oscuros)
<Loading className="text-white" />
```

## Accesibilidad

El componente Loading está diseñado siguiendo las mejores prácticas de accesibilidad:

- ✅ Incluye `aria-label="Cargando"` para lectores de pantalla
- ✅ LoadingOverlay usa `role="status"` y `aria-live="polite"`
- ✅ El texto descriptivo es legible por lectores de pantalla
- ✅ La animación respeta `prefers-reduced-motion`

## Performance

- ✅ Animación CSS pura (no JavaScript)
- ✅ GPU-accelerated con `transform`
- ✅ Sin dependencias externas
- ✅ Bundle size mínimo

## Integración con React Query

```tsx
function DataComponent() {
  const { data, isLoading, isFetching } = useQuery('data', fetchData)

  return (
    <div>
      {/* Indicador de carga inicial */}
      {isLoading && <Loading size="lg" />}
      
      {/* Indicador de refetch en background */}
      {isFetching && !isLoading && (
        <div className="flex items-center gap-2">
          <Loading size="sm" />
          <span className="text-xs text-gray-500">Actualizando...</span>
        </div>
      )}
      
      {/* Contenido */}
      {data && <div>{/* Renderizar data */}</div>}
    </div>
  )
}
```

## Integración con Next.js

### Loading UI (Suspense Boundary)

```tsx
// app/products/loading.tsx
import { LoadingPage } from '@/components/ui/Loading'

export default function Loading() {
  return <LoadingPage />
}
```

### Streaming con Suspense

```tsx
import { Suspense } from 'react'
import { Loading } from '@/components/ui/Loading'

export default function Page() {
  return (
    <div>
      <h1>Productos</h1>
      <Suspense fallback={<Loading size="lg" />}>
        <ProductList />
      </Suspense>
    </div>
  )
}
```

## Mejores Prácticas

### ✅ DO

- Usa `LoadingOverlay` para procesos críticos que requieren atención completa
- Usa `transparent={true}` cuando quieras mantener contexto visual
- Incluye texto descriptivo para claridad
- Usa tamaños apropiados según el contexto
- Combina con mensajes de estado para mejor UX

### ❌ DON'T

- No uses overlay para cargas rápidas (<500ms)
- No uses spinners grandes en espacios pequeños
- No olvides manejar estados de error
- No bloquees la UI innecesariamente
- No uses múltiples overlays simultáneamente

## Requisitos Relacionados

Este componente cumple con el **Requisito 3.1** del documento de requisitos:
- Estados de carga visuales
- Feedback inmediato al usuario
- Indicadores de progreso para operaciones largas

## Ver También

- [Button Component](./Button.README.md) - Incluye estado de loading integrado
- [Card Component](./Card.README.md) - Puede contener estados de carga
- [Modal Component](./Modal.README.md) - Puede mostrar loading durante operaciones
