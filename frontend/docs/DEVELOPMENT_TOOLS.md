# Herramientas de Desarrollo - Frontend TechNovaStore

Este documento describe las herramientas de desarrollo configuradas en el proyecto y cómo utilizarlas.

## Índice

1. [React Query](#react-query)
2. [Zustand](#zustand)
3. [Socket.IO Client](#socketio-client)
4. [Axios](#axios)
5. [React Hook Form](#react-hook-form)
6. [Zod](#zod)
7. [Framer Motion](#framer-motion)

---

## React Query

**Versión**: 5.8.0  
**Propósito**: Gestión de estado del servidor, caché de datos y sincronización

### Configuración

La configuración se encuentra en `src/lib/react-query.ts`:

```typescript
import { queryClient, queryKeys } from '@/lib/react-query';
```

### Uso Básico

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';

// Query
const { data, isLoading, error } = useQuery({
  queryKey: queryKeys.products.list(),
  queryFn: () => fetchProducts(),
});

// Mutation
const mutation = useMutation({
  mutationFn: (data) => createProduct(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
  },
});
```

### Query Keys Organizados

```typescript
queryKeys.auth.user          // ['auth', 'user']
queryKeys.products.list()    // ['products', 'list']
queryKeys.products.detail(id) // ['products', 'detail', id]
```

### Configuración por Defecto

- **staleTime**: 5 minutos
- **gcTime**: 30 minutos
- **retry**: 1 intento
- **refetchOnWindowFocus**: false

---

## Zustand

**Versión**: 4.5.0  
**Propósito**: Gestión de estado global del cliente

### Stores Disponibles

#### 1. Auth Store (`useAuthStore`)

```typescript
import { useAuthStore } from '@/store';

const { user, isAuthenticated, setUser, logout } = useAuthStore();
```

**Estado**:
- `user`: Usuario actual
- `isAuthenticated`: Estado de autenticación
- `isLoading`: Cargando

**Acciones**:
- `setUser(user)`: Establecer usuario
- `logout()`: Cerrar sesión
- `reset()`: Resetear estado

#### 2. Cart Store (`useCartStore`)

```typescript
import { useCartStore } from '@/store';

const { items, addItem, removeItem, getTotalPrice } = useCartStore();
```

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

#### 3. Theme Store (`useThemeStore`)

```typescript
import { useThemeStore } from '@/store';

const { theme, resolvedTheme, setTheme, toggleTheme } = useThemeStore();
```

**Estado**:
- `theme`: 'light' | 'dark' | 'system'
- `resolvedTheme`: 'light' | 'dark'

**Acciones**:
- `setTheme(theme)`: Establecer tema
- `toggleTheme()`: Alternar tema

#### 4. Notification Store (`useNotificationStore`)

```typescript
import { useNotificationStore } from '@/store';

const { notifications, success, error, warning, info } = useNotificationStore();
```

**Helpers**:
- `success(message, title?, duration?)`: Notificación de éxito
- `error(message, title?, duration?)`: Notificación de error
- `warning(message, title?, duration?)`: Notificación de advertencia
- `info(message, title?, duration?)`: Notificación de información

#### 5. Chat Store (`useChatStore`)

```typescript
import { useChatStore } from '@/store';

const { isOpen, messages, addMessage, setTyping } = useChatStore();
```

**Estado**:
- `isOpen`: Chat abierto/cerrado
- `messages`: Mensajes del chat
- `isTyping`: Bot escribiendo
- `usingFallback`: Usando modo fallback
- `connectionStatus`: Estado de conexión

---

## Socket.IO Client

**Versión**: 4.6.1  
**Propósito**: Comunicación en tiempo real con el chatbot

### Configuración

```typescript
import { getSocket, connectSocket, SocketEvents } from '@/lib/socket';

// Conectar
await connectSocket();

// Obtener instancia
const socket = getSocket();

// Escuchar eventos
socket.on(SocketEvents.CHAT_STREAM_CHUNK, (data) => {
  console.log('Chunk recibido:', data);
});

// Emitir eventos
socket.emit(SocketEvents.CHAT_MESSAGE_STREAM, {
  sessionId: 'xxx',
  message: 'Hola',
});
```

### Eventos Disponibles

**Cliente → Servidor**:
- `CHAT_MESSAGE_STREAM`: Enviar mensaje
- `JOIN_SESSION`: Unirse a sesión
- `LEAVE_SESSION`: Salir de sesión

**Servidor → Cliente**:
- `BOT_TYPING`: Bot está escribiendo
- `CHAT_STREAM_CHUNK`: Chunk de respuesta
- `CHAT_STREAM_END`: Respuesta completa
- `CHAT_STREAM_ERROR`: Error en respuesta

---

## Axios

**Versión**: 1.6.2  
**Propósito**: Cliente HTTP con interceptors

### Configuración

```typescript
import axiosInstance from '@/lib/axios';

// GET
const response = await axiosInstance.get('/products');

// POST
const response = await axiosInstance.post('/auth/login', {
  email: 'user@example.com',
  password: 'password',
});
```

### Características

- **Base URL**: Configurada desde `NEXT_PUBLIC_API_URL`
- **Timeout**: 30 segundos
- **Credentials**: `withCredentials: true` (cookies httpOnly)
- **Refresh Token**: Automático en 401
- **Error Handling**: Interceptor global

### Helpers

```typescript
import { getErrorMessage, isNetworkError } from '@/lib/axios';

try {
  await axiosInstance.get('/api/data');
} catch (error) {
  const message = getErrorMessage(error);
  const isNetwork = isNetworkError(error);
}
```

---

## React Hook Form

**Versión**: 7.49.3  
**Propósito**: Gestión de formularios con validación

### Uso Básico

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/form-schemas';

const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting },
} = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
});

const onSubmit = async (data: LoginFormData) => {
  // Enviar datos
};

// En el JSX
<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register('email')} />
  {errors.email && <span>{errors.email.message}</span>}
</form>
```

### Helpers Disponibles

```typescript
import { getFieldError, hasFieldError, getInputClasses } from '@/lib/form-helpers';

const errorMessage = getFieldError(errors, 'email');
const hasError = hasFieldError(errors, 'email');
const inputClasses = getInputClasses(hasError);
```

---

## Zod

**Versión**: 3.22.4  
**Propósito**: Validación de esquemas y TypeScript types

### Esquemas Disponibles

Todos los esquemas están en `src/lib/form-schemas.ts`:

```typescript
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  addressSchema,
  creditCardSchema,
  productReviewSchema,
} from '@/lib/form-schemas';
```

### Crear Esquema Personalizado

```typescript
import { z } from 'zod';

const mySchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  age: z.number().min(18, 'Debes ser mayor de edad'),
  email: z.string().email('Email inválido'),
});

type MyFormData = z.infer<typeof mySchema>;
```

### Validación de Contraseña

```typescript
import { getPasswordStrength } from '@/lib/form-schemas';

const strength = getPasswordStrength('MyPassword123!');
// {
//   score: 5,
//   label: 'Muy fuerte',
//   color: 'emerald',
//   checks: { length: true, uppercase: true, ... }
// }
```

---

## Framer Motion

**Versión**: 11.0.3  
**Propósito**: Animaciones y transiciones

### Variantes Disponibles

Todas las variantes están en `src/lib/animations.ts`:

```typescript
import {
  fadeVariants,
  slideUpVariants,
  scaleVariants,
  modalVariants,
  toastVariants,
} from '@/lib/animations';
```

### Uso Básico

```typescript
import { motion } from 'framer-motion';
import { fadeVariants } from '@/lib/animations';

<motion.div
  variants={fadeVariants}
  initial="hidden"
  animate="visible"
  exit="exit"
>
  Contenido
</motion.div>
```

### Animaciones Disponibles

- **Fade**: `fadeVariants`
- **Slide**: `slideUpVariants`, `slideDownVariants`, `slideLeftVariants`, `slideRightVariants`
- **Scale**: `scaleVariants`, `scaleBounceVariants`
- **Modal**: `modalVariants`, `backdropVariants`
- **Sidebar**: `sidebarVariants`
- **Dropdown**: `dropdownVariants`
- **Toast**: `toastVariants`
- **List**: `listContainerVariants`, `listItemVariants`
- **Effects**: `shimmerVariants`, `pulseVariants`, `spinVariants`, `bounceVariants`

### Crear Variantes Personalizadas

```typescript
import { createSlideVariants, createScaleVariants } from '@/lib/animations';

const customSlide = createSlideVariants('up', 50);
const customScale = createScaleVariants(0.8, true);
```

---

## Ejemplos Completos

### Formulario con Validación

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/form-schemas';
import { getFieldError } from '@/lib/form-helpers';
import { useNotificationStore } from '@/store';
import axiosInstance from '@/lib/axios';

export default function LoginForm() {
  const { success, error } = useNotificationStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });
  
  const onSubmit = async (data: LoginFormData) => {
    try {
      await axiosInstance.post('/auth/login', data);
      success('Inicio de sesión exitoso');
    } catch (err) {
      error('Error al iniciar sesión');
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {getFieldError(errors, 'email') && (
        <span>{getFieldError(errors, 'email')}</span>
      )}
      
      <button type="submit" disabled={isSubmitting}>
        Iniciar Sesión
      </button>
    </form>
  );
}
```

### Chat con Socket.IO

```typescript
import { useEffect } from 'react';
import { useChatStore } from '@/store';
import { getSocket, connectSocket, SocketEvents } from '@/lib/socket';

export default function ChatWidget() {
  const { messages, addMessage, setTyping } = useChatStore();
  
  useEffect(() => {
    const initSocket = async () => {
      await connectSocket();
      const socket = getSocket();
      
      socket.on(SocketEvents.BOT_TYPING, () => {
        setTyping(true);
      });
      
      socket.on(SocketEvents.CHAT_STREAM_CHUNK, (data) => {
        // Manejar chunk
      });
      
      socket.on(SocketEvents.CHAT_STREAM_END, (data) => {
        setTyping(false);
        addMessage({
          role: 'assistant',
          content: data.fullMessage,
        });
      });
    };
    
    initSocket();
  }, []);
  
  return <div>{/* UI del chat */}</div>;
}
```

---

## Recursos Adicionales

- [React Query Docs](https://tanstack.com/query/latest)
- [Zustand Docs](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Socket.IO Client Docs](https://socket.io/docs/v4/client-api/)
- [Axios Docs](https://axios-http.com/docs/intro)
- [React Hook Form Docs](https://react-hook-form.com/)
- [Zod Docs](https://zod.dev/)
- [Framer Motion Docs](https://www.framer.com/motion/)
