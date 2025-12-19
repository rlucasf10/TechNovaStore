# API Gateway

Gateway de API para TechNovaStore - Punto de entrada único para todos los microservicios.

## Arquitectura: Screaming Architecture

Este servicio sigue el patrón Screaming Architecture, donde la estructura del proyecto refleja los casos de uso del negocio.

## Estructura

```
api-gateway/
├── authenticate-request/     # Autenticación de requests
│   ├── AuthenticateRequest.ts
│   └── AuthenticateRequest.test.ts
├── proxy-request/            # Proxy a microservicios
│   ├── ProxyRequest.ts
│   └── ProxyRequest.test.ts
├── rate-limit-request/       # Rate limiting
│   ├── RateLimitRequest.ts
│   └── RateLimitRequest.test.ts
├── sanitize-input/           # Sanitización de entrada
│   ├── SanitizeInput.ts
│   └── SanitizeInput.test.ts
├── validate-csrf-token/      # Validación CSRF
│   ├── ValidateCSRFToken.ts
│   └── ValidateCSRFToken.test.ts
├── monitor-security/         # Monitoreo de seguridad
│   ├── MonitorSecurity.ts
│   └── MonitorSecurity.test.ts
├── shared/                   # Infraestructura compartida
│   ├── middleware/           # Middleware
│   │   ├── authMiddleware.ts
│   │   ├── rateLimitMiddleware.ts
│   │   ├── corsMiddleware.ts
│   │   └── securityMiddleware.ts
│   ├── clients/              # Clientes de servicios
│   │   ├── UserServiceClient.ts
│   │   ├── ProductServiceClient.ts
│   │   └── OrderServiceClient.ts
│   └── utils/                # Utilidades
│       ├── logger.ts
│       └── errorHandler.ts
├── api/                      # Capa de presentación HTTP
│   ├── GatewayController.ts
│   └── routes.ts
├── config/                   # Configuración
│   └── index.ts
└── index.ts                  # Entry point
```

## Características Principales

### 1. Routing Inteligente
- Enrutamiento automático a microservicios
- Load balancing entre instancias
- Circuit breaker para servicios caídos
- Retry automático con backoff exponencial

### 2. Autenticación y Autorización
- Validación de JWT tokens
- Verificación de roles y permisos
- Integración con User Service
- **Sesiones seguras con httpOnly cookies** (NO usar localStorage)
- Protección contra ataques XSS mediante cookies httpOnly

### 3. Seguridad
- Rate limiting por IP y usuario
- Protección CSRF
- Sanitización de entrada (XSS, SQL injection)
- Headers de seguridad (HSTS, CSP, etc.)
- CORS configurado
- Detección de ataques

### 4. Monitoreo y Logging
- Logging centralizado de todas las requests
- Métricas de rendimiento
- Alertas de seguridad
- Trazabilidad de requests (correlation ID)

### 5. Caché
- Caché de respuestas frecuentes
- Invalidación inteligente
- Redis para caché distribuido

## Rutas y Microservicios

### Catálogo (Product Service)
- `GET /api/products/*` → `http://product-service:3001`
- `POST /api/products/*` → `http://product-service:3001` (requiere auth)
- `PUT /api/products/*` → `http://product-service:3001` (requiere auth admin)
- `DELETE /api/products/*` → `http://product-service:3001` (requiere auth admin)

### Usuarios (User Service)
- `POST /api/users/register` → `http://user-service:3003`
- `POST /api/users/login` → `http://user-service:3003`
- `GET /api/users/profile` → `http://user-service:3003` (requiere auth)
- `PUT /api/users/profile` → `http://user-service:3003` (requiere auth)

### Pedidos (Order Service)
- `GET /api/orders/*` → `http://order-service:3002` (requiere auth)
- `POST /api/orders/*` → `http://order-service:3002` (requiere auth)
- `PUT /api/orders/*` → `http://order-service:3002` (requiere auth)

### Pagos (Payment Service)
- `POST /api/payments/*` → `http://payment-service:3004` (requiere auth)
- `GET /api/payments/*` → `http://payment-service:3004` (requiere auth)

### Notificaciones (Notification Service)
- `POST /api/notifications/*` → `http://notification-service:3005` (requiere auth admin)

### Recomendaciones (Recommender Service)
- `GET /api/recommendations/*` → `http://recommender-service:3010`
- `POST /api/recommendations/interaction` → `http://recommender-service:3010`

### Chatbot (Chatbot Service)
- `POST /api/chat/*` → `http://chatbot-service:3009`
- `GET /api/chat/*` → `http://chatbot-service:3009`

### Tickets (Ticket Service)
- `GET /api/tickets/*` → `http://ticket-service:3012` (requiere auth)
- `POST /api/tickets/*` → `http://ticket-service:3012` (requiere auth)

### Seguimiento (Shipment Tracker)
- `GET /api/shipments/*` → `http://shipment-tracker:3008` (requiere auth)

### Sincronización (Sync Engine)
- `POST /api/sync/*` → `http://sync-engine:3006` (requiere auth admin)
- `GET /api/sync/*` → `http://sync-engine:3006` (requiere auth admin)

## HttpOnly Cookies para Autenticación

**IMPORTANTE**: Este gateway está configurado para soportar httpOnly cookies para autenticación.

### Configuración CORS
El gateway tiene configurado `credentials: true` en CORS, lo cual es **CRÍTICO** para que las cookies httpOnly funcionen correctamente entre el frontend y backend.

```typescript
cors({
  origin: process.env.FRONTEND_URL,
  credentials: true  // CRÍTICO para cookies httpOnly
})
```

### Frontend Configuration
El frontend debe configurar `withCredentials: true` en todas las requests:

```typescript
// Axios
axios.defaults.withCredentials = true;

// Fetch
fetch(url, {
  credentials: 'include'
});
```

### Ventajas de httpOnly Cookies
- **Protección contra XSS**: Las cookies httpOnly no son accesibles desde JavaScript
- **Envío automático**: El navegador envía automáticamente las cookies en cada request
- **Seguridad mejorada**: Flags `Secure` y `SameSite` proporcionan protección adicional

## Middleware Pipeline

Cada request pasa por el siguiente pipeline:

1. **CORS Middleware** - Configuración de CORS
2. **Security Headers** - Headers de seguridad
3. **Request Logger** - Logging de request
4. **Rate Limiter** - Control de tasa de requests
5. **CSRF Validator** - Validación de token CSRF (POST/PUT/DELETE)
6. **Input Sanitizer** - Sanitización de entrada
7. **Authenticator** - Validación de JWT (rutas protegidas)
8. **Authorizer** - Verificación de permisos (rutas admin)
9. **Proxy** - Enrutamiento a microservicio
10. **Response Logger** - Logging de respuesta
11. **Error Handler** - Manejo de errores

## Rate Limiting

### Por IP
- Requests públicas: 100 requests/15 minutos
- Requests autenticadas: 1000 requests/15 minutos

### Por Endpoint
- Login: 5 intentos/15 minutos
- Registro: 3 intentos/hora
- Búsqueda: 60 requests/minuto
- Creación de pedidos: 10 requests/minuto

## Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar tests
npm test

# Compilar
npm run build

# Ejecutar en producción
npm start
```

## Variables de Entorno

- `PORT` - Puerto del servicio (default: 3000)
- `NODE_ENV` - Entorno de ejecución
- `JWT_SECRET` - Secret para validar JWT tokens
- `REDIS_URL` - URL de conexión a Redis (para rate limiting y caché)
- `USER_SERVICE_URL` - URL del User Service
- `PRODUCT_SERVICE_URL` - URL del Product Service
- `ORDER_SERVICE_URL` - URL del Order Service
- `PAYMENT_SERVICE_URL` - URL del Payment Service
- `NOTIFICATION_SERVICE_URL` - URL del Notification Service
- `RECOMMENDER_SERVICE_URL` - URL del Recommender Service
- `CHATBOT_SERVICE_URL` - URL del Chatbot Service
- `TICKET_SERVICE_URL` - URL del Ticket Service
- `SHIPMENT_TRACKER_URL` - URL del Shipment Tracker
- `SYNC_ENGINE_URL` - URL del Sync Engine
- `CORS_ORIGIN` - Origen permitido para CORS
- `LOG_LEVEL` - Nivel de logging

## Headers de Seguridad

El gateway agrega automáticamente los siguientes headers:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## Circuit Breaker

El gateway implementa circuit breaker para cada microservicio:

- **Closed**: Funcionamiento normal
- **Open**: Servicio caído, retorna error inmediatamente
- **Half-Open**: Prueba si el servicio se recuperó

Configuración:
- Threshold: 5 fallos consecutivos
- Timeout: 30 segundos
- Reset timeout: 60 segundos

## Caché

Respuestas cacheadas:
- Listado de productos: 5 minutos
- Detalles de producto: 10 minutos
- Recomendaciones: 15 minutos
- Búsquedas: 5 minutos

Invalidación automática en:
- Creación/actualización/eliminación de productos
- Cambios en inventario
- Cambios en precios

## Monitoreo

- `/health` - Health check del gateway
- `/health/services` - Health check de todos los microservicios
- Métricas de requests por servicio
- Métricas de latencia
- Alertas de seguridad

## Tests

Cada caso de uso tiene tests completos que cubren:
- Routing correcto
- Autenticación y autorización
- Rate limiting
- Sanitización de entrada
- Manejo de errores
- Circuit breaker

## Integración con Microservicios

El gateway se comunica con todos los microservicios vía HTTP:
- Timeout: 30 segundos
- Retry: 3 intentos con backoff exponencial
- Headers de correlación para trazabilidad

## Docker

```bash
# Construir imagen
docker build -t technovastore-api-gateway .

# Ejecutar contenedor
docker run -p 3000:3000 \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -e JWT_SECRET=your-secret-key \
  technovastore-api-gateway
```

## Documentación Adicional

- [SECURITY.md](./SECURITY.md) - Políticas de seguridad detalladas
- [README.security.md](./README.security.md) - Configuración de seguridad
