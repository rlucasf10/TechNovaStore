# Services - Servicios de API

Esta carpeta contiene los servicios de API para comunicación con el backend de TechNovaStore.

## Estructura de Servicios

### Servicios Principales

#### `AuthService` - Autenticación y Autorización
Gestiona la autenticación de usuarios y OAuth.

**Métodos:**
- `login(credentials)` - Iniciar sesión con email/password
- `register(data)` - Registrar nuevo usuario
- `logout()` - Cerrar sesión
- `refreshToken()` - Renovar token de autenticación
- `forgotPassword(email)` - Solicitar recuperación de contraseña
- `validateResetToken(token)` - Validar token de recuperación
- `resetPassword(token, newPassword)` - Restablecer contraseña
- `oauthLogin(provider)` - Iniciar flujo OAuth (Google, GitHub)
- `oauthCallback(provider, code)` - Procesar callback de OAuth
- `setPassword(password)` - Establecer contraseña para usuarios OAuth
- `linkAuthMethod(provider)` - Vincular método de autenticación
- `unlinkAuthMethod(provider)` - Desvincular método de autenticación
- `getAuthMethods()` - Obtener métodos de autenticación del usuario

**Endpoints:**
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `POST /api/auth/forgot-password`
- `GET /api/auth/validate-reset-token`
- `POST /api/auth/reset-password`
- `POST /api/auth/oauth/callback`
- `POST /api/auth/set-password`
- `POST /api/auth/link-method`
- `DELETE /api/auth/unlink-method`
- `GET /api/auth/methods`

#### `ProductService` - Gestión de Productos
Consulta y búsqueda de productos.

**Métodos:**
- `getProducts(filters)` - Obtener lista de productos con filtros
- `getProduct(id)` - Obtener detalle de un producto
- `searchProducts(query)` - Búsqueda rápida de productos
- `getCategories()` - Obtener categorías disponibles
- `getProductsByCategory(categoryId)` - Productos por categoría
- `getRelatedProducts(productId)` - Productos relacionados

**Endpoints:**
- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/products/search`
- `GET /api/categories`

#### `CartService` - Carrito de Compras
Gestión del carrito de compras.

**Métodos:**
- `getCart()` - Obtener carrito actual
- `addItem(productId, quantity)` - Agregar producto al carrito
- `updateQuantity(itemId, quantity)` - Actualizar cantidad
- `removeItem(itemId)` - Eliminar producto del carrito
- `clearCart()` - Vaciar carrito
- `applyDiscount(code)` - Aplicar código de descuento

**Endpoints:**
- `GET /api/cart`
- `POST /api/cart/items`
- `PUT /api/cart/items/:id`
- `DELETE /api/cart/items/:id`
- `DELETE /api/cart`
- `POST /api/cart/discount`

#### `OrderService` - Gestión de Pedidos
Creación y seguimiento de pedidos.

**Métodos:**
- `createOrder(orderData)` - Crear nuevo pedido
- `getOrders(filters)` - Obtener lista de pedidos
- `getOrder(orderId)` - Obtener detalle de pedido
- `trackOrder(orderId)` - Obtener tracking del pedido
- `cancelOrder(orderId)` - Cancelar pedido
- `downloadInvoice(orderId)` - Descargar factura

**Endpoints:**
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`
- `GET /api/orders/:id/tracking`
- `PUT /api/orders/:id/cancel`
- `GET /api/orders/:id/invoice`

#### `PaymentService` - Procesamiento de Pagos
Integración con pasarelas de pago.

**Métodos:**
- `processPayment(paymentData)` - Procesar pago
- `getPaymentMethods()` - Obtener métodos de pago guardados
- `addPaymentMethod(method)` - Agregar método de pago
- `removePaymentMethod(methodId)` - Eliminar método de pago
- `createPaymentIntent(amount)` - Crear intención de pago (Stripe)

**Endpoints:**
- `POST /api/payments/process`
- `GET /api/payments/methods`
- `POST /api/payments/methods`
- `DELETE /api/payments/methods/:id`
- `POST /api/payments/intent`

#### `UserService` - Gestión de Usuarios
Perfil y configuración de usuario.

**Métodos:**
- `getProfile()` - Obtener perfil del usuario
- `updateProfile(data)` - Actualizar perfil
- `changePassword(oldPassword, newPassword)` - Cambiar contraseña
- `getAddresses()` - Obtener direcciones guardadas
- `addAddress(address)` - Agregar dirección
- `updateAddress(addressId, address)` - Actualizar dirección
- `deleteAddress(addressId)` - Eliminar dirección
- `deleteAccount()` - Eliminar cuenta

**Endpoints:**
- `GET /api/users/profile`
- `PUT /api/users/profile`
- `PUT /api/users/password`
- `GET /api/users/addresses`
- `POST /api/users/addresses`
- `PUT /api/users/addresses/:id`
- `DELETE /api/users/addresses/:id`
- `DELETE /api/users/account`

#### `ChatService` - Chatbot con IA
Integración con el chatbot usando Socket.IO.

**Métodos:**
- `createSession()` - Crear sesión de chat
- `connectSocket(sessionId)` - Conectar Socket.IO
- `sendMessage(sessionId, message)` - Enviar mensaje
- `disconnectSocket()` - Desconectar Socket.IO

**Eventos Socket.IO:**
- `chat_message_stream` (emit) - Enviar mensaje
- `bot_typing` (on) - Bot está escribiendo
- `chat_stream_chunk` (on) - Chunk de respuesta
- `chat_stream_end` (on) - Respuesta completa
- `chat_stream_error` (on) - Error en respuesta

#### `NotificationService` - Sistema de Notificaciones
Gestión de notificaciones del usuario.

**Métodos:**
- `getNotifications()` - Obtener notificaciones
- `markAsRead(notificationId)` - Marcar como leída
- `markAllAsRead()` - Marcar todas como leídas
- `deleteNotification(notificationId)` - Eliminar notificación

**Endpoints:**
- `GET /api/notifications`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/read-all`
- `DELETE /api/notifications/:id`

#### `AdminService` - Dashboard de Administración
Servicios para el panel de administración.

**Métodos:**
- `getKPIs()` - Obtener KPIs principales
- `getChatbotMetrics()` - Métricas del chatbot
- `getRecommenderMetrics()` - Métricas del recommender
- `getAutomationMetrics()` - Métricas de automatización
- `getSystemMetrics()` - Métricas del sistema
- `getTickets(filters)` - Obtener tickets de soporte
- `getTicket(ticketId)` - Detalle de ticket
- `updateTicket(ticketId, data)` - Actualizar ticket

**Endpoints:**
- `GET /api/admin/kpis`
- `GET /api/admin/monitoring/chatbot`
- `GET /api/admin/monitoring/recommender`
- `GET /api/admin/monitoring/automation`
- `GET /api/admin/monitoring/system`
- `GET /api/admin/tickets`
- `GET /api/admin/tickets/:id`
- `PUT /api/admin/tickets/:id`

## Patrón de Diseño

### Estructura de un Servicio

```typescript
import { apiClient } from '@/lib/axios';
import type { Product, ProductFilters } from '@/types';

class ProductService {
  private baseUrl = '/api/products';

  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    const response = await apiClient.get(this.baseUrl, { params: filters });
    return response.data;
  }

  async getProduct(id: string): Promise<Product> {
    const response = await apiClient.get(`${this.baseUrl}/${id}`);
    return response.data;
  }
}

export const productService = new ProductService();
```

### Cliente HTTP (Axios)

Todos los servicios utilizan `apiClient` configurado en `@/lib/axios` con:

**Interceptors de Request:**
- Agregar token de autenticación automáticamente
- Agregar headers comunes (Content-Type, Accept)
- Logging de requests (desarrollo)

**Interceptors de Response:**
- Manejar refresh token automático (401)
- Transformar errores a formato consistente
- Logging de responses (desarrollo)

**Configuración:**
```typescript
// lib/axios.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  withCredentials: true, // Para cookies httpOnly
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use((config) => {
  // Agregar token si existe
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Manejar refresh token
    if (error.response?.status === 401) {
      await refreshToken();
      return apiClient.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

## Manejo de Errores

### Tipos de Errores

```typescript
interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, any>;
}
```

### Códigos de Error Comunes

- `AUTH_INVALID_CREDENTIALS` - Credenciales inválidas
- `AUTH_TOKEN_EXPIRED` - Token expirado
- `AUTH_UNAUTHORIZED` - No autorizado
- `PRODUCT_NOT_FOUND` - Producto no encontrado
- `ORDER_INVALID_STATUS` - Estado de pedido inválido
- `PAYMENT_FAILED` - Pago fallido
- `VALIDATION_ERROR` - Error de validación

### Manejo en Servicios

```typescript
try {
  const data = await productService.getProduct(id);
  return data;
} catch (error) {
  if (error.code === 'PRODUCT_NOT_FOUND') {
    // Manejar producto no encontrado
  }
  throw error;
}
```

## Integración con React Query

Los servicios se integran con React Query para caché y sincronización:

```typescript
// hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services';

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productService.getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
```

## Testing

### Mocking de Servicios

```typescript
// __mocks__/services/product.service.ts
export const productService = {
  getProducts: jest.fn(),
  getProduct: jest.fn(),
};
```

### Tests de Servicios

```typescript
// services/__tests__/product.service.test.ts
import { productService } from '../product.service';
import { apiClient } from '@/lib/axios';

jest.mock('@/lib/axios');

describe('ProductService', () => {
  it('should fetch products', async () => {
    const mockProducts = [{ id: '1', name: 'Product 1' }];
    (apiClient.get as jest.Mock).mockResolvedValue({ data: mockProducts });

    const products = await productService.getProducts();
    expect(products).toEqual(mockProducts);
  });
});
```

## Convenciones

1. **Nomenclatura**: Usar camelCase para métodos, PascalCase para clases
2. **Async/Await**: Preferir async/await sobre Promises
3. **Tipos**: Tipar todas las respuestas y parámetros
4. **Errores**: Propagar errores, no silenciarlos
5. **Documentación**: Documentar métodos complejos con JSDoc
