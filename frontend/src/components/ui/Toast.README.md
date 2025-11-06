# Toast - Sistema de Notificaciones

Sistema de notificaciones tipo toast para mostrar mensajes temporales al usuario.

## Características

- ✅ 4 tipos de notificaciones: success, error, warning, info
- ✅ Auto-close con barra de progreso visual
- ✅ Animaciones suaves de entrada/salida
- ✅ Máximo 3 notificaciones visibles simultáneamente
- ✅ Acción opcional (botón) en cada notificación
- ✅ Posicionamiento en esquina superior derecha
- ✅ Responsive y accesible

## Uso Básico

### 1. El ToastContainer ya está integrado

El componente `ToastContainer` ya está agregado en `app/providers.tsx`, por lo que no necesitas importarlo en cada página.

### 2. Usar el hook useToast

```tsx
import { useToast } from '@/hooks/useToast'

function MyComponent() {
  const toast = useToast()
  
  const handleSuccess = () => {
    toast.success('¡Operación exitosa!')
  }
  
  const handleError = () => {
    toast.error('Ocurrió un error')
  }
  
  return (
    <div>
      <button onClick={handleSuccess}>Mostrar éxito</button>
      <button onClick={handleError}>Mostrar error</button>
    </div>
  )
}
```

## API del Hook

### Métodos Simples

```tsx
const toast = useToast()

// Notificación de éxito
toast.success('Mensaje de éxito')
toast.success('Mensaje', 'Título personalizado')
toast.success('Mensaje', 'Título', 3000) // Duración en ms

// Notificación de error
toast.error('Mensaje de error')
toast.error('Mensaje', 'Título personalizado')
toast.error('Mensaje', 'Título', 7000) // Errores duran más por defecto

// Notificación de advertencia
toast.warning('Mensaje de advertencia')

// Notificación informativa
toast.info('Mensaje informativo')
```

### Notificación Personalizada

```tsx
toast.show({
  type: 'success',
  title: 'Título',
  message: 'Mensaje',
  duration: 5000, // 0 = no auto-close
  action: {
    label: 'Ver detalles',
    onClick: () => {
      console.log('Acción ejecutada')
    }
  }
})
```

### Cerrar Notificaciones

```tsx
// Cerrar una notificación específica
const id = toast.success('Mensaje')
toast.dismiss(id)

// Cerrar todas las notificaciones
toast.dismissAll()
```

## Ejemplos de Uso

### Agregar al Carrito

```tsx
function ProductCard({ product }) {
  const toast = useToast()
  const { addToCart } = useCartStore()
  
  const handleAddToCart = () => {
    addToCart(product)
    toast.success(
      `${product.name} agregado al carrito`,
      'Producto agregado',
      3000
    )
  }
  
  return (
    <button onClick={handleAddToCart}>
      Agregar al carrito
    </button>
  )
}
```

### Error de Autenticación

```tsx
function LoginForm() {
  const toast = useToast()
  const { login } = useAuth()
  
  const handleSubmit = async (data) => {
    try {
      await login(data)
      toast.success('Sesión iniciada correctamente')
    } catch (error) {
      toast.error(
        'Email o contraseña incorrectos',
        'Error de autenticación',
        7000
      )
    }
  }
  
  return <form onSubmit={handleSubmit}>...</form>
}
```

### Notificación con Acción

```tsx
function OrderConfirmation({ orderId }) {
  const toast = useToast()
  const router = useRouter()
  
  useEffect(() => {
    toast.success({
      title: '¡Pedido confirmado!',
      message: `Tu pedido #${orderId} ha sido procesado`,
      duration: 10000,
      action: {
        label: 'Ver detalles',
        onClick: () => {
          router.push(`/dashboard/pedidos/${orderId}`)
        }
      }
    })
  }, [orderId])
  
  return <div>...</div>
}
```

### Advertencia de Stock

```tsx
function ProductDetail({ product }) {
  const toast = useToast()
  
  useEffect(() => {
    if (product.stockQuantity < 5) {
      toast.warning(
        `Solo quedan ${product.stockQuantity} unidades disponibles`,
        'Stock limitado'
      )
    }
  }, [product.stockQuantity])
  
  return <div>...</div>
}
```

### Información de Actualización

```tsx
function AppUpdater() {
  const toast = useToast()
  
  useEffect(() => {
    // Detectar nueva versión disponible
    if (newVersionAvailable) {
      toast.info({
        title: 'Nueva versión disponible',
        message: 'Recarga la página para actualizar',
        duration: 0, // No auto-close
        action: {
          label: 'Recargar',
          onClick: () => {
            window.location.reload()
          }
        }
      })
    }
  }, [newVersionAvailable])
  
  return null
}
```

## Tipos de Notificaciones

### Success (Verde)
- ✅ Operación completada exitosamente
- ✅ Producto agregado al carrito
- ✅ Pedido confirmado
- ✅ Perfil actualizado

### Error (Rojo)
- ❌ Error de autenticación
- ❌ Error de pago
- ❌ Error de red
- ❌ Validación fallida

### Warning (Amarillo)
- ⚠️ Stock limitado
- ⚠️ Sesión por expirar
- ⚠️ Cambios no guardados
- ⚠️ Acción irreversible

### Info (Azul)
- ℹ️ Nueva actualización disponible
- ℹ️ Mantenimiento programado
- ℹ️ Cambios en términos de servicio
- ℹ️ Consejos y sugerencias

## Configuración

### Duración por Defecto

```typescript
// En notification.store.ts
const duration = notification.duration ?? 5000 // 5 segundos por defecto

// Errores duran más
error: (message, title, duration) => {
  return get().addNotification({
    type: 'error',
    title: title || 'Error',
    message,
    duration: duration ?? 7000, // 7 segundos para errores
  })
}
```

### Máximo de Notificaciones

```typescript
// En notification.store.ts
maxNotifications: 3 // Máximo 3 notificaciones visibles
```

### Posicionamiento

Por defecto, las notificaciones aparecen en la esquina superior derecha. Para cambiar la posición, modifica la clase en `ToastContainer`:

```tsx
// Esquina superior derecha (actual)
className="fixed top-4 right-4 z-50"

// Esquina superior izquierda
className="fixed top-4 left-4 z-50"

// Esquina inferior derecha
className="fixed bottom-4 right-4 z-50"

// Esquina inferior izquierda
className="fixed bottom-4 left-4 z-50"
```

## Accesibilidad

- ✅ `role="alert"` para notificaciones
- ✅ `aria-live="polite"` para actualizaciones no intrusivas
- ✅ `aria-label` en botón de cerrar
- ✅ Colores con contraste adecuado (WCAG 2.1 AA)
- ✅ Iconos descriptivos por tipo

## Animaciones

Las notificaciones tienen animaciones suaves:

- **Entrada**: Slide-in desde la derecha con fade-in
- **Salida**: Slide-out hacia la derecha con fade-out
- **Barra de progreso**: Transición lineal de 100% a 0%

## Integración con React Query

```tsx
import { useMutation } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'

function useUpdateProfile() {
  const toast = useToast()
  
  return useMutation({
    mutationFn: updateProfileApi,
    onSuccess: () => {
      toast.success('Perfil actualizado correctamente')
    },
    onError: (error) => {
      toast.error(
        error.message || 'Error al actualizar el perfil',
        'Error'
      )
    }
  })
}
```

## Mejores Prácticas

1. **Mensajes claros y concisos**: Usa mensajes cortos y descriptivos
2. **Títulos opcionales**: Usa títulos solo cuando agreguen contexto
3. **Duración apropiada**: Errores más largos, éxitos más cortos
4. **Acciones relevantes**: Solo agrega acciones cuando sean útiles
5. **No abusar**: No muestres notificaciones para cada acción menor
6. **Contexto**: Proporciona suficiente información para que el usuario entienda

## Troubleshooting

### Las notificaciones no aparecen

1. Verifica que `ToastContainer` esté en `providers.tsx`
2. Verifica que estés usando el hook `useToast` correctamente
3. Revisa la consola por errores

### Las notificaciones se apilan demasiado

El sistema limita automáticamente a 3 notificaciones visibles. Si necesitas cambiar esto:

```typescript
// En notification.store.ts
maxNotifications: 5 // Cambiar a 5
```

### Las animaciones no funcionan

Verifica que Tailwind CSS esté configurado correctamente y que las clases de transición estén disponibles.
