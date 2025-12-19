# Documento de Diseño - Hardening de Seguridad Completo

## Introducción

Este documento describe el diseño técnico para completar el hardening de seguridad en todos los microservicios restantes del proyecto TechNovaStore.

## Arquitectura General

### Principios de Diseño

1. **Fail Fast**: La aplicación debe fallar al inicio si la configuración es incorrecta
2. **Secure by Default**: No valores por defecto inseguros
3. **Consistency**: Todos los servicios deben seguir el mismo patrón de seguridad
4. **Structured Logging**: Usar Winston logger en lugar de console methods

## Componentes del Diseño

### 1. Validación de JWT_SECRET en api-gateway

**Ubicación**: `domains/platform/api-gateway/config/index.ts`

**Diseño Actual (Vulnerable)**:
```typescript
jwt: {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
},
```

**Diseño Nuevo (Seguro)**:
```typescript
// Validación al inicio del módulo
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('CRITICAL: JWT_SECRET environment variable is not set');
  throw new Error('JWT_SECRET must be configured. Application cannot start.');
}

if (JWT_SECRET.length < 32) {
  console.warn('WARNING: JWT_SECRET is shorter than 32 characters');
}

export const config = {
  jwt: {
    secret: JWT_SECRET,
  },
  // ...
};
```

### 2. Validación de JWT_SECRET en user-service

**Ubicación**: `domains/customer/user-service/config/index.ts`

**Diseño Actual (Vulnerable)**:
```typescript
jwt: {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  // ...
},
```

**Diseño Nuevo (Seguro)**:
```typescript
import { logger } from '../shared/utils/logger';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  logger.error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not set');
  throw new Error('JWT_SECRET must be configured. Application cannot start.');
}

if (JWT_SECRET.length < 32) {
  logger.warn('WARNING: JWT_SECRET is shorter than 32 characters');
}

export const config = {
  jwt: {
    secret: JWT_SECRET,
    // ...
  },
};
```

### 3. Validación de JWT_SECRET en payment-service

**Ubicación**: `domains/commerce/payment-service/config/index.ts`

**Diseño Nuevo (Seguro)**:
```typescript
import { logger } from '../shared/utils/logger';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  logger.error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not set');
  throw new Error('JWT_SECRET must be configured. Application cannot start.');
}

if (JWT_SECRET.length < 32) {
  logger.warn('WARNING: JWT_SECRET is shorter than 32 characters');
}
```

### 4. Validación de JWT_SECRET en auto-purchase-service

**Ubicación**: `domains/commerce/auto-purchase-service/shared/middleware/auth.ts`

**Diseño Actual (Vulnerable)**:
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
```

**Diseño Nuevo (Seguro)**:
```typescript
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  logger.error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not set');
  throw new Error('JWT_SECRET must be configured. Application cannot start.');
}

if (JWT_SECRET.length < 32) {
  logger.warn('WARNING: JWT_SECRET is shorter than 32 characters');
}
```

### 5. Validación de POSTGRES_PASSWORD en user-service

**Ubicación**: `domains/customer/user-service/config/index.ts`

**Diseño Actual (Vulnerable)**:
```typescript
postgresql: {
  password: process.env.POSTGRES_PASSWORD || 'postgres',
},
```

**Diseño Nuevo (Seguro)**:
```typescript
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;

if (!POSTGRES_PASSWORD) {
  logger.error('CRITICAL: POSTGRES_PASSWORD environment variable is not set');
  throw new Error('POSTGRES_PASSWORD must be configured. Application cannot start.');
}

export const config = {
  postgresql: {
    password: POSTGRES_PASSWORD,
  },
};
```

### 6. Validación de POSTGRES_PASSWORD en notification-service

**Ubicación**: `domains/customer/notification-service/index.ts`

**Diseño Actual (Vulnerable)**:
```typescript
const pool = new Pool({
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});
```

**Diseño Nuevo (Seguro)**:
```typescript
const dbPassword = process.env.POSTGRES_PASSWORD;

if (!dbPassword) {
  logger.error('CRITICAL: POSTGRES_PASSWORD environment variable is not set');
  throw new Error('POSTGRES_PASSWORD must be configured. Application cannot start.');
}

const pool = new Pool({
  password: dbPassword,
});
```

### 7. Validación de POSTGRES_PASSWORD en payment-service

**Ubicación**: `domains/commerce/payment-service/config/index.ts`

**Diseño Nuevo (Seguro)**:
```typescript
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;

if (!POSTGRES_PASSWORD) {
  logger.error('CRITICAL: POSTGRES_PASSWORD environment variable is not set');
  throw new Error('POSTGRES_PASSWORD must be configured. Application cannot start.');
}
```

### 8. Validación de POSTGRES_PASSWORD en campaign-manager-service

**Ubicación**: `domains/commerce/campaign-manager-service/shared/utils/database.ts`

**Diseño Actual (Vulnerable)**:
```typescript
const password = process.env.POSTGRES_PASSWORD || 'password'
```

**Diseño Nuevo (Seguro)**:
```typescript
const password = process.env.POSTGRES_PASSWORD

if (!password) {
  logger.error('CRITICAL: POSTGRES_PASSWORD environment variable is not set')
  throw new Error('POSTGRES_PASSWORD must be configured. Application cannot start.')
}
```

### 9. Reemplazo de console.log en product-service auth middleware

**Ubicación**: `domains/catalog/product-service/shared/middleware/auth.ts`

**Diseño Actual (7 instancias de console.log)**:
```typescript
console.log('[Auth] No se encontró token en cookie ni en Authorization header');
console.log('[Auth] Token encontrado en cookie');
console.log('[Auth] Token encontrado en Authorization header (fallback)');
console.log(`[Auth] Token decodificado: id=${decoded.id}, role=${decoded.role}`);
console.log(`[RequireRole] Verificando rol...`);
console.log('[RequireRole] No hay usuario en la petición');
console.log(`[RequireRole] Comparando...`);
```

**Diseño Nuevo (Seguro)**:
```typescript
import { logger } from '../utils/logger';

logger.warn('No token provided', { ip: req.ip, endpoint: req.path });
logger.debug('Token found in cookie');
logger.debug('Token found in Authorization header (fallback)');
logger.debug('Token decoded', { userId: decoded.id, role: decoded.role });
logger.debug('Verifying role', { user: req.user?.id, requiredRoles: roles });
logger.warn('No user in request', { endpoint: req.path });
logger.debug('Role comparison', { userRole: req.user?.role, requiredRoles: roles });
```

### 10. Reemplazo de console.log en shipment-tracker auth middleware

**Ubicación**: `domains/support/shipment-tracker/shared/middleware/auth.ts`

**Diseño Actual (2 instancias)**:
```typescript
console.error('Authentication error:', error);
console.warn('Unauthorized access attempt', {...});
```

**Diseño Nuevo (Seguro)**:
```typescript
logger.error('Authentication error', { error: error.message, ip: req.ip });
logger.warn('Unauthorized access attempt', { userId, userRole, requiredRoles, endpoint });
```

### 11. Reemplazo de console.log en campaign-manager-service auth middleware

**Ubicación**: `domains/commerce/campaign-manager-service/shared/middleware/auth.ts`

**Diseño Actual (2 instancias)**:
```typescript
console.error('Error en autenticación JWT:', error)
console.error('Error en autenticación JWT opcional:', error)
```

**Diseño Nuevo (Seguro)**:
```typescript
logger.error('Error en autenticación JWT', { error: error.message, ip: req.ip })
logger.error('Error en autenticación JWT opcional', { error: error.message })
```

## Correctness Properties

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas del sistema.*

### Property 1: JWT_SECRET obligatorio en todos los servicios

*Para cualquier* microservicio que requiere JWT_SECRET, si la variable no está configurada, el sistema debe fallar al iniciar con un error claro.

**Valida: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

### Property 2: POSTGRES_PASSWORD obligatorio en todos los servicios

*Para cualquier* microservicio que usa PostgreSQL, si POSTGRES_PASSWORD no está configurada, el sistema debe fallar al iniciar con un error claro.

**Valida: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

### Property 3: Logging estructurado en autenticación

*Para cualquier* evento de autenticación loggeado, el sistema debe usar logger estructurado con formato JSON, no console methods.

**Valida: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Testing Strategy

### Unit Tests

**Tests para JWT_SECRET obligatorio**:
```typescript
describe('JWT_SECRET validation', () => {
  it('should throw error if JWT_SECRET is not set', () => {
    delete process.env.JWT_SECRET;
    expect(() => require('./config')).toThrow('JWT_SECRET must be configured');
  });
});
```

### Manual Testing

**Verificación de JWT_SECRET**:
```bash
# Debe fallar si JWT_SECRET no está configurado
unset JWT_SECRET
docker-compose up api-gateway
# Debe mostrar error y no iniciar
```

**Verificación de POSTGRES_PASSWORD**:
```bash
# Debe fallar si POSTGRES_PASSWORD no está configurado
unset POSTGRES_PASSWORD
docker-compose up user-service
# Debe mostrar error y no iniciar
```

## Impacto en Despliegue

### Variables de Entorno Requeridas

Después de la implementación, estas variables son **OBLIGATORIAS** en todos los servicios:

```bash
# Autenticación (TODOS los servicios)
JWT_SECRET=<secret-seguro-de-al-menos-32-caracteres>

# Base de datos (servicios que usan PostgreSQL)
POSTGRES_PASSWORD=<contraseña-segura>
```

### Servicios Afectados

- api-gateway (JWT_SECRET, REDIS_PASSWORD, logging)
- user-service (JWT_SECRET, POSTGRES_PASSWORD)
- payment-service (JWT_SECRET, POSTGRES_PASSWORD)
- auto-purchase-service (JWT_SECRET)
- notification-service (POSTGRES_PASSWORD, logging)
- campaign-manager-service (POSTGRES_PASSWORD, logging)
- product-service (logging en auth middleware)
- shipment-tracker (logging en auth middleware e index.ts)
- chatbot-service (logging)
- sync-engine (logging)
- shared/infrastructure/config (JWT_SECRET, JWT_REFRESH_SECRET, POSTGRES_PASSWORD)

### 12. Logger Condicional para Frontend

**Ubicación**: `domains/platform/frontend/src/shared/lib/logger.ts`

**Diseño**:
```typescript
/**
 * Logger condicional para el frontend
 * Solo loguea en desarrollo, no en producción
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  error: (...args: unknown[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
    // En producción, podríamos enviar a un servicio de monitoreo como Sentry
  },
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
};

export default logger;
```

### Resumen de Cambios

| Servicio | JWT_SECRET | POSTGRES_PASSWORD | JWT_REFRESH_SECRET | REDIS_PASSWORD | console.log |
|----------|------------|-------------------|-------------------|----------------|-------------|
| api-gateway | ✅ | - | - | ✅ | - |
| user-service | ✅ | ✅ | - | - | - |
| payment-service | ✅ | ✅ | - | - | - |
| auto-purchase-service | ✅ | - | - | - | - |
| notification-service | - | ✅ | - | - | ✅ |
| campaign-manager-service | - | ✅ | - | - | ✅ |
| product-service | - | - | - | - | ✅ |
| shipment-tracker | - | - | - | - | ✅ |
| chatbot-service | - | - | - | - | ✅ |
| sync-engine | - | - | - | - | ✅ |
| shared/infrastructure | ✅ | ✅ | ✅ | - | - |
| frontend (servicios) | - | - | - | - | ✅ |
| frontend (API routes) | - | - | - | - | ✅ |
| frontend (componentes) | - | - | - | - | ✅ |
