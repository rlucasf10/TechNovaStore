# Documento de Diseño - Hardening de Seguridad 10/10

## Introducción

Este documento describe el diseño técnico para implementar las correcciones de seguridad identificadas en la auditoría exhaustiva del 16 de diciembre de 2025. El objetivo es alcanzar una puntuación de seguridad de 10/10.

**Puntuación Actual**: 9.5/10  
**Puntuación Objetivo**: 10/10  
**Tiempo Estimado**: 1 hora (Fase 1) + 4-5 horas (Fase 2 opcional)

## Arquitectura General

### Principios de Diseño

1. **Fail Fast**: La aplicación debe fallar al inicio si la configuración es incorrecta
2. **Secure by Default**: No valores por defecto inseguros
3. **Defense in Depth**: Múltiples capas de seguridad
4. **Least Privilege**: Acceso mínimo necesario
5. **Audit Everything**: Loggear todos los eventos de seguridad

### Diagrama de Flujo de Validación de Configuración

```
┌─────────────────┐
│  App Startup    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Verify Config   │
│ - JWT_SECRET    │
│ - DB_PASSWORD   │
│ - Required Vars │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│ Valid │ │Invalid│
└───┬───┘ └───┬───┘
    │         │
    │         ▼
    │    ┌────────┐
    │    │  Log   │
    │    │ Error  │
    │    └───┬────┘
    │        │
    │        ▼
    │    ┌────────┐
    │    │  Exit  │
    │    │ Code 1 │
    │    └────────┘
    │
    ▼
┌────────┐
│  Start │
│Services│
└────────┘
```

## Componentes del Diseño

### 1. Validación de JWT_SECRET Obligatorio

**Ubicación**: Middleware de autenticación en cada servicio

**Diseño Actual (Vulnerable)**:
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'default-insecure-secret';
```

**Diseño Nuevo (Seguro)**:
```typescript
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  logger.error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not set');
  logger.error('JWT_SECRET is required for secure authentication');
  logger.error('Please set JWT_SECRET in your environment or .env file');
  logger.error('Example: JWT_SECRET=your-super-secret-key-at-least-32-characters');
  throw new Error('JWT_SECRET must be configured. Application cannot start.');
}

if (JWT_SECRET.length < 32) {
  logger.warn('WARNING: JWT_SECRET is shorter than 32 characters');
  logger.warn('For production, use a secret of at least 32 characters');
}
```

**Beneficios**:
- ✅ Imposible iniciar con secreto inseguro
- ✅ Error claro con instrucciones
- ✅ Validación de longitud mínima
- ✅ Logging apropiado

**Servicios a Modificar**:
1. `chatbot-service/shared/middleware/auth.ts`
2. `notification-service/shared/middleware/auth.ts`
3. `ticket-service/config/index.ts`


### 2. Protección de Endpoints Administrativos

**Ubicación**: `campaign-manager-service/api/routes.ts`

**Diseño Actual (Vulnerable)**:
```typescript
// NOTA TEMPORAL: Endpoint público
router.get('/campaigns', (req, res) => controller.list(req, res))
router.get('/campaigns/:id', (req, res) => controller.getById(req, res))
```

**Diseño Nuevo (Seguro)**:
```typescript
// ✅ SEGURIDAD: Endpoints administrativos requieren autenticación
router.get('/campaigns', authenticateJWT, (req, res) => controller.list(req, res))
router.get('/campaigns/:id', authenticateJWT, (req, res) => controller.getById(req, res))
```

**Flujo de Autenticación**:
```
Request → authenticateJWT → Verify Token → Extract User → Controller
                ↓
            No Token
                ↓
          Return 401
```

**Beneficios**:
- ✅ Solo usuarios autenticados pueden ver campañas
- ✅ Protege información de negocio sensible
- ✅ Consistente con otros endpoints del servicio

### 3. Protección de Endpoints de Categorías

**Ubicación**: `product-service/api/routes/categoryRoutes.ts`

**Diseño Actual (Vulnerable)**:
```typescript
// Sin autenticación ni autorización
categoryRoutes.post('/', CategoryController.createCategory);
categoryRoutes.put('/:id', CategoryController.updateCategory);
categoryRoutes.delete('/:id', CategoryController.deleteCategory);
```

**Diseño Nuevo (Seguro)**:
```typescript
import { authMiddleware, requireRole } from '../../shared/middleware/auth';

// ✅ SEGURIDAD: Solo admins pueden modificar categorías
categoryRoutes.post('/', 
  authMiddleware, 
  requireRole(['admin']), 
  CategoryController.createCategory
);

categoryRoutes.put('/:id', 
  authMiddleware, 
  requireRole(['admin']), 
  CategoryController.updateCategory
);

categoryRoutes.delete('/:id', 
  authMiddleware, 
  requireRole(['admin']), 
  CategoryController.deleteCategory
);
```

**Flujo de Autorización**:
```
Request → authMiddleware → requireRole(['admin']) → Controller
            ↓                      ↓
        No Token              Not Admin
            ↓                      ↓
       Return 401            Return 403
```

**Beneficios**:
- ✅ Solo admins pueden crear/modificar/eliminar categorías
- ✅ Previene manipulación del catálogo
- ✅ Logging de intentos no autorizados

### 4. Logger Estructurado

**Patrón de Reemplazo**:

**Antes (Vulnerable)**:
```typescript
console.log(`[Auth] Usuario autenticado: ${decoded.id} (${decoded.role})`);
console.error('[Auth] JWT_SECRET no está configurado');
console.warn(`Unauthorized access: User ${userId} tried to access ${resource}`);
```

**Después (Seguro)**:
```typescript
import { logger } from '../utils/logger';

logger.info('Usuario autenticado', { 
  userId: decoded.id, 
  role: decoded.role 
});

logger.error('JWT_SECRET no configurado', {
  service: 'auth-middleware',
  critical: true
});

logger.warn('Intento de acceso no autorizado', { 
  userId, 
  resource,
  ip: req.ip,
  endpoint: req.path
});
```

**Estructura de Log**:
```json
{
  "timestamp": "2025-12-16T10:30:00.000Z",
  "level": "warn",
  "message": "Intento de acceso no autorizado",
  "userId": "user-123",
  "resource": "order-456",
  "ip": "192.168.1.1",
  "endpoint": "/api/orders/456",
  "service": "order-service"
}
```

**Beneficios**:
- ✅ Logs estructurados y parseables
- ✅ Fácil filtrado y búsqueda
- ✅ No expone información sensible
- ✅ Incluye contexto relevante


### 5. Validación de Contraseñas Obligatorias

**Ubicación**: Configuración de base de datos

**Diseño Actual (Vulnerable)**:
```typescript
const pool = new Pool({
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  // ...
});
```

**Diseño Nuevo (Seguro)**:
```typescript
const dbPassword = process.env.POSTGRES_PASSWORD;

if (!dbPassword) {
  logger.error('CRITICAL: POSTGRES_PASSWORD environment variable is not set');
  logger.error('Database password is required for secure connection');
  logger.error('Please set POSTGRES_PASSWORD in your environment or .env file');
  throw new Error('POSTGRES_PASSWORD must be configured. Application cannot start.');
}

const pool = new Pool({
  password: dbPassword,
  // ...
});
```

**Beneficios**:
- ✅ Imposible conectar con contraseña insegura
- ✅ Error claro al inicio
- ✅ Previene configuraciones inseguras

### 6. Validación de Entrada

**Patrón de Implementación**:

```typescript
import { param, query, body, validationResult } from 'express-validator';

// Middleware de validación
const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// Uso en rutas
router.get('/:orderNumber',
  authMiddleware,
  param('orderNumber')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Order number is required')
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('Invalid order number format'),
  validateRequest,
  controller.getTrackingInfo
);
```

**Validaciones Comunes**:
- `isString()`: Verificar que es string
- `trim()`: Eliminar espacios
- `notEmpty()`: No vacío
- `isEmail()`: Formato de email
- `isUUID()`: Formato UUID
- `matches(regex)`: Patrón específico
- `isInt()`: Número entero
- `isLength({ min, max })`: Longitud

**Beneficios**:
- ✅ Rechaza datos inválidos temprano
- ✅ Mensajes de error descriptivos
- ✅ Previene inyección de datos maliciosos
- ✅ Mejora robustez del sistema

### 7. Rate Limiting en Microservicios

**Implementación**:

```typescript
import rateLimit from 'express-rate-limit';

// Configuración de rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: {
    error: 'Too many requests from this IP',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  skip: (req) => {
    // Excluir health checks
    return req.path === '/health' || req.path === '/metrics';
  },
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      endpoint: req.path,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: '15 minutes'
    });
  }
});

// Aplicar a todas las rutas API
app.use('/api/', apiLimiter);
```

**Configuración por Servicio**:
- Servicios públicos (product, recommender): 200 req/15min
- Servicios autenticados (order, payment): 100 req/15min
- Servicios admin (campaign, sync): 50 req/15min

**Beneficios**:
- ✅ Protección contra DoS
- ✅ Previene brute force
- ✅ Reduce carga del servidor
- ✅ Headers informativos para clientes

### 8. SQL Logging Estructurado

**Ubicación**: `shipment-tracker/config/database.ts`

**Diseño Actual**:
```typescript
logging: config.nodeEnv === 'development' ? console.log : false,
```

**Diseño Nuevo**:
```typescript
import { logger } from '../shared/utils/logger';

logging: config.nodeEnv === 'development' ? 
  (sql: string, timing?: number) => {
    logger.debug('SQL Query', { 
      sql: sql.substring(0, 200), // Limitar longitud
      timing,
      service: 'shipment-tracker'
    });
  } : 
  false,
```

**Beneficios**:
- ✅ Logs estructurados
- ✅ Incluye timing de queries
- ✅ Limita longitud para no saturar logs
- ✅ Solo en desarrollo


### 9. Verificación de Configuración al Inicio

**Implementación**:

```typescript
// shared/utils/configValidator.ts

interface RequiredConfig {
  name: string;
  envVar: string;
  validator?: (value: string) => boolean;
  minLength?: number;
}

export class ConfigValidator {
  private requiredVars: RequiredConfig[] = [];
  private errors: string[] = [];
  private warnings: string[] = [];

  addRequired(config: RequiredConfig): this {
    this.requiredVars.push(config);
    return this;
  }

  validate(): void {
    logger.info('Validating configuration...');

    for (const config of this.requiredVars) {
      const value = process.env[config.envVar];

      if (!value) {
        this.errors.push(
          `${config.name} (${config.envVar}) is required but not set`
        );
        continue;
      }

      if (config.minLength && value.length < config.minLength) {
        this.warnings.push(
          `${config.name} is shorter than recommended (${value.length} < ${config.minLength})`
        );
      }

      if (config.validator && !config.validator(value)) {
        this.errors.push(
          `${config.name} has invalid format`
        );
      }
    }

    if (this.errors.length > 0) {
      logger.error('Configuration validation failed:');
      this.errors.forEach(err => logger.error(`  - ${err}`));
      logger.error('\nPlease check your .env file or environment variables');
      throw new Error('Invalid configuration. Application cannot start.');
    }

    if (this.warnings.length > 0) {
      logger.warn('Configuration warnings:');
      this.warnings.forEach(warn => logger.warn(`  - ${warn}`));
    }

    logger.info('Configuration validation passed ✓');
  }
}

// Uso en cada servicio
const validator = new ConfigValidator();

validator
  .addRequired({
    name: 'JWT Secret',
    envVar: 'JWT_SECRET',
    minLength: 32
  })
  .addRequired({
    name: 'Database Password',
    envVar: 'POSTGRES_PASSWORD',
    minLength: 8
  })
  .addRequired({
    name: 'Database Host',
    envVar: 'POSTGRES_HOST'
  })
  .validate();
```

**Beneficios**:
- ✅ Validación centralizada
- ✅ Errores claros y agrupados
- ✅ Warnings para configuraciones subóptimas
- ✅ Fácil de extender

## Correctness Properties

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas del sistema.*

### Property 1: Configuración obligatoria

*Para cualquier* servicio que requiere JWT_SECRET, si la variable no está configurada, el sistema debe fallar al iniciar con un error claro.

**Valida: Requirements 1.1, 1.3, 1.4**

### Property 2: Autenticación en endpoints administrativos

*Para cualquier* request a endpoints administrativos sin token válido, el sistema debe retornar HTTP 401 Unauthorized.

**Valida: Requirements 2.1, 2.2, 2.3, 3.1, 3.2, 3.5**

### Property 3: Autorización por rol

*Para cualquier* request a endpoints que requieren rol admin, si el usuario no tiene ese rol, el sistema debe retornar HTTP 403 Forbidden.

**Valida: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 4: Logging estructurado

*Para cualquier* evento de seguridad loggeado, el sistema debe usar logger estructurado con formato JSON, no console methods.

**Valida: Requirements 4.1, 4.2, 4.3**

### Property 5: Validación de entrada

*Para cualquier* request con parámetros inválidos, el sistema debe retornar HTTP 400 Bad Request antes de procesar.

**Valida: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 6: Rate limiting

*Para cualquier* IP que excede el límite de requests, el sistema debe retornar HTTP 429 Too Many Requests.

**Valida: Requirements 7.1, 7.2, 7.3**

## Manejo de Errores

### Códigos de Estado HTTP

| Código | Significado | Cuándo usar |
|--------|-------------|-------------|
| 400 Bad Request | Validación falló | Parámetros inválidos |
| 401 Unauthorized | Sin autenticación | Token ausente/inválido |
| 403 Forbidden | Sin autorización | Usuario sin permisos |
| 429 Too Many Requests | Rate limit excedido | Demasiados requests |
| 500 Internal Server Error | Error del servidor | Error de configuración |

### Formato de Respuestas de Error

```typescript
// Error de configuración (startup)
{
  "error": "Configuration Error",
  "message": "JWT_SECRET must be configured",
  "instructions": "Set JWT_SECRET in your .env file"
}

// Error de autenticación
{
  "error": "Access denied. No token provided."
}

// Error de autorización
{
  "error": "Insufficient permissions"
}

// Error de validación
{
  "error": "Validation failed",
  "details": [
    {
      "field": "orderNumber",
      "message": "Order number is required"
    }
  ]
}

// Error de rate limit
{
  "error": "Too many requests",
  "retryAfter": "15 minutes"
}
```

### Logging de Eventos de Seguridad

```typescript
// Configuración faltante
logger.error('CRITICAL: JWT_SECRET not configured', {
  service: 'auth-middleware',
  critical: true,
  action: 'application_exit'
});

// Autenticación fallida
logger.warn('Authentication failed', {
  reason: 'no_token',
  ip: req.ip,
  endpoint: req.path,
  userAgent: req.get('User-Agent')
});

// Autorización fallida
logger.warn('Authorization failed', {
  userId: req.user.id,
  userRole: req.user.role,
  requiredRole: 'admin',
  endpoint: req.path,
  action: 'access_denied'
});

// Rate limit excedido
logger.warn('Rate limit exceeded', {
  ip: req.ip,
  endpoint: req.path,
  limit: 100,
  window: '15 minutes'
});
```

## Integración con Infraestructura Existente

### Variables de Entorno

**Nuevas variables obligatorias**:
- `JWT_SECRET`: Mínimo 32 caracteres
- `POSTGRES_PASSWORD`: Mínimo 8 caracteres

**Variables existentes**:
- Todas las demás variables mantienen su configuración actual

### Dependencias

**Nuevas dependencias**:
```json
{
  "express-rate-limit": "^6.10.0",
  "express-validator": "^7.0.1"
}
```

**Dependencias existentes**:
- `jsonwebtoken`: Ya instalado
- `winston`: Ya instalado
- `express`: Ya instalado

### Docker Compose

**Cambios requeridos en `.env`**:
```bash
# Añadir o verificar estas variables
JWT_SECRET=your-super-secret-key-at-least-32-characters-long
POSTGRES_PASSWORD=your-secure-database-password
```

**No se requieren cambios en**:
- `docker-compose.optimized.yml`
- Dockerfiles
- Configuración de red


## Consideraciones de Rendimiento

### Impacto de Rate Limiting

- **Overhead**: ~0.1ms por request (verificación en memoria)
- **Memoria**: ~1KB por IP tracked
- **Impacto**: Mínimo, aceptable para seguridad

### Impacto de Validación de Entrada

- **Overhead**: ~0.5ms por request (validación con express-validator)
- **Impacto**: Mínimo, mejora robustez

### Impacto de Logging Estructurado

- **Overhead**: ~0.2ms por log (Winston asíncrono)
- **Impacto**: Mínimo, logs más útiles

### Impacto de Verificación de Configuración

- **Overhead**: ~10ms al inicio (una sola vez)
- **Impacto**: Ninguno en runtime

## Migración y Compatibilidad

### Compatibilidad hacia atrás

- ✅ Los cambios son **compatibles hacia atrás**
- ✅ Endpoints existentes siguen funcionando
- ✅ Solo se añade validación adicional
- ⚠️ **BREAKING CHANGE**: Requiere configurar JWT_SECRET y POSTGRES_PASSWORD

### Estrategia de Despliegue

**Fase 1 - Preparación**:
1. Configurar JWT_SECRET en todos los entornos
2. Configurar POSTGRES_PASSWORD en todos los entornos
3. Verificar que variables están disponibles

**Fase 2 - Despliegue de Código**:
1. Desplegar cambios de JWT_SECRET (3 servicios)
2. Desplegar cambios de endpoints (2 servicios)
3. Verificar que servicios inician correctamente

**Fase 3 - Verificación**:
1. Probar autenticación en endpoints protegidos
2. Verificar logs estructurados
3. Verificar rate limiting

**Fase 4 - Mejoras Opcionales** (si se implementa Fase 2):
1. Desplegar cambios de logging
2. Desplegar validación de entrada
3. Desplegar rate limiting en todos los servicios

### Rollback

Si algo falla:

```bash
# Revertir cambios de código
git revert HEAD

# Reconstruir servicios afectados
docker-compose -f docker-compose.optimized.yml up -d --build <service>

# Verificar que servicios funcionan
docker-compose -f docker-compose.optimized.yml ps
docker-compose -f docker-compose.optimized.yml logs <service>
```

## Testing Strategy

### Unit Tests

**Tests para JWT_SECRET obligatorio**:
```typescript
describe('JWT_SECRET validation', () => {
  it('should throw error if JWT_SECRET is not set', () => {
    delete process.env.JWT_SECRET;
    expect(() => require('./auth')).toThrow('JWT_SECRET must be configured');
  });

  it('should warn if JWT_SECRET is too short', () => {
    process.env.JWT_SECRET = 'short';
    const spy = jest.spyOn(logger, 'warn');
    require('./auth');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('shorter than 32'));
  });

  it('should accept valid JWT_SECRET', () => {
    process.env.JWT_SECRET = 'a'.repeat(32);
    expect(() => require('./auth')).not.toThrow();
  });
});
```

**Tests para autenticación en endpoints**:
```typescript
describe('Campaign endpoints authentication', () => {
  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/campaigns');
    expect(res.status).toBe(401);
  });

  it('should return 200 with valid token', async () => {
    const token = generateValidToken();
    const res = await request(app)
      .get('/api/campaigns')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
```

**Tests para autorización por rol**:
```typescript
describe('Category endpoints authorization', () => {
  it('should return 403 for non-admin user', async () => {
    const token = generateUserToken({ role: 'user' });
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test' });
    expect(res.status).toBe(403);
  });

  it('should return 201 for admin user', async () => {
    const token = generateUserToken({ role: 'admin' });
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test' });
    expect(res.status).toBe(201);
  });
});
```

**Tests para rate limiting**:
```typescript
describe('Rate limiting', () => {
  it('should allow 100 requests', async () => {
    for (let i = 0; i < 100; i++) {
      const res = await request(app).get('/api/tickets');
      expect(res.status).not.toBe(429);
    }
  });

  it('should block 101st request', async () => {
    for (let i = 0; i < 100; i++) {
      await request(app).get('/api/tickets');
    }
    const res = await request(app).get('/api/tickets');
    expect(res.status).toBe(429);
  });
});
```

### Integration Tests

**Test de flujo completo**:
```typescript
describe('Security hardening integration', () => {
  it('should enforce authentication on all protected endpoints', async () => {
    const endpoints = [
      '/api/campaigns',
      '/api/campaigns/123',
      '/api/categories',
    ];

    for (const endpoint of endpoints) {
      const res = await request(app).get(endpoint);
      expect(res.status).toBe(401);
    }
  });

  it('should allow authenticated requests', async () => {
    const token = generateValidToken();
    const endpoints = [
      '/api/campaigns',
      '/api/campaigns/123',
    ];

    for (const endpoint of endpoints) {
      const res = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).not.toBe(401);
    }
  });
});
```

### Manual Testing

**Checklist de verificación manual**:

```bash
# 1. Verificar JWT_SECRET obligatorio
unset JWT_SECRET
docker-compose up chatbot
# Debe fallar con error claro

# 2. Verificar autenticación en campaigns
curl http://localhost:3011/api/campaigns
# Debe retornar 401

curl -H "Authorization: Bearer <valid-token>" http://localhost:3011/api/campaigns
# Debe retornar 200

# 3. Verificar autorización en categories
curl -X POST http://localhost:3001/api/categories \
  -H "Authorization: Bearer <user-token>" \
  -d '{"name":"Test"}'
# Debe retornar 403

curl -X POST http://localhost:3001/api/categories \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"name":"Test"}'
# Debe retornar 201

# 4. Verificar rate limiting
for i in {1..101}; do 
  curl http://localhost:3012/api/tickets
done
# Request 101 debe retornar 429

# 5. Verificar logs estructurados
docker logs technovastore-order-service | grep "Usuario autenticado"
# Debe mostrar JSON estructurado, no console.log
```

## Próximos Pasos

Después de implementar estas correcciones:

### Mejoras Futuras (Fuera del Alcance Actual)

1. **Autenticación de Servicio a Servicio**
   - Implementar mTLS entre microservicios
   - Tokens de servicio con scopes limitados

2. **Auditoría Avanzada**
   - Enviar eventos de seguridad a SIEM
   - Alertas en tiempo real para patrones sospechosos

3. **Secrets Management**
   - Migrar a HashiCorp Vault
   - Rotación automática de secretos

4. **Compliance**
   - Implementar GDPR compliance completo
   - Certificación SOC 2

5. **Monitoring Avanzado**
   - Dashboard de seguridad en Grafana
   - Métricas de intentos de acceso no autorizado

## Conclusión

Este diseño implementa las correcciones necesarias para alcanzar **10/10** en seguridad:

**Fase 1 (Crítica - 1 hora)**:
- ✅ JWT_SECRET obligatorio (3 servicios)
- ✅ Autenticación en campaigns (2 endpoints)
- ✅ Autorización en categories (3 endpoints)

**Resultado**: Puntuación 10/10 ✅

**Fase 2 (Opcional - 4-5 horas)**:
- ✅ Logging estructurado (50+ instancias)
- ✅ Contraseñas obligatorias (2 servicios)
- ✅ Validación de entrada (múltiples endpoints)
- ✅ Rate limiting (todos los servicios)

**Resultado**: Sistema más robusto y mantenible ✅

El diseño es **simple, seguro y fácil de implementar**, con impacto mínimo en rendimiento y compatibilidad hacia atrás (excepto la configuración obligatoria de secretos).

---

**Diseñado por**: Kiro AI  
**Fecha**: 16 de diciembre de 2025  
**Versión**: 1.0
