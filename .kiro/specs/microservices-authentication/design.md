# Documento de Diseño - Correcciones de Seguridad

## Introducción

Este documento describe el diseño técnico para implementar las correcciones de seguridad identificadas en la auditoría del 15 de diciembre de 2025. El diseño se basa en el middleware de autenticación existente en `user-service` y lo extiende a los demás microservicios.

## Arquitectura General

### Diagrama de Flujo de Autenticación

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────┐
│   Cliente   │────▶│ API Gateway │────▶│  Microservicio   │
│  (Browser)  │     │  (Puerto    │     │  (payment, etc)  │
│             │     │   3000)     │     │                  │
└─────────────┘     └─────────────┘     └──────────────────┘
      │                    │                      │
      │                    │                      │
      │ 1. Request con     │ 2. Gateway valida   │ 3. Microservicio
      │    cookie httpOnly │    token y añade    │    valida token
      │                    │    headers          │    nuevamente
      │                    │    (x-user-id,      │    (Defense in Depth)
      │                    │     x-user-role)    │
      │                    │                      │
      │                    │ 4. Si válido,       │ 5. Procesa request
      │                    │    forward request  │    y retorna respuesta
      │                    │                      │
      └────────────────────┴──────────────────────┘
```

### Principio de Defense in Depth

Aunque el API Gateway ya valida tokens, cada microservicio debe:
1. **Validar el token JWT** independientemente
2. **Verificar permisos** según el rol del usuario
3. **Verificar propiedad** de los recursos solicitados
4. **Loggear intentos fallidos** para detectar ataques

Esto protege contra:
- Bypass del API Gateway
- Ataques internos
- Misconfiguraciones de red
- Acceso directo a microservicios

## Componentes del Diseño

### 1. Middleware de Autenticación Compartido

**Ubicación**: `shared/middleware/auth.ts` (en cada servicio)

**Responsabilidades**:
- Extraer token JWT de cookies httpOnly o Authorization header
- Validar token con JWT_SECRET
- Extraer información del usuario (id, email, role)
- Manejar errores de token (expirado, inválido, malformado)
- Loggear intentos de autenticación fallidos

**Interfaz**:
```typescript
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

function authMiddleware(
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): void;

function requireRole(roles: string[]): Middleware;
```

**Flujo de Validación**:
1. Verificar si vienen headers del API Gateway (`x-user-id`, `x-user-role`)
2. Si vienen headers, confiar en ellos (ya validados por gateway)
3. Si no vienen headers, extraer token de cookie/header
4. Validar token con `jwt.verify()`
5. Extraer payload y añadir a `req.user`
6. Continuar con `next()` o retornar error 401

### 2. Middleware de Autorización por Rol

**Ubicación**: `shared/middleware/auth.ts` (función `requireRole`)

**Responsabilidades**:
- Verificar que el usuario tiene el rol requerido
- Retornar 403 Forbidden si no tiene permisos
- Loggear intentos de acceso no autorizado

**Uso**:
```typescript
// Endpoint solo para admins
router.get('/metrics', authMiddleware, requireRole(['admin']), handler);

// Endpoint para admins y moderadores
router.post('/tickets/assign', authMiddleware, requireRole(['admin', 'moderator']), handler);
```

### 3. Verificación de Propiedad de Recursos

**Ubicación**: Dentro de cada handler de endpoint

**Responsabilidades**:
- Verificar que el usuario es dueño del recurso solicitado
- Permitir acceso a admins sin restricciones
- Retornar 403 Forbidden si no es el dueño

**Patrón de Implementación**:
```typescript
async function getTicketHandler(req: AuthenticatedRequest, res: Response) {
  const ticketId = req.params.id;
  const userId = req.user!.id;
  const userRole = req.user!.role;
  
  const ticket = await Ticket.findById(ticketId);
  
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  
  // Verificar propiedad (admins pueden ver todo)
  if (ticket.user_id !== userId && userRole !== 'admin') {
    logger.warn(`User ${userId} attempted to access ticket ${ticketId} owned by ${ticket.user_id}`);
    return res.status(403).json({ error: 'Access denied' });
  }
  
  return res.json(ticket);
}
```

### 4. Validación de Redirecciones en Frontend

**Ubicación**: `domains/platform/frontend/src/shared/utils/urlValidation.ts`

**Responsabilidades**:
- Validar que URLs de redirección son internas
- Bloquear redirecciones a dominios externos
- Loggear intentos de redirección maliciosa

**Implementación**:
```typescript
/**
 * Valida que una URL es interna al dominio actual
 * @param url - URL a validar (puede ser relativa o absoluta)
 * @returns true si la URL es interna, false si es externa
 */
export function isValidInternalUrl(url: string): boolean {
  try {
    // URLs relativas son siempre válidas
    if (url.startsWith('/')) {
      return true;
    }
    
    // Parsear URL absoluta
    const parsed = new URL(url, window.location.origin);
    
    // Verificar que el origin coincide
    return parsed.origin === window.location.origin;
  } catch (error) {
    // Si no se puede parsear, es inválida
    console.warn('Invalid URL format:', url);
    return false;
  }
}

/**
 * Redirige de forma segura a una URL validada
 * @param url - URL de destino
 * @param fallback - URL de fallback si la validación falla (default: '/')
 */
export function safeRedirect(url: string, fallback: string = '/'): void {
  if (isValidInternalUrl(url)) {
    window.location.href = url;
  } else {
    console.warn('Blocked redirect to external URL:', url);
    window.location.href = fallback;
  }
}
```

**Uso en NotificationCenter**:
```typescript
// ANTES (vulnerable):
window.location.href = notification.action_url;

// DESPUÉS (seguro):
import { safeRedirect } from '@/shared/utils/urlValidation';
safeRedirect(notification.action_url);
```

### 5. Manejo Seguro de JSON.parse()

**Ubicación**: Donde se use `JSON.parse()` con datos externos

**Responsabilidades**:
- Envolver `JSON.parse()` en try-catch
- Loggear errores de parsing con contexto
- Retornar valor por defecto seguro
- No exponer errores al usuario

**Patrón de Implementación**:
```typescript
/**
 * Parsea JSON de forma segura
 * @param jsonString - String JSON a parsear
 * @param defaultValue - Valor por defecto si falla el parsing
 * @param context - Contexto para logging (ej: 'OllamaAdapter.parseResponse')
 * @returns Objeto parseado o valor por defecto
 */
function safeJsonParse<T>(
  jsonString: string, 
  defaultValue: T, 
  context: string
): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    logger.error(`JSON parse error in ${context}:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      jsonPreview: jsonString.substring(0, 100), // Solo primeros 100 chars
    });
    return defaultValue;
  }
}
```

**Uso en OllamaAdapter**:
```typescript
// ANTES (vulnerable):
const data: OllamaResponse = JSON.parse(line);

// DESPUÉS (seguro):
const data = safeJsonParse<OllamaResponse>(
  line, 
  { done: true, response: '' }, // valor por defecto
  'OllamaAdapter.parseStreamLine'
);

if (!data.done) {
  // Procesar respuesta...
}
```

## Diseño por Servicio

### payment-service (Prioridad CRÍTICA)

**Endpoints a proteger**:
- `POST /payments/process` - Requiere autenticación + verificar que el order pertenece al usuario
- `POST /payments/refund` - Requiere autenticación + rol admin
- `GET /payments/status/:id` - Requiere autenticación + verificar propiedad
- `POST /payments/verify` - Requiere autenticación

**Cambios necesarios**:
1. Crear `shared/middleware/auth.ts` (copiar de user-service)
2. Modificar `api/routes.ts` para añadir middleware a todas las rutas
3. Añadir verificación de propiedad en handlers de `process-payment/` y `get-payment-status/`
4. Añadir `requireRole(['admin'])` en `process-refund/`

**Estructura de archivos**:
```
domains/commerce/payment-service/
├── shared/
│   ├── middleware/
│   │   └── auth.ts          # NUEVO
│   └── utils/
│       └── logger.ts        # Existente
├── api/
│   └── routes.ts            # MODIFICAR
├── process-payment/
│   └── ProcessPayment.ts    # MODIFICAR (añadir verificación)
├── process-refund/
│   └── ProcessRefund.ts     # MODIFICAR (verificar rol admin)
└── get-payment-status/
    └── GetPaymentStatus.ts  # MODIFICAR (añadir verificación)
```

### ticket-service (Prioridad Alta)

**Endpoints a proteger**:
- `POST /tickets` - Requiere autenticación
- `GET /tickets` - Requiere autenticación + filtrar por userId
- `GET /tickets/:id` - Requiere autenticación + verificar propiedad
- `PUT /tickets/:id` - Requiere autenticación + verificar propiedad
- `GET /tickets/metrics` - Requiere autenticación + rol admin

**Cambios necesarios**:
1. Crear `shared/middleware/auth.ts`
2. Modificar `api/routes.ts`
3. Añadir verificación de propiedad en todos los handlers
4. Añadir `requireRole(['admin'])` en endpoints de métricas

### notification-service (Prioridad Alta)

**Endpoints a proteger**:
- `POST /notifications` - Requiere autenticación + verificar permiso para enviar al target_user
- `GET /notifications` - Requiere autenticación + filtrar por userId
- `PUT /notifications/:id/read` - Requiere autenticación + verificar propiedad
- `DELETE /notifications/:id` - Requiere autenticación + verificar propiedad

**Cambios necesarios**:
1. Crear `shared/middleware/auth.ts`
2. Modificar `api/routes.ts`
3. Añadir verificación de propiedad en todos los handlers
4. En `create-user-notification/`, verificar que el usuario puede enviar notificaciones al target

### shipment-tracker (Prioridad Alta)

**Endpoints a proteger**:
- `GET /shipments/:orderId` - Requiere autenticación + verificar que el order pertenece al usuario
- `POST /shipments/track` - Requiere autenticación + verificar propiedad del order

**Cambios necesarios**:
1. Crear `shared/middleware/auth.ts`
2. Modificar `api/routes.ts`
3. Añadir verificación de propiedad consultando el order-service

### recommender-service (Prioridad Media)

**Endpoints a proteger**:
- `GET /recommendations/user/:userId` - Requiere autenticación + verificar que userId coincide
- `POST /recommendations/interaction` - Requiere autenticación

**Endpoints públicos** (sin autenticación):
- `GET /recommendations/trending` - Público

**Cambios necesarios**:
1. Crear `shared/middleware/auth.ts`
2. Modificar `api/routes.ts` - aplicar middleware solo a endpoints privados
3. Añadir verificación de userId en `get-user-recommendations/`

## Correctness Properties

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas del sistema.*

### Property 1: Token inválido siempre rechazado

*Para cualquier* request con token JWT inválido, expirado o malformado, el sistema debe retornar HTTP 401 Unauthorized y no procesar el request.

**Valida: Requirements 1.2, 2.2, 3.2, 4.2, 5.2**

### Property 2: Usuario solo accede a sus recursos

*Para cualquier* recurso con dueño (ticket, notification, payment, shipment), un usuario no-admin solo puede acceder si es el dueño del recurso.

**Valida: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**

### Property 3: Admin accede a todos los recursos

*Para cualquier* recurso del sistema, un usuario con rol 'admin' puede acceder sin restricciones de propiedad.

**Valida: Requirements 8.7**

### Property 4: Endpoints admin solo para admins

*Para cualquier* endpoint marcado como admin-only, solo usuarios con rol 'admin' pueden acceder, otros reciben HTTP 403 Forbidden.

**Valida: Requirements 1.4, 3.4, 7.1, 7.2**

### Property 5: Redirección externa bloqueada

*Para cualquier* URL de redirección que apunte a un dominio externo, el sistema debe bloquear la redirección y loggear el intento.

**Valida: Requirements 10.2, 10.3**

### Property 6: JSON inválido no causa crash

*Para cualquier* string JSON inválido parseado desde fuentes externas, el sistema debe retornar un valor por defecto y loggear el error, sin causar crash de la aplicación.

**Valida: Requirements 11.1, 11.2, 11.3**

## Manejo de Errores

### Códigos de Estado HTTP

| Código | Significado | Cuándo usar |
|--------|-------------|-------------|
| 401 Unauthorized | Token inválido/ausente | Fallo de autenticación |
| 403 Forbidden | Sin permisos | Usuario autenticado pero sin permisos |
| 404 Not Found | Recurso no existe | Recurso no encontrado (después de verificar permisos) |
| 500 Internal Server Error | Error del servidor | Error inesperado en validación |

### Formato de Respuestas de Error

```typescript
// Error de autenticación
{
  "error": "Access denied. No token provided."
}

// Error de autorización
{
  "error": "Insufficient permissions"
}

// Error de propiedad
{
  "error": "Access denied"
}

// NUNCA revelar detalles:
// ❌ "User 123 does not own ticket 456"
// ✅ "Access denied"
```

### Logging de Eventos de Seguridad

```typescript
// Intento de autenticación fallido
logger.warn('Authentication failed', {
  ip: req.ip,
  endpoint: req.path,
  reason: 'invalid_token',
});

// Intento de acceso no autorizado
logger.warn('Unauthorized access attempt', {
  userId: req.user.id,
  resource: 'ticket',
  resourceId: ticketId,
  endpoint: req.path,
});

// Redirección bloqueada
logger.warn('Blocked external redirect', {
  attemptedUrl: url,
  userId: currentUserId,
});
```

## Integración con Infraestructura Existente

### Variables de Entorno

Todos los servicios ya tienen acceso a:
- `JWT_SECRET` - Definido en `.env.shared`
- `NODE_ENV` - Definido en docker-compose

No se requieren cambios en variables de entorno.

### Dependencias

Todos los servicios ya tienen instalado:
- `jsonwebtoken` - Para validar tokens JWT
- `express` - Framework web
- `winston` - Para logging

No se requieren nuevas dependencias.

### Docker Compose

No se requieren cambios en `docker-compose.optimized.yml`. Los servicios ya tienen:
- Acceso a variables de entorno compartidas
- Red interna para comunicación entre servicios
- Volúmenes para hot-reload en desarrollo

## Consideraciones de Rendimiento

### Validación de Token

- **Costo**: ~1-2ms por request (validación JWT)
- **Impacto**: Mínimo, aceptable para seguridad
- **Optimización**: El API Gateway ya valida, microservicios pueden confiar en headers `x-user-id`

### Consultas de Propiedad

- **Costo**: 1 query adicional a BD por request (verificar owner)
- **Impacto**: Bajo, queries simples por ID
- **Optimización**: Usar índices en campos `user_id` y `owner_id`

### Logging

- **Costo**: ~0.5ms por log
- **Impacto**: Mínimo
- **Optimización**: Logs asíncronos con Winston (ya implementado)

## Migración y Compatibilidad

### Compatibilidad hacia atrás

- ✅ Los cambios son **compatibles hacia atrás**
- ✅ Endpoints existentes siguen funcionando
- ✅ Solo se añade validación adicional
- ✅ No se cambian interfaces públicas

### Despliegue Gradual

1. Desplegar payment-service con autenticación
2. Verificar que funciona correctamente
3. Desplegar ticket-service
4. Continuar con los demás servicios uno por uno

### Rollback

Si un servicio falla después de añadir autenticación:
```bash
# Revertir al commit anterior
git revert HEAD

# Reconstruir servicio
docker-compose -f docker-compose.optimized.yml up -d --build <service-name>
```

## Próximos Pasos

Después de implementar estas correcciones, considerar:

1. **Rate Limiting por usuario**: Prevenir brute force
2. **Audit logs centralizados**: Enviar eventos de seguridad a Elasticsearch
3. **Alertas automáticas**: Notificar intentos de acceso sospechosos
4. **2FA para operaciones críticas**: Requerir segundo factor para refunds
5. **IP whitelisting**: Restringir acceso a endpoints admin por IP

Estas mejoras están fuera del alcance actual pero son recomendadas para el futuro.
