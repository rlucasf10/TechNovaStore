# CartItem Component

Componente para mostrar un item individual del carrito de compras con todas las funcionalidades necesarias para gestionar la cantidad y eliminar productos.

## Características

✅ **Imagen del producto** (100x100px)
- Muestra la imagen del producto con aspect ratio 1:1
- Placeholder visual si no hay imagen disponible
- Badge de "Sin Stock" si el producto no está disponible

✅ **Información del producto**
- Nombre con link al detalle del producto
- SKU y marca mostrados claramente
- Precio unitario visible

✅ **Selector de cantidad**
- Botones - y + para incrementar/decrementar
- Input editable para cambiar cantidad directamente
- Validación de cantidad mínima (1) y máxima (según disponibilidad)
- Indicador visual de límite de cantidad
- Estado de "Actualizando..." durante cambios

✅ **Cálculo de subtotal**
- Subtotal calculado dinámicamente (precio × cantidad)
- Animación al cambiar el subtotal

✅ **Botón eliminar**
- Icono de papelera
- Estado de loading durante eliminación
- Confirmación visual

✅ **Animaciones**
- Entrada suave al agregar al carrito
- Salida animada al eliminar
- Transiciones suaves en cambios de cantidad
- Layout animations con Framer Motion

✅ **Diseño responsive**
- Layout vertical en móvil
- Layout horizontal en desktop
- Adaptación de tamaños y espaciados

✅ **Accesibilidad**
- Labels ARIA apropiados
- Navegación por teclado
- Estados disabled claros
- Textos alternativos para iconos

## Uso

```tsx
import { CartItem } from '@/components/cart'
import { CartItemNew } from '@/types'

function MyCart() {
  const [items, setItems] = useState<CartItemNew[]>([...])
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set())

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    // Actualizar cantidad en el backend o estado
    await cartService.updateQuantity({ productId, quantity })
    
    // Actualizar estado local
    setItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      )
    )
  }

  const handleRemove = async (productId: string) => {
    // Marcar como eliminando
    setRemovingItems(prev => new Set(prev).add(productId))
    
    // Eliminar del backend
    await cartService.removeItem(productId)
    
    // Actualizar estado local
    setItems(prevItems => prevItems.filter(item => item.productId !== productId))
    
    // Limpiar estado de eliminando
    setRemovingItems(prev => {
      const newSet = new Set(prev)
      newSet.delete(productId)
      return newSet
    })
  }

  return (
    <div className="space-y-4">
      {items.map(item => (
        <CartItem
          key={item.id}
          item={item}
          onUpdateQuantity={handleUpdateQuantity}
          onRemove={handleRemove}
          isRemoving={removingItems.has(item.productId)}
        />
      ))}
    </div>
  )
}
```

## Props

### `item: CartItemNew` (requerido)

Objeto con la información del item del carrito:

```typescript
interface CartItemNew {
  id: string              // ID único del item en el carrito
  productId: string       // ID del producto
  name: string           // Nombre del producto
  price: number          // Precio unitario
  quantity: number       // Cantidad en el carrito
  image: string          // URL de la imagen (puede estar vacío)
  sku: string            // SKU del producto
  brand?: string         // Marca del producto (opcional)
  maxQuantity?: number   // Cantidad máxima disponible (opcional, default: 99)
  inStock: boolean       // Si el producto está en stock
  addedAt: Date          // Fecha de agregado al carrito
}
```

### `onUpdateQuantity: (productId: string, quantity: number) => void` (requerido)

Callback que se ejecuta cuando el usuario cambia la cantidad del producto.

**Parámetros:**
- `productId`: ID del producto a actualizar
- `quantity`: Nueva cantidad

**Ejemplo:**
```typescript
const handleUpdateQuantity = async (productId: string, quantity: number) => {
  await cartService.updateQuantity({ productId, quantity })
  // Actualizar estado local
}
```

### `onRemove: (productId: string) => void` (requerido)

Callback que se ejecuta cuando el usuario elimina el producto del carrito.

**Parámetros:**
- `productId`: ID del producto a eliminar

**Ejemplo:**
```typescript
const handleRemove = async (productId: string) => {
  await cartService.removeItem(productId)
  // Actualizar estado local
}
```

### `isRemoving?: boolean` (opcional)

Indica si el item está siendo eliminado actualmente. Muestra un spinner en el botón de eliminar y reduce la opacidad del item.

**Default:** `false`

## Estados Visuales

### Normal
- Fondo blanco
- Todos los controles habilitados
- Imagen visible

### Sin Stock
- Fondo gris claro
- Badge "Sin Stock" sobre la imagen
- Controles de cantidad deshabilitados
- Botón eliminar habilitado

### Actualizando Cantidad
- Texto "Actualizando..." debajo del selector
- Controles de cantidad deshabilitados temporalmente

### Eliminando
- Opacidad reducida (50%)
- Spinner en el botón eliminar
- Todos los controles deshabilitados

### Límite de Cantidad
- Botón + deshabilitado cuando se alcanza maxQuantity
- Texto "Máx: X" debajo del selector

## Animaciones

### Entrada (al agregar al carrito)
```typescript
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3 }}
```

### Salida (al eliminar)
```typescript
exit={{ opacity: 0, x: -100, height: 0 }}
transition={{ duration: 0.3 }}
```

### Cambio de subtotal
```typescript
initial={{ scale: 1.1 }}
animate={{ scale: 1 }}
```

### Layout (al cambiar cantidad)
```typescript
layout
transition={{ duration: 0.3 }}
```

## Responsive Design

### Móvil (< 640px)
- Layout vertical (flex-col)
- Imagen y info en una fila
- Controles (cantidad, subtotal, eliminar) en otra fila
- Ancho completo

### Desktop (≥ 640px)
- Layout horizontal (flex-row)
- Todos los elementos en una sola fila
- Espaciado optimizado

## Validación de Cantidad

El componente valida automáticamente:

1. **Mínimo:** No permite cantidades menores a 1
2. **Máximo:** No permite exceder `maxQuantity` (default: 99)
3. **Números:** Solo acepta valores numéricos enteros
4. **Campo vacío:** Si el usuario borra el input, se restaura a 1 al hacer blur

## Integración con CartService

El componente está diseñado para trabajar con el `CartService`:

```typescript
import { cartService } from '@/services/cart.service'

// Actualizar cantidad
await cartService.updateQuantity({
  productId: item.productId,
  quantity: newQuantity
})

// Eliminar item
await cartService.removeItem(item.productId)
```

## Accesibilidad

- ✅ Labels ARIA en todos los controles
- ✅ Navegación por teclado completa
- ✅ Estados disabled claros
- ✅ Textos alternativos para iconos (aria-hidden="true")
- ✅ Contraste de colores adecuado
- ✅ Tamaños de botones táctiles (44x44px mínimo)

## Testing

Página de prueba disponible en: `/test-cart-item`

### Casos de prueba

1. ✅ Cambiar cantidad con botones + y -
2. ✅ Editar cantidad directamente en el input
3. ✅ Validación de cantidad mínima (1)
4. ✅ Validación de cantidad máxima
5. ✅ Eliminar item con animación
6. ✅ Estado "Sin Stock"
7. ✅ Placeholder de imagen
8. ✅ Link al detalle del producto
9. ✅ Diseño responsive
10. ✅ Cálculo de subtotal

## Requisitos Cumplidos

- ✅ **9.1:** Gestión de items del carrito
- ✅ **9.2:** Modificación de cantidades y eliminación

## Dependencias

- `next/image`: Para optimización de imágenes
- `next/link`: Para navegación
- `framer-motion`: Para animaciones
- `@/components/ui`: Button, Input
- `@/lib/utils`: formatPrice
- `@/types`: CartItemNew

## Notas de Implementación

1. El componente usa `CartItemNew` (del nuevo servicio) en lugar de `CartItem` (legacy)
2. Las animaciones están optimizadas para performance (transform y opacity)
3. El estado local `localQuantity` permite edición fluida sin esperar respuesta del servidor
4. El componente es completamente controlado (no maneja su propio estado de datos)
5. Los callbacks son async para permitir operaciones de red

## Mejoras Futuras

- [ ] Agregar confirmación modal antes de eliminar
- [ ] Agregar opción de "Guardar para después"
- [ ] Mostrar descuentos aplicados
- [ ] Agregar selector de variantes (talla, color)
- [ ] Implementar drag & drop para reordenar items
