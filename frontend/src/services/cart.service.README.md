# Cart Service - Servicio de Carrito de Compras

## Descripción

El `CartService` proporciona una capa de abstracción para gestionar el carrito de compras, con soporte para:

- **Persistencia dual**: Backend (usuarios autenticados) + localStorage (fallback)
- **Sincronización automática**: Los cambios se sincronizan entre backend y localStorage
- **Optimistic updates**: Actualizaciones instantáneas en la UI con React Query
- **Gestión de errores**: Fallback automático a localStorage si el backend falla

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    React Components                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ useCart, useAddToCart, etc.
                     │
┌────────────────────▼────────────────────────────────────┐
│              React Query Hooks (useCart.ts)             │
│  - Caché inteligente                                    │
│  - Optimistic updates                                   │
│  - Sincronización automática                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ cartService methods
                     │
┌────────────────────▼────────────────────────────────────┐
│            CartService (cart.service.ts)                │
│  - Lógica de negocio                                    │
│  - Gestión de persistencia                              │
│  - Fallback automático                                  │
└─────────┬──────────────────────────────┬────────────────┘
          │                              │
          │ API calls                    │ localStorage
          │                              │
┌─────────▼──────────┐        ┌──────────▼─────────────┐
│   Backend API      │        │   localStorage         │
│   /api/cart        │        │   technovastore_cart   │
└────────────────────┘        └────────────────────────┘
```

## Uso Básico

### 1. Obtener el carrito actual

```typescript
import { useCart } from '@/hooks/useCart';

function CartComponent() {
  const { data: cart, isLoading, error } = useCart();

  if (isLoading) return <div>Cargando carrito...</div>;
  if (error) return <div>Error al cargar el carrito</div>;

  return (
    <div>
      <h2>Carrito ({cart.itemCount} productos)</h2>
      <p>Total: ${cart.total.toFixed(2)}</p>
      {cart.items.map(item => (
        <div key={item.id}>
          {item.name} - Cantidad: {item.quantity}
        </div>
      ))}
    </div>
  );
}
```

### 2. Agregar productos al carrito

```typescript
import { useAddToCart } from '@/hooks/useCart';

function ProductCard({ product }) {
  const addToCart = useAddToCart();

  const handleAddToCart = () => {
    addToCart.mutate({
      productId: product.id,
      quantity: 1,
    });
  };

  return (
    <div>
      <h3>{product.name}</h3>
      <button 
        onClick={handleAddToCart}
        disabled={addToCart.isPending}
      >
        {addToCart.isPending ? 'Agregando...' : 'Agregar al carrito'}
      </button>
    </div>
  );
}
```

### 3. Actualizar cantidad de un producto

```typescript
import { useUpdateCartItem } from '@/hooks/useCart';

function CartItem({ item }) {
  const updateItem = useUpdateCartItem();

  const handleQuantityChange = (newQuantity: number) => {
    updateItem.mutate({
      productId: item.productId,
      quantity: newQuantity,
    });
  };

  return (
    <div>
      <span>{item.name}</span>
      <button onClick={() => handleQuantityChange(item.quantity - 1)}>-</button>
      <span>{item.quantity}</span>
      <button onClick={() => handleQuantityChange(item.quantity + 1)}>+</button>
    </div>
  );
}
```

### 4. Eliminar un producto del carrito

```typescript
import { useRemoveCartItem } from '@/hooks/useCart';

function CartItem({ item }) {
  const removeItem = useRemoveCartItem();

  const handleRemove = () => {
    removeItem.mutate(item.productId);
  };

  return (
    <div>
      <span>{item.name}</span>
      <button onClick={handleRemove}>Eliminar</button>
    </div>
  );
}
```

### 5. Limpiar todo el carrito

```typescript
import { useClearCart } from '@/hooks/useCart';

function CartActions() {
  const clearCart = useClearCart();

  const handleClearCart = () => {
    if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      clearCart.mutate();
    }
  };

  return (
    <button onClick={handleClearCart}>
      Limpiar carrito
    </button>
  );
}
```

### 6. Hooks auxiliares

```typescript
import { useCartItemQuantity, useIsInCart } from '@/hooks/useCart';

function ProductCard({ product }) {
  const quantity = useCartItemQuantity(product.id);
  const isInCart = useIsInCart(product.id);

  return (
    <div>
      <h3>{product.name}</h3>
      {isInCart ? (
        <p>En el carrito: {quantity} unidades</p>
      ) : (
        <p>No está en el carrito</p>
      )}
    </div>
  );
}
```

## Tipos

### Cart

```typescript
interface Cart {
  id: string;
  userId?: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  taxes: number;
  discount: number;
  total: number;
  itemCount: number;
  updatedAt: Date;
}
```

### CartItem

```typescript
interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  sku: string;
  brand?: string;
  maxQuantity?: number;
  inStock: boolean;
  addedAt: Date;
}
```

### AddToCartRequest

```typescript
interface AddToCartRequest {
  productId: string;
  quantity: number;
}
```

### UpdateCartItemRequest

```typescript
interface UpdateCartItemRequest {
  productId: string;
  quantity: number;
}
```

## Características Avanzadas

### Optimistic Updates

Los hooks de React Query implementan **optimistic updates**, lo que significa que la UI se actualiza inmediatamente antes de que el servidor responda:

1. El usuario hace clic en "Agregar al carrito"
2. La UI se actualiza instantáneamente (optimistic)
3. Se envía la petición al backend
4. Si el backend responde con éxito, se confirma el cambio
5. Si el backend falla, se revierte el cambio y se muestra un error

### Persistencia Dual

El servicio implementa una estrategia de **persistencia dual**:

- **Backend**: Para usuarios autenticados, el carrito se guarda en el servidor
- **localStorage**: Fallback para usuarios no autenticados o cuando el backend no está disponible
- **Sincronización**: Los cambios se sincronizan automáticamente entre ambos

### Gestión de Errores

El servicio maneja errores de forma robusta:

```typescript
// Si el backend falla, automáticamente usa localStorage
try {
  const response = await axiosInstance.post('/api/cart/items', request);
  return response.data.data;
} catch (error) {
  console.warn('Backend no disponible, usando localStorage');
  return this.addItemToLocalStorage(request);
}
```

### Caché Inteligente

React Query gestiona el caché automáticamente:

- **staleTime**: 5 minutos - Los datos se consideran frescos durante 5 minutos
- **gcTime**: 30 minutos - Los datos se mantienen en caché durante 30 minutos
- **Invalidación automática**: Después de cada mutación, el caché se actualiza

## Endpoints del Backend

El servicio espera los siguientes endpoints en el backend:

### GET /api/cart
Obtener el carrito del usuario autenticado

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cart-123",
    "userId": "user-456",
    "items": [...],
    "subtotal": 99.99,
    "shipping": 5.00,
    "taxes": 21.00,
    "discount": 0,
    "total": 125.99,
    "itemCount": 3,
    "updatedAt": "2025-11-05T10:30:00Z"
  }
}
```

### POST /api/cart/items
Agregar un item al carrito

**Request:**
```json
{
  "productId": "prod-123",
  "quantity": 2
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* Cart actualizado */ }
}
```

### PUT /api/cart/items/:productId
Actualizar la cantidad de un item

**Request:**
```json
{
  "quantity": 3
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* Cart actualizado */ }
}
```

### DELETE /api/cart/items/:productId
Eliminar un item del carrito

**Response:**
```json
{
  "success": true,
  "data": { /* Cart actualizado */ }
}
```

### DELETE /api/cart
Limpiar todo el carrito

**Response:**
```json
{
  "success": true,
  "data": { /* Cart vacío */ }
}
```

## Migración desde CartContext

Si estás migrando desde el antiguo `CartContext`, aquí está la equivalencia:

| CartContext | Nuevo Sistema |
|-------------|---------------|
| `useCart()` | `useCart()` |
| `addItem(product, quantity)` | `useAddToCart().mutate({ productId, quantity })` |
| `removeItem(productId)` | `useRemoveCartItem().mutate(productId)` |
| `updateQuantity(productId, quantity)` | `useUpdateCartItem().mutate({ productId, quantity })` |
| `clearCart()` | `useClearCart().mutate()` |
| `getItemQuantity(productId)` | `useCartItemQuantity(productId)` |

## Notas Importantes

### localStorage

- **Clave**: `technovastore_cart`
- **Formato**: JSON serializado del objeto `Cart`
- **Sincronización**: Automática después de cada operación

### Cálculo de Totales

El servicio calcula automáticamente:

- **Subtotal**: Suma de (precio × cantidad) de todos los items
- **Envío**: Gratis si subtotal >= $50, sino $5
- **Impuestos**: 21% del subtotal (IVA España)
- **Total**: Subtotal + Envío + Impuestos - Descuento

> **Nota**: En producción, estos cálculos deberían venir del backend para evitar manipulación.

### Límites de Cantidad

- **Máximo por producto**: 99 unidades (o `maxQuantity` si está definido)
- **Mínimo**: 1 unidad (cantidad 0 elimina el item)

## Testing

Ejemplo de test con React Testing Library:

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCart, useAddToCart } from '@/hooks/useCart';

describe('useCart', () => {
  it('should add item to cart', async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useAddToCart(), { wrapper });

    result.current.mutate({
      productId: 'prod-123',
      quantity: 1,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
```

## Troubleshooting

### El carrito no se sincroniza entre pestañas

El servicio usa localStorage, que no se sincroniza automáticamente entre pestañas. Para implementar sincronización, usa el evento `storage`:

```typescript
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'technovastore_cart') {
      queryClient.invalidateQueries({ queryKey: cartKeys.detail() });
    }
  };

  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);
```

### Los totales no coinciden con el backend

Los cálculos de envío e impuestos son simplificados en el frontend. En producción, estos valores deben venir del backend para garantizar precisión.

### El carrito se pierde al cerrar sesión

Esto es el comportamiento esperado. Al cerrar sesión, el carrito del backend se limpia. Si quieres mantener el carrito, implementa una migración del carrito de localStorage al backend al iniciar sesión.

## Próximas Mejoras

- [ ] Sincronización entre pestañas con `BroadcastChannel`
- [ ] Migración automática de carrito al iniciar sesión
- [ ] Validación de stock en tiempo real
- [ ] Aplicación de cupones de descuento
- [ ] Estimación de envío por ubicación
- [ ] Guardado de carritos abandonados
- [ ] Notificaciones de cambios de precio
