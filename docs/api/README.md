# Documentación de APIs - TechNovaStore

Esta sección contiene la documentación completa de todas las APIs de TechNovaStore, incluyendo especificaciones OpenAPI/Swagger, ejemplos de uso y guías de integración.

## Índice

- [Especificación OpenAPI](#especificación-openapi)
- [API Gateway](#api-gateway)
- [Microservicios](#microservicios)
- [Autenticación](#autenticación)
- [Códigos de Error](#códigos-de-error)
- [Ejemplos de Uso](#ejemplos-de-uso)

## Especificación OpenAPI

### Documentación Swagger

La documentación interactiva de Swagger está disponible en:
- **Desarrollo**: `http://localhost:3000/api-docs`
- **Producción**: `https://api.technovastore.com/api-docs`

### Archivos de Especificación

- [openapi.yaml](./openapi.yaml) - Especificación completa OpenAPI 3.0
- [postman-collection.json](./postman-collection.json) - Colección de Postman

## API Gateway

El API Gateway actúa como punto de entrada único para todas las requests y proporciona:

- **Enrutamiento**: Redirige requests a los microservicios apropiados
- **Autenticación**: Validación de tokens JWT
- **Rate Limiting**: Protección contra abuso
- **Logging**: Registro de todas las requests
- **Seguridad**: Protección XSS, CSRF, CORS

### Endpoints del Gateway

```
GET  /health              - Health check del sistema
GET  /metrics             - Métricas de Prometheus
GET  /api/csrf-token      - Obtener token CSRF
GET  /api/docs            - Documentación de endpoints
```

## Microservicios

### Product Service

Gestión del catálogo de productos y búsqueda.

**Base URL**: `/api/products`

#### Endpoints Principales

```
GET    /api/products                    - Listar productos
GET    /api/products/:id                - Obtener producto por ID
GET    /api/products/search             - Búsqueda de productos
GET    /api/products/categories         - Listar categorías
POST   /api/products                    - Crear producto (admin)
PUT    /api/products/:id                - Actualizar producto (admin)
DELETE /api/products/:id                - Eliminar producto (admin)
```

#### Ejemplo de Response

```json
{
  "id": "64a1b2c3d4e5f6789012345",
  "sku": "TECH-001",
  "name": "Laptop Gaming ROG",
  "description": "Laptop gaming de alta performance",
  "category": "laptops",
  "brand": "ASUS",
  "price": 1299.99,
  "stock": 15,
  "images": [
    "https://cdn.technovastore.com/products/tech-001-1.jpg"
  ],
  "specifications": {
    "processor": "Intel i7-12700H",
    "ram": "16GB DDR4",
    "storage": "512GB SSD"
  },
  "providers": [
    {
      "name": "Amazon",
      "price": 1199.99,
      "availability": true,
      "shipping_cost": 0,
      "delivery_time": 2
    }
  ]
}
```

### User Service

Autenticación y gestión de usuarios.

**Base URL**: `/api/users` y `/api/auth`

#### Endpoints de Autenticación

```
POST   /api/auth/register              - Registro de usuario
POST   /api/auth/login                 - Inicio de sesión
POST   /api/auth/logout                - Cerrar sesión
POST   /api/auth/refresh               - Renovar token
POST   /api/auth/reset-password        - Solicitar reset de contraseña
POST   /api/auth/confirm-reset         - Confirmar reset de contraseña
```

#### Endpoints de Usuario

```
GET    /api/users/profile              - Obtener perfil del usuario
PUT    /api/users/profile              - Actualizar perfil
GET    /api/users/orders               - Historial de pedidos
DELETE /api/users/account              - Eliminar cuenta
```

#### Ejemplo de Login

**Request:**
```json
{
  "email": "usuario@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64a1b2c3d4e5f6789012345",
      "email": "usuario@example.com",
      "firstName": "Juan",
      "lastName": "Pérez",
      "role": "customer"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  }
}
```

### Order Service

Gestión de pedidos y procesamiento.

**Base URL**: `/api/orders`

#### Endpoints Principales

```
GET    /api/orders                     - Listar pedidos del usuario
GET    /api/orders/:id                 - Obtener pedido por ID
POST   /api/orders/create              - Crear nuevo pedido
PUT    /api/orders/:id/cancel          - Cancelar pedido
GET    /api/orders/:id/tracking        - Información de seguimiento
```

#### Ejemplo de Creación de Pedido

**Request:**
```json
{
  "items": [
    {
      "productId": "64a1b2c3d4e5f6789012345",
      "quantity": 1,
      "price": 1299.99
    }
  ],
  "shippingAddress": {
    "street": "Calle Mayor 123",
    "city": "Madrid",
    "postalCode": "28001",
    "country": "España"
  },
  "paymentMethod": "card"
}
```

### Payment Service

Procesamiento de pagos seguros.

**Base URL**: `/api/payments`

#### Endpoints Principales

```
POST   /api/payments/process            - Procesar pago
GET    /api/payments/:id/status         - Estado del pago
POST   /api/payments/refund             - Procesar reembolso
```

### Notification Service

Gestión de notificaciones y comunicaciones.

**Base URL**: `/api/notifications`

#### Endpoints Principales

```
GET    /api/notifications               - Listar notificaciones
POST   /api/notifications/mark-read     - Marcar como leída
GET    /api/notifications/preferences   - Preferencias de notificación
PUT    /api/notifications/preferences   - Actualizar preferencias
```

## Autenticación

### JWT Tokens

TechNovaStore utiliza JWT (JSON Web Tokens) para la autenticación:

- **Access Token**: Válido por 1 hora, usado para requests autenticadas
- **Refresh Token**: Válido por 7 días, usado para renovar access tokens

### Headers Requeridos

```
Authorization: Bearer <access_token>
Content-Type: application/json
X-CSRF-Token: <csrf_token> (para requests POST/PUT/DELETE)
```

### Obtener Token CSRF

```bash
curl -X GET http://localhost:3000/api/csrf-token
```

## Códigos de Error

### Códigos HTTP Estándar

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

### Formato de Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos proporcionados no son válidos",
    "details": [
      {
        "field": "email",
        "message": "El email no tiene un formato válido"
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789"
  }
}
```

## Rate Limiting

### Límites por Endpoint

- **General**: 100 requests/minuto por IP
- **Auth Login**: 5 requests/minuto por IP
- **Auth Register**: 3 requests/minuto por IP
- **Password Reset**: 2 requests/hora por IP
- **Search**: 30 requests/minuto por IP
- **Order Creation**: 10 requests/minuto por usuario

### Headers de Rate Limit

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248600
```

## Ejemplos de Uso

### Flujo Completo de Compra

1. **Buscar productos**
```bash
curl -X GET "http://localhost:3000/api/products/search?q=laptop&category=electronics"
```

2. **Registrar usuario**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "password123",
    "firstName": "Juan",
    "lastName": "Pérez"
  }'
```

3. **Iniciar sesión**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "password123"
  }'
```

4. **Crear pedido**
```bash
curl -X POST http://localhost:3000/api/orders/create \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <csrf_token>" \
  -d '{
    "items": [
      {
        "productId": "64a1b2c3d4e5f6789012345",
        "quantity": 1,
        "price": 1299.99
      }
    ],
    "shippingAddress": {
      "street": "Calle Mayor 123",
      "city": "Madrid",
      "postalCode": "28001",
      "country": "España"
    }
  }'
```

## Testing

### Colección de Postman

Importa la colección de Postman desde [postman-collection.json](./postman-collection.json) para probar todos los endpoints.

### Variables de Entorno

```json
{
  "baseUrl": "http://localhost:3000",
  "accessToken": "{{access_token}}",
  "csrfToken": "{{csrf_token}}"
}
```

## Versionado de API

- **Versión actual**: v1
- **Formato**: `/api/v1/endpoint`
- **Compatibilidad**: Mantenemos compatibilidad hacia atrás por al menos 6 meses

## Soporte

Para preguntas sobre la API:
- Consulta la [documentación interactiva](http://localhost:3000/api-docs)
- Revisa los [ejemplos de código](./examples/)
- Abre un [issue en GitHub](https://github.com/technovastore/issues)