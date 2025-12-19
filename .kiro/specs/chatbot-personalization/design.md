# Design Document - Personalización del Chatbot con Contexto de Usuario

## Overview

Este documento describe el diseño técnico para implementar personalización avanzada en el chatbot de TechNovaStore. La solución aprovecha la autenticación JWT existente para enriquecer las respuestas del chatbot con información contextual del usuario (pedidos, carrito, wishlist, tickets, notificaciones, historial de compras).

### Objetivos Principales

1. **Experiencia Personalizada**: Proporcionar respuestas contextuales basadas en el perfil y actividad del usuario
2. **Integración Seamless**: Conectar el chatbot con todos los servicios del ecosistema (Order, Cart, Wishlist, Ticket, Recommender, Notification)
3. **Seguridad**: Garantizar que cada usuario solo accede a su propia información
4. **Arquitectura Limpia**: Seguir Screaming Architecture con casos de uso independientes
5. **Rendimiento**: Implementar caché y timeouts para respuestas rápidas

### Alcance

**Incluido:**
- Enriquecimiento de contexto de usuario en process-message
- 8 nuevos casos de uso para consultar servicios externos
- 6 nuevos clientes HTTP para servicios externos
- Reconocimiento de intenciones personalizadas
- Manejo de errores y fallbacks
- Caché de respuestas de servicios

**No Incluido:**
- Modificaciones en servicios externos (Order, Cart, etc.)
- Cambios en el frontend (se usarán APIs existentes)
- Sistema de puntos/créditos (no existe actualmente)
- Historial de conversaciones persistente (se mantiene en sesión)

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                 │
│                    (Usuario Autenticado)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/WebSocket + JWT Token
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Chatbot Service                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              process-message (Enhanced)                   │  │
│  │  1. Detectar usuario autenticado (req.user)              │  │
│  │  2. Enriquecer contexto con datos de usuario             │  │
│  │  3. Procesar mensaje con contexto enriquecido            │  │
│  │  4. Generar respuesta personalizada                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
│  ┌──────────────────────────┴────────────────────────────────┐ │
│  │           Nuevos Casos de Uso (8)                         │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ • get-user-orders/        - Consultar pedidos            │ │
│  │ • get-user-cart/          - Consultar carrito            │ │
│  │ • get-user-wishlist/      - Consultar wishlist           │ │
│  │ • get-user-tickets/       - Consultar tickets            │ │
│  │ • get-user-notifications/ - Consultar notificaciones     │ │
│  │ • get-personalized-recs/  - Recomendaciones personalizadas│ │
│  │ • get-purchase-history/   - Historial de compras         │ │
│  │ • enrich-user-context/    - Enriquecer contexto          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                             │                                    │
│  ┌──────────────────────────┴────────────────────────────────┐ │
│  │         Clientes HTTP (shared/clients)                    │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ • OrderServiceClient      - API de pedidos               │ │
│  │ • CartServiceClient       - API de carrito (frontend)    │ │
│  │ • WishlistServiceClient   - API de wishlist (frontend)   │ │
│  │ • TicketServiceClient     - API de tickets               │ │
│  │ • NotificationServiceClient - API de notificaciones      │ │
│  │ • RecommenderServiceClient - API de recomendaciones      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│Order Service │    │Ticket Service│    │Notification  │
│              │    │              │    │Service       │
└──────────────┘    └──────────────┘    └──────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│Recommender   │    │Frontend APIs │    │Product       │
│Service       │    │(Cart/Wishlist│    │Service       │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Data Flow - Mensaje con Usuario Autenticado

```
1. Usuario envía mensaje → Chatbot recibe req.user (JWT decodificado)
2. process-message detecta req.user.id
3. enrich-user-context consulta servicios en paralelo:
   - get-user-orders → Order Service
   - get-user-notifications → Notification Service
   - get-user-tickets → Ticket Service
4. Contexto enriquecido se agrega a session.context.userContext
5. Mensaje se procesa con contexto enriquecido
6. Respuesta incluye información personalizada
```

## Components and Interfaces

### 1. Enhanced ProcessMessage

**Ubicación:** `process-message/ProcessMessage.ts`

**Responsabilidad:** Orquestar el procesamiento de mensajes con enriquecimiento de contexto

**Cambios:**
```typescript
// Agregar al inicio de execute()
if (req.user) {
  // Enriquecer contexto con datos de usuario
  const enrichedContext = await this.enrichUserContext.execute(
    req.user.id,
    session.context
  );
  session.context.userContext = enrichedContext;
}
```

### 2. EnrichUserContext (Nuevo Caso de Uso)

**Ubicación:** `enrich-user-context/EnrichUserContext.ts`

**Responsabilidad:** Consultar servicios externos y enriquecer el contexto de la sesión

**Interface:**
```typescript
interface UserContext {
  userId: string;
  userName: string;
  activeOrders: Order[];
  recentOrders: Order[];
  cartSummary: CartSummary;
  wishlistItems: WishlistItem[];
  openTickets: Ticket[];
  unreadNotifications: Notification[];
  purchaseHistory: PurchaseHistoryItem[];
  lastEnriched: Date;
}

class EnrichUserContext {
  async execute(userId: string, currentContext: ChatContext): Promise<UserContext>
}
```

**Lógica:**
1. Consultar servicios en paralelo con Promise.all()
2. Implementar timeout de 5 segundos por servicio
3. Cachear resultados por 30 segundos
4. Manejar errores gracefully (si un servicio falla, continuar con los demás)

### 3. GetUserOrders (Nuevo Caso de Uso)

**Ubicación:** `get-user-orders/GetUserOrders.ts`

**Responsabilidad:** Consultar pedidos del usuario desde Order Service

**Interface:**
```typescript
interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: Date;
  items: OrderItem[];
}

class GetUserOrders {
  constructor(private orderClient: OrderServiceClient) {}
  async execute(userId: string, limit?: number): Promise<Order[]>
}
```

### 4. GetUserCart (Nuevo Caso de Uso)

**Ubicación:** `get-user-cart/GetUserCart.ts`

**Responsabilidad:** Consultar carrito del usuario desde Frontend API

**Interface:**
```typescript
interface CartSummary {
  itemCount: number;
  total: number;
  items: CartItem[];
}

class GetUserCart {
  constructor(private cartClient: CartServiceClient) {}
  async execute(userId: string): Promise<CartSummary>
}
```

### 5. GetUserWishlist (Nuevo Caso de Uso)

**Ubicación:** `get-user-wishlist/GetUserWishlist.ts`

**Responsabilidad:** Consultar wishlist del usuario desde Frontend API

**Interface:**
```typescript
interface WishlistItem {
  productId: string;
  productName: string;
  currentPrice: number;
  originalPrice?: number;
  discountPercentage?: number;
  inStock: boolean;
}

class GetUserWishlist {
  constructor(private wishlistClient: WishlistServiceClient) {}
  async execute(userId: string): Promise<WishlistItem[]>
}
```

### 6. GetUserTickets (Nuevo Caso de Uso)

**Ubicación:** `get-user-tickets/GetUserTickets.ts`

**Responsabilidad:** Consultar tickets del usuario desde Ticket Service

**Interface:**
```typescript
interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  lastUpdated: Date;
}

class GetUserTickets {
  constructor(private ticketClient: TicketServiceClient) {}
  async execute(userId: string, onlyOpen?: boolean): Promise<Ticket[]>
}
```

### 7. GetUserNotifications (Nuevo Caso de Uso)

**Ubicación:** `get-user-notifications/GetUserNotifications.ts`

**Responsabilidad:** Consultar notificaciones del usuario desde Notification Service

**Interface:**
```typescript
interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

class GetUserNotifications {
  constructor(private notificationClient: NotificationServiceClient) {}
  async execute(userId: string, onlyUnread?: boolean, limit?: number): Promise<Notification[]>
}
```

### 8. GetPersonalizedRecommendations (Nuevo Caso de Uso)

**Ubicación:** `get-personalized-recs/GetPersonalizedRecommendations.ts`

**Responsabilidad:** Obtener recomendaciones personalizadas desde Recommender Service

**Interface:**
```typescript
interface PersonalizedRecommendation {
  productId: string;
  productName: string;
  price: number;
  reason: string;
  score: number;
}

class GetPersonalizedRecommendations {
  constructor(private recommenderClient: RecommenderServiceClient) {}
  async execute(userId: string, limit?: number): Promise<PersonalizedRecommendation[]>
}
```

### 9. GetPurchaseHistory (Nuevo Caso de Uso)

**Ubicación:** `get-purchase-history/GetPurchaseHistory.ts`

**Responsabilidad:** Obtener historial de compras completadas

**Interface:**
```typescript
interface PurchaseHistoryItem {
  orderId: string;
  productId: string;
  productName: string;
  price: number;
  purchaseDate: Date;
  category: string;
}

class GetPurchaseHistory {
  constructor(private orderClient: OrderServiceClient) {}
  async execute(userId: string, limit?: number): Promise<PurchaseHistoryItem[]>
}
```

### 10. HTTP Clients (shared/clients)

Todos los clientes seguirán el mismo patrón:

```typescript
class ServiceClient {
  constructor(
    private baseUrl: string,
    private timeout: number = 5000
  ) {}

  async get<T>(endpoint: string, token: string): Promise<T> {
    // Implementar con axios
    // Incluir Authorization: Bearer ${token}
    // Timeout de 5 segundos
    // Manejo de errores
  }
}
```

**Clientes a crear:**
1. `OrderServiceClient` - http://order-service:3000
2. `CartServiceClient` - http://frontend:3000/api/cart (o estado local)
3. `WishlistServiceClient` - http://frontend:3000/api/wishlist (o estado local)
4. `TicketServiceClient` - http://ticket-service:3005
5. `NotificationServiceClient` - http://notification-service:3000
6. `RecommenderServiceClient` - http://recommender:3000

## Data Models

### UserContext (Nuevo)

```typescript
interface UserContext {
  userId: string;
  userName: string;
  email: string;
  
  // Pedidos
  activeOrders: Order[];
  recentOrders: Order[];
  
  // Carrito y Wishlist
  cartSummary: CartSummary;
  wishlistItems: WishlistItem[];
  
  // Soporte
  openTickets: Ticket[];
  
  // Notificaciones
  unreadNotifications: Notification[];
  unreadCount: number;
  
  // Historial
  purchaseHistory: PurchaseHistoryItem[];
  
  // Metadata
  lastEnriched: Date;
  enrichmentErrors: string[];
}
```

### Enhanced ChatContext

```typescript
interface ChatContext {
  // ... campos existentes ...
  
  // NUEVO: Contexto de usuario autenticado
  userContext?: UserContext;
}
```

### CacheEntry (Nuevo)

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  expiresAt: Date;
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>>;
  
  set<T>(key: string, data: T, ttlSeconds: number): void
  get<T>(key: string): T | null
  has(key: string): boolean
  clear(): void
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Saludo personalizado con nombre

*For any* usuario autenticado con nombre en su perfil, cuando inicia una conversación, el saludo debe incluir su nombre.

**Validates: Requirements 1.1**

### Property 2: UserId en contexto de sesión

*For any* mensaje procesado de un usuario autenticado, el contexto de la sesión debe contener el userId.

**Validates: Requirements 1.2**

### Property 3: UserId en logs de conversación

*For any* conversación con usuario autenticado, los logs deben registrar el userId asociado.

**Validates: Requirements 1.5**

### Property 4: Consulta de pedidos con userId correcto

*For any* consulta de pedidos, la petición al Order Service debe incluir el userId del usuario autenticado.

**Validates: Requirements 2.1**

### Property 5: Formato de respuesta de pedidos

*For any* respuesta de pedidos activos, debe mostrar máximo 3 pedidos con estado, fecha y total.

**Validates: Requirements 2.2**

### Property 6: Búsqueda de pedido específico

*For any* número de pedido válido, el sistema debe buscar y mostrar los detalles completos del pedido.

**Validates: Requirements 2.3**

### Property 7: Verificación de propiedad de pedidos

*For any* consulta de pedido, el sistema debe verificar que el pedido pertenece al usuario autenticado antes de mostrar información.

**Validates: Requirements 2.4**

### Property 8: Formato de respuesta de carrito

*For any* consulta de carrito, la respuesta debe incluir número de productos y total.

**Validates: Requirements 3.1**

### Property 9: Contenido completo de carrito

*For any* carrito mostrado, debe listar todos los productos con nombre, cantidad y precio.

**Validates: Requirements 3.2**

### Property 10: Generación de enlace para agregar al carrito

*For any* solicitud de agregar producto al carrito, debe generarse un enlace con formato correcto.

**Validates: Requirements 3.3**

### Property 11: UserId correcto en acceso a carrito

*For any* acceso al carrito, debe usarse el userId del usuario autenticado.

**Validates: Requirements 3.5**

### Property 12: Formato de respuesta de wishlist

*For any* consulta de wishlist, debe mostrar productos con nombre y precio actual.

**Validates: Requirements 4.1**

### Property 13: Destacar descuentos en wishlist

*For any* producto en wishlist con descuento, debe destacarse la oferta y el porcentaje.

**Validates: Requirements 4.2**

### Property 14: Generación de enlace para wishlist

*For any* solicitud de agregar a wishlist, debe generarse un enlace correcto.

**Validates: Requirements 4.3**

### Property 15: Verificación de propiedad de wishlist

*For any* acceso a wishlist, debe verificarse que pertenece al usuario autenticado.

**Validates: Requirements 4.5**

### Property 16: Consulta de tickets abiertos

*For any* consulta de tickets, debe consultarse el Ticket Service y mostrar solo tickets abiertos.

**Validates: Requirements 5.1**

### Property 17: Formato completo de tickets

*For any* ticket mostrado, debe incluir número, asunto, estado y última actualización.

**Validates: Requirements 5.2**

### Property 18: Uso de escalate-to-human para crear tickets

*For any* solicitud de crear ticket, debe usarse el caso de uso escalate-to-human existente.

**Validates: Requirements 5.3**

### Property 19: Asociación de tickets con userId

*For any* ticket creado, debe asociarse al userId del usuario autenticado.

**Validates: Requirements 5.4**

### Property 20: Consulta de recomendaciones con userId

*For any* solicitud de recomendaciones, debe consultarse el Recommender Service con el userId.

**Validates: Requirements 6.1**

### Property 21: Límite de recomendaciones

*For any* respuesta de recomendaciones, debe mostrar máximo 5 productos con razón de recomendación.

**Validates: Requirements 6.2**

### Property 22: Consulta automática de notificaciones

*For any* usuario autenticado que inicia conversación, debe consultarse el Notification Service automáticamente.

**Validates: Requirements 7.1**

### Property 23: Mención de notificaciones en saludo

*For any* usuario con notificaciones pendientes, el saludo inicial debe mencionar el número de notificaciones.

**Validates: Requirements 7.2**

### Property 24: Límite de notificaciones mostradas

*For any* consulta de notificaciones, debe mostrar máximo 5 notificaciones con título y fecha.

**Validates: Requirements 7.3**

### Property 25: Enlaces en notificaciones

*For any* notificación mostrada, debe incluir enlace para ver detalles si está disponible.

**Validates: Requirements 7.4**

### Property 26: Consulta de historial de compras

*For any* consulta de compras anteriores, debe consultarse el Order Service para pedidos completados.

**Validates: Requirements 8.1**

### Property 27: Formato de historial de compras

*For any* historial mostrado, debe listar productos con fecha y precio.

**Validates: Requirements 8.2**

### Property 28: Sugerencias de productos complementarios

*For any* compra reciente identificada, debe sugerirse accesorios o productos complementarios.

**Validates: Requirements 8.3**

### Property 29: Sugerencias de actualizaciones

*For any* compra antigua identificada, debe sugerirse actualizaciones o nuevas versiones.

**Validates: Requirements 8.4**

### Property 30: Uso de Product Service para complementarios

*For any* sugerencia de complementarios, debe consultarse el Product Service.

**Validates: Requirements 8.5**

### Property 31: JWT en peticiones a servicios externos

*For any* petición a servicio externo, debe incluirse el token JWT en el header Authorization.

**Validates: Requirements 9.1**

### Property 32: Manejo graceful de errores de servicios

*For any* fallo de servicio externo, debe manejarse el error y informar al usuario apropiadamente.

**Validates: Requirements 9.2**

### Property 33: Timeout de 5 segundos

*For any* petición a servicio externo, debe implementarse un timeout de 5 segundos.

**Validates: Requirements 9.3**

### Property 34: Caché de 30 segundos

*For any* respuesta de servicio externo, debe cachearse por 30 segundos.

**Validates: Requirements 9.4**

### Property 35: Logging de peticiones

*For any* petición a servicio externo, debe loggearse para debugging.

**Validates: Requirements 9.5**

### Property 36: Verificación de userId en acceso a datos

*For any* acceso a datos de usuario, debe verificarse que el userId del token coincide con el userId solicitado.

**Validates: Requirements 10.1**

### Property 37: Denegación de acceso no autorizado

*For any* intento de acceder a datos de otro usuario, debe denegarse el acceso y loggearse el intento.

**Validates: Requirements 10.2**

### Property 38: Asociación de conversaciones con userId

*For any* conversación almacenada, debe asociarse al userId para privacidad.

**Validates: Requirements 10.3**

### Property 39: Enmascaramiento de datos sensibles

*For any* información sensible mostrada, debe enmascararse apropiadamente (ej: últimos 4 dígitos).

**Validates: Requirements 10.4**

### Property 40: No loggear información sensible

*For any* log generado, no debe contener información sensible del usuario.

**Validates: Requirements 10.5**

### Property 41: Manejo de intenciones desconocidas

*For any* pregunta no entendida, debe ofrecerse opciones de lo que el chatbot puede hacer.

**Validates: Requirements 12.5**

## Error Handling

### Error Categories

1. **Service Unavailable**: Servicio externo no responde
2. **Timeout**: Servicio tarda más de 5 segundos
3. **Unauthorized**: Token inválido o expirado
4. **Forbidden**: Usuario intenta acceder a datos de otro usuario
5. **Not Found**: Recurso solicitado no existe
6. **Network Error**: Error de red o conexión

### Error Handling Strategy

```typescript
try {
  const data = await serviceClient.get(endpoint, token);
  return data;
} catch (error) {
  if (error.code === 'TIMEOUT') {
    logger.warn('Service timeout', { service, endpoint });
    return null; // Continuar sin estos datos
  }
  
  if (error.status === 401 || error.status === 403) {
    logger.error('Authorization error', { service, userId });
    throw error; // Propagar error de seguridad
  }
  
  if (error.status === 404) {
    return null; // Recurso no encontrado, continuar
  }
  
  logger.error('Service error', { service, error });
  return null; // Continuar sin estos datos
}
```

### Fallback Behavior

- Si un servicio falla, el chatbot continúa funcionando sin esa información
- Se informa al usuario si la información solicitada no está disponible
- Se loggean todos los errores para debugging
- El contexto parcial es mejor que ningún contexto

## Testing Strategy

Testing manual durante el desarrollo para verificar:
- Respuestas personalizadas con usuario autenticado
- Cada tipo de consulta (pedidos, carrito, wishlist, tickets, notificaciones)
- Manejo de errores cuando servicios fallan
- Comportamiento con usuario anónimo

## Performance Considerations

### Caché Strategy

- **TTL**: 30 segundos para datos de usuario
- **Invalidación**: Manual si el usuario realiza una acción (agregar al carrito, etc.)
- **Almacenamiento**: En memoria (Map) por simplicidad
- **Límite**: Máximo 1000 entradas en caché

### Parallel Requests

- Consultar servicios en paralelo con `Promise.all()`
- No bloquear si un servicio falla
- Timeout individual por servicio (5 segundos)

### Response Time Goals

- Enriquecimiento de contexto: < 2 segundos
- Respuesta total del chatbot: < 5 segundos
- Caché hit: < 100ms

## Security Considerations

### Authentication

- Verificar `req.user` en cada petición
- Incluir JWT token en todas las peticiones a servicios
- Validar que userId del token coincide con userId solicitado

### Authorization

- Verificar propiedad de recursos (pedidos, tickets, etc.)
- Denegar acceso a datos de otros usuarios
- Loggear intentos de acceso no autorizado

### Data Privacy

- No loggear información sensible (contraseñas, tarjetas, etc.)
- Enmascarar datos sensibles en respuestas
- Asociar conversaciones a userId para privacidad

### Rate Limiting

- Respetar rate limits de servicios externos
- Implementar backoff exponencial si es necesario
- Cachear para reducir llamadas a servicios

## Deployment Considerations

### Environment Variables

```bash
# Service URLs
ORDER_SERVICE_URL=http://order-service:3000
TICKET_SERVICE_URL=http://ticket-service:3005
NOTIFICATION_SERVICE_URL=http://notification-service:3000
RECOMMENDER_SERVICE_URL=http://recommender:3000
PRODUCT_SERVICE_URL=http://product-service:3000
FRONTEND_URL=http://frontend:3000

# Timeouts
SERVICE_TIMEOUT_MS=5000

# Cache
CACHE_TTL_SECONDS=30
CACHE_MAX_ENTRIES=1000

# Feature Flags
ENABLE_USER_CONTEXT=true
ENABLE_PERSONALIZATION=true
```

### Docker

- No requiere cambios en Dockerfile
- Agregar variables de entorno en docker-compose.yml
- Verificar conectividad con servicios externos

### Monitoring

- Loggear todas las peticiones a servicios externos
- Métricas de tiempo de respuesta por servicio
- Alertas si servicios fallan frecuentemente
- Dashboard con tasa de éxito de enriquecimiento

## Migration Strategy

### Phase 1: Infrastructure (Week 1)

1. Crear clientes HTTP para servicios externos
2. Implementar caché simple
3. Crear tipos y interfaces

### Phase 2: Core Use Cases (Week 2)

1. Implementar EnrichUserContext
2. Implementar GetUserOrders
3. Implementar GetUserNotifications
4. Integrar en ProcessMessage

### Phase 3: Additional Use Cases (Week 3)

1. Implementar GetUserCart
2. Implementar GetUserWishlist
3. Implementar GetUserTickets
4. Implementar GetPersonalizedRecommendations
5. Implementar GetPurchaseHistory

### Phase 4: Intent Recognition (Week 4)

1. Actualizar SimpleFallbackRecognizer con nuevas intenciones
2. Agregar patrones para consultas personalizadas
3. Integrar con casos de uso

### Phase 5: Testing & Polish (Week 5)

1. Escribir tests unitarios
2. Escribir property tests
3. Testing manual
4. Ajustes y optimizaciones

## Future Enhancements

- Historial de conversaciones persistente en base de datos
- Sistema de puntos/créditos cuando se implemente
- Recomendaciones basadas en conversaciones anteriores
- Análisis de sentimiento para mejorar respuestas
- Integración con sistema de campañas para ofertas personalizadas
- Notificaciones proactivas (ej: "Tu producto de wishlist bajó de precio")
