# Store

Esta carpeta contiene el estado global de la aplicación usando Zustand.

## Estructura

- ✅ `auth.store.ts` - Estado de autenticación (usuario actual, tokens)
- ✅ `cart.store.ts` - Estado del carrito de compras
- ✅ `theme.store.ts` - Estado del tema (claro/oscuro)
- ✅ `notification.store.ts` - Estado de notificaciones
- ✅ `chat.store.ts` - Estado del chat widget
- ✅ `index.ts` - Exportaciones centralizadas

## Stores Implementados

### 1. Auth Store (`useAuthStore`)

Maneja el estado de autenticación del usuario.

**Estado**:
- `user`: Usuario actual
- `isAuthenticated`: Estado de autenticación
- `isLoading`: Cargando

**Acciones**:
- `setUser(user)`: Establecer usuario
- `setLoading(isLoading)`: Establecer estado de carga
- `logout()`: Cerrar sesión
- `reset()`: Resetear estado

**Persistencia**: Sí (localStorage)

### 2. Cart Store (`useCartStore`)

Maneja el estado del carrito de compras.

**Estado**:
- `items`: Items del carrito

**Acciones**:
- `addItem(item, quantity)`: Agregar item
- `removeItem(productId)`: Remover item
- `updateQuantity(productId, quantity)`: Actualizar cantidad
- `clearCart()`: Limpiar carrito

**Getters**:
- `getTotalItems()`: Total de items
- `getTotalPrice()`: Precio total
- `getItem(productId)`: Obtener item específico

**Persistencia**: Sí (localStorage)

### 3. Theme Store (`useThemeStore`)

Maneja el estado del tema (claro/oscuro).

**Estado**:
- `theme`: 'light' | 'dark' | 'system'
- `resolvedTheme`: 'light' | 'dark'

**Acciones**:
- `setTheme(theme)`: Establecer tema
- `toggleTheme()`: Alternar tema

**Persistencia**: Sí (localStorage)

### 4. Notification Store (`useNotificationStore`)

Maneja el estado de notificaciones tipo toast.

**Estado**:
- `notifications`: Lista de notificaciones activas
- `maxNotifications`: Máximo de notificaciones (3)

**Acciones**:
- `addNotification(notification)`: Agregar notificación
- `removeNotification(id)`: Remover notificación
- `clearAll()`: Limpiar todas

**Helpers**:
- `success(message, title?, duration?)`: Notificación de éxito
- `error(message, title?, duration?)`: Notificación de error
- `warning(message, title?, duration?)`: Notificación de advertencia
- `info(message, title?, duration?)`: Notificación de información

**Persistencia**: No

### 5. Chat Store (`useChatStore`)

Maneja el estado del chat widget.

**Estado**:
- `isOpen`: Chat abierto/cerrado
- `isMinimized`: Chat minimizado
- `messages`: Mensajes del chat
- `isTyping`: Bot escribiendo
- `usingFallback`: Usando modo fallback
- `connectionStatus`: Estado de conexión
- `sessionId`: ID de sesión
- `unreadCount`: Mensajes no leídos

**Acciones**:
- `setOpen(isOpen)`: Abrir/cerrar chat
- `setMinimized(isMinimized)`: Minimizar/maximizar
- `toggleOpen()`: Alternar estado
- `addMessage(message)`: Agregar mensaje
- `updateMessage(id, updates)`: Actualizar mensaje
- `setTyping(isTyping)`: Establecer estado de escritura
- `setFallback(usingFallback)`: Establecer modo fallback
- `setConnectionStatus(status)`: Establecer estado de conexión
- `setSessionId(sessionId)`: Establecer ID de sesión
- `clearMessages()`: Limpiar mensajes
- `incrementUnread()`: Incrementar no leídos
- `resetUnread()`: Resetear no leídos

**Persistencia**: No

## Patrón de Diseño

Cada store de Zustand sigue este patrón:

```typescript
interface StoreState {
  // Estado
  data: any;
  
  // Acciones
  setData: (data: any) => void;
  reset: () => void;
}

export const useStore = create<StoreState>((set) => ({
  data: null,
  setData: (data) => set({ data }),
  reset: () => set({ data: null }),
}));
```

## Uso

```typescript
import { useAuthStore, useCartStore, useThemeStore } from '@/store';

// En un componente
const { user, isAuthenticated } = useAuthStore();
const { items, addItem } = useCartStore();
const { theme, setTheme } = useThemeStore();
```

## Persistencia

Los stores con persistencia utilizan `persist` middleware de Zustand para mantener el estado en localStorage:

- ✅ Auth Store
- ✅ Cart Store
- ✅ Theme Store
- ❌ Notification Store
- ❌ Chat Store
