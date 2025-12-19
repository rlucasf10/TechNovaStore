# Middlewares de Seguridad - Campaign Manager Service

Este directorio contiene los middlewares de seguridad implementados para el Campaign Manager Service.

## Middlewares Implementados

### 1. Autenticación JWT (`auth.ts`)

**Requirement**: 7.9, 10.8

Valida tokens JWT y verifica que el usuario tenga rol de administrador.

**Características**:
- Valida formato del token (Bearer <token>)
- Verifica firma del token con JWT_SECRET
- Valida que el usuario tenga rol de administrador
- Maneja tokens expirados e inválidos
- Agrega información del usuario al request

**Uso**:
```typescript
import { authenticateJWT } from './shared/middleware'

// Aplicar a rutas que requieren autenticación
router.post('/campaigns', authenticateJWT, controller.create)
```

**Endpoints que requieren autenticación**:
- ✅ POST /api/campaigns
- ✅ GET /api/campaigns
- ✅ GET /api/campaigns/:id
- ✅ PUT /api/campaigns/:id
- ✅ DELETE /api/campaigns/:id
- ✅ POST /api/campaigns/:id/apply-discounts
- ✅ POST /api/campaigns/:id/remove-discounts
- ✅ GET /api/campaigns/:id/analytics

**Endpoint público (sin autenticación)**:
- ❌ GET /api/campaigns/active (acceso público para frontend)

### 2. Rate Limiting (`rate-limiter.ts`)

**Requirement**: 10.10

Implementa límite de requests por IP para proteger el servicio de abuso.

**Características**:
- Límite de 100 requests por minuto por IP (configurable)
- Maneja headers de proxy (X-Forwarded-For, X-Real-IP)
- Agrega headers de rate limiting (X-RateLimit-*)
- Limpieza automática de entradas expiradas
- Soporte para múltiples configuraciones (default, strict)

**Uso**:
```typescript
import { defaultRateLimiter, strictRateLimiter } from './shared/middleware'

// Aplicar a todas las rutas
router.use(defaultRateLimiter)

// O aplicar límite más estricto a operaciones sensibles
router.post('/campaigns', strictRateLimiter, controller.create)
```

**Configuraciones disponibles**:
- `defaultRateLimiter`: 100 requests/minuto
- `strictRateLimiter`: 30 requests/minuto

### 3. Logging de Auditoría (`audit-logger.ts`)

**Requirement**: 10.9, 12.1

Registra todas las operaciones administrativas con información del usuario.

**Características**:
- Registra operaciones POST, PUT, DELETE
- Incluye información del usuario autenticado
- Registra tiempo de respuesta
- Sanitiza campos sensibles (passwords, tokens)
- Logging específico para operaciones de campaña
- Integración con Winston logger

**Uso**:
```typescript
import { combinedAuditLogger } from './shared/middleware'

// Aplicar después de autenticación
router.post('/campaigns', authenticateJWT, combinedAuditLogger, controller.create)
```

**Información registrada**:
- Timestamp
- Usuario (ID, email, rol)
- Método HTTP y path
- IP del cliente
- User agent
- Código de estado HTTP
- Tiempo de respuesta
- Body del request (sanitizado)
- Información específica de campaña (ID, nombre, productos afectados)

## Orden de Aplicación de Middlewares

Es importante aplicar los middlewares en el orden correcto:

```typescript
// 1. Rate limiting (primero, para proteger de abuso)
router.use(defaultRateLimiter)

// 2. Autenticación (segundo, para identificar usuario)
router.post('/campaigns', authenticateJWT, ...)

// 3. Auditoría (tercero, para registrar con información del usuario)
router.post('/campaigns', authenticateJWT, combinedAuditLogger, ...)

// 4. Controlador (último, para ejecutar la lógica de negocio)
router.post('/campaigns', authenticateJWT, combinedAuditLogger, controller.create)
```

## Testing

Todos los middlewares tienen tests completos:

- `auth.test.ts`: Tests unitarios para autenticación JWT
- `rate-limiter.test.ts`: Tests unitarios para rate limiting
- `audit-logger.test.ts`: Tests unitarios para logging de auditoría
- `input-sanitization.test.ts`: Property-based tests para sanitización

**Ejecutar tests**:
```bash
npm test shared/middleware
```

## Configuración

### Variables de Entorno

```bash
# JWT Secret (requerido)
JWT_SECRET=your-secret-key-here

# Log Level (opcional)
LOG_LEVEL=info
```

### Personalización

Puedes crear configuraciones personalizadas de rate limiting:

```typescript
import { createRateLimiter } from './shared/middleware'

const customLimiter = createRateLimiter({
  windowMs: 60000, // 1 minuto
  maxRequests: 50, // 50 requests
  message: 'Límite personalizado excedido',
  statusCode: 429
})
```

## Seguridad

### Sanitización de Inputs

El middleware de auditoría sanitiza automáticamente campos sensibles:
- `password` → `***REDACTED***`
- `token` → `***REDACTED***`
- `secret` → `***REDACTED***`
- `apiKey` → `***REDACTED***`
- `authorization` → `***REDACTED***`

### Prevención de Ataques

Los middlewares protegen contra:
- ✅ Ataques de fuerza bruta (rate limiting)
- ✅ Acceso no autorizado (autenticación JWT)
- ✅ Escalada de privilegios (validación de rol admin)
- ✅ Inyección SQL (sanitización en validators)
- ✅ XSS (sanitización en validators)
- ✅ Tokens expirados o inválidos
- ✅ Abuso de API (rate limiting)

## Monitoreo

Los logs de auditoría se integran con el stack ELK para monitoreo:

```json
{
  "timestamp": "2025-01-15T10:00:00Z",
  "level": "info",
  "service": "campaign-manager-service",
  "type": "audit",
  "operation": "create_campaign",
  "userId": "admin-123",
  "userEmail": "admin@technovastore.com",
  "method": "POST",
  "path": "/api/campaigns",
  "statusCode": 201,
  "responseTime": 125
}
```

## Referencias

- Requirements: 7.9, 10.8, 10.9, 10.10, 12.1
- Design Document: `.kiro/specs/campaign-manager-service/design.md`
- Property 38: Input Sanitization
