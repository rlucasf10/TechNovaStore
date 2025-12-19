# Documento de Requisitos - Hardening de Seguridad 10/10

## Introducción

Este documento define los requisitos para implementar las correcciones de seguridad identificadas en la auditoría exhaustiva del 16 de diciembre de 2025. El documento de auditoría completo se encuentra en `docs/security/SECURITY_AUDIT_DEEP_DIVE.md`.

**Objetivo**: Alcanzar una puntuación de seguridad de **10/10** mediante la corrección de 3 vulnerabilidades críticas y la implementación de mejoras opcionales de calidad.

**Puntuación Actual**: 9.5/10  
**Puntuación Objetivo**: 10/10

## Glossary

- **JWT_SECRET**: Secreto compartido usado para firmar y verificar tokens JWT
- **Hardcoded Secret**: Secreto codificado directamente en el código fuente
- **Fallback Value**: Valor por defecto usado cuando una variable de entorno no está configurada
- **Defense in Depth**: Principio de seguridad que requiere múltiples capas de protección
- **RBAC**: Role-Based Access Control - Control de acceso basado en roles
- **Middleware**: Función que intercepta requests HTTP antes de llegar al handler
- **Rate Limiting**: Limitación de número de requests por unidad de tiempo
- **Structured Logging**: Logging con formato estructurado (JSON) en lugar de texto plano
- **Input Validation**: Validación de datos de entrada antes de procesarlos
- **Admin Endpoint**: Endpoint que solo debe ser accesible por administradores

## Requirements

### Requirement 1: Eliminación de JWT_SECRET Hardcodeado

**User Story:** As a security administrator, I want JWT_SECRET to be mandatory from environment variables, so that the application fails to start if not properly configured instead of using an insecure default.

#### Acceptance Criteria

1. WHEN the application starts and JWT_SECRET is not set THEN the System SHALL throw an error and refuse to start
2. WHEN the application starts and JWT_SECRET is set THEN the System SHALL use the provided secret for JWT operations
3. WHEN JWT_SECRET is missing THEN the System SHALL log a critical error message indicating the missing variable
4. WHEN JWT_SECRET is missing THEN the System SHALL NOT use any fallback or default value
5. WHEN the error is thrown THEN the System SHALL provide clear instructions on how to configure JWT_SECRET

### Requirement 2: Protección de Endpoints Administrativos en campaign-manager-service

**User Story:** As a security administrator, I want all campaign management endpoints to require authentication, so that only authorized users can view or manage campaigns.

#### Acceptance Criteria

1. WHEN a request is made to GET /campaigns THEN the System SHALL require valid JWT authentication
2. WHEN a request is made to GET /campaigns/:id THEN the System SHALL require valid JWT authentication
3. WHEN a request without valid token is made to these endpoints THEN the System SHALL return HTTP 401 Unauthorized
4. WHEN a request with valid token is made THEN the System SHALL process the request normally
5. WHEN authentication fails THEN the System SHALL log the failed attempt with IP and endpoint

### Requirement 3: Protección de Endpoints de Categorías en product-service

**User Story:** As a security administrator, I want all category CRUD operations to require admin authentication, so that only administrators can create, update, or delete product categories.

#### Acceptance Criteria

1. WHEN a request is made to POST /categories THEN the System SHALL require authentication and admin role
2. WHEN a request is made to PUT /categories/:id THEN the System SHALL require authentication and admin role
3. WHEN a request is made to DELETE /categories/:id THEN the System SHALL require authentication and admin role
4. WHEN a non-admin user attempts these operations THEN the System SHALL return HTTP 403 Forbidden
5. WHEN an unauthenticated user attempts these operations THEN the System SHALL return HTTP 401 Unauthorized
6. WHEN authorization fails THEN the System SHALL log the failed attempt with user ID and endpoint

### Requirement 4: Reemplazo de console.log con Logger Estructurado

**User Story:** As a developer, I want all console.log statements replaced with structured logging, so that logs are properly formatted, filterable, and don't expose sensitive information in production.

#### Acceptance Criteria

1. WHEN logging in production THEN the System SHALL use Winston structured logger instead of console methods
2. WHEN logging authentication events THEN the System SHALL use logger.info or logger.warn with structured data
3. WHEN logging errors THEN the System SHALL use logger.error with error context
4. WHEN logging in development THEN the System MAY use console methods for debugging
5. WHEN logging sensitive data THEN the System SHALL NOT include tokens, passwords, or PII in logs

### Requirement 5: Eliminación de Valores por Defecto de Contraseñas

**User Story:** As a security administrator, I want database passwords to be mandatory from environment variables, so that the application fails to start if not properly configured instead of using insecure defaults.

#### Acceptance Criteria

1. WHEN the application starts and POSTGRES_PASSWORD is not set THEN the System SHALL throw an error and refuse to start
2. WHEN the application starts and POSTGRES_PASSWORD is set THEN the System SHALL use the provided password
3. WHEN database password is missing THEN the System SHALL log a critical error message
4. WHEN database password is missing THEN the System SHALL NOT use any fallback or default value
5. WHEN the error is thrown THEN the System SHALL provide clear instructions on how to configure the password

### Requirement 6: Validación de Entrada en Endpoints

**User Story:** As a developer, I want all endpoints to validate input parameters, so that invalid or malicious data is rejected before processing.

#### Acceptance Criteria

1. WHEN a request is made with invalid parameters THEN the System SHALL return HTTP 400 Bad Request
2. WHEN validating path parameters THEN the System SHALL check type, format, and constraints
3. WHEN validating query parameters THEN the System SHALL sanitize and validate values
4. WHEN validating request body THEN the System SHALL validate all required fields
5. WHEN validation fails THEN the System SHALL return descriptive error messages without exposing internal details

### Requirement 7: Rate Limiting en Microservicios

**User Story:** As a security administrator, I want all microservices to implement rate limiting, so that they are protected against DoS attacks even if the API Gateway is bypassed.

#### Acceptance Criteria

1. WHEN a client makes more than 100 requests in 15 minutes THEN the System SHALL return HTTP 429 Too Many Requests
2. WHEN rate limit is exceeded THEN the System SHALL include Retry-After header in response
3. WHEN rate limiting THEN the System SHALL track requests per IP address
4. WHEN rate limiting THEN the System SHALL exclude health check endpoints
5. WHEN rate limit is exceeded THEN the System SHALL log the event with IP and endpoint

### Requirement 8: Logging Estructurado de SQL

**User Story:** As a developer, I want SQL query logging to use structured logger, so that queries are properly formatted and don't clutter console output.

#### Acceptance Criteria

1. WHEN logging SQL queries in development THEN the System SHALL use logger.debug with structured format
2. WHEN logging SQL queries THEN the System SHALL NOT log sensitive data in query parameters
3. WHEN logging SQL queries THEN the System SHALL include execution time
4. WHEN in production THEN the System SHALL NOT log SQL queries unless explicitly enabled
5. WHEN SQL logging is enabled THEN the System SHALL use appropriate log level (debug)

### Requirement 9: Verificación de Configuración al Inicio

**User Story:** As a system administrator, I want the application to verify all critical configuration at startup, so that misconfigurations are detected immediately instead of causing runtime errors.

#### Acceptance Criteria

1. WHEN the application starts THEN the System SHALL verify all required environment variables are set
2. WHEN a required variable is missing THEN the System SHALL list all missing variables in the error message
3. WHEN configuration is invalid THEN the System SHALL provide clear instructions for fixing it
4. WHEN all configuration is valid THEN the System SHALL log successful startup with configuration summary
5. WHEN configuration check fails THEN the System SHALL exit with non-zero status code

### Requirement 10: Documentación de Seguridad Actualizada

**User Story:** As a developer, I want security documentation to reflect all implemented changes, so that the team understands the current security posture.

#### Acceptance Criteria

1. WHEN security fixes are implemented THEN the System SHALL update SECURITY_REVIEW_FINAL.md
2. WHEN updating documentation THEN the System SHALL mark all fixed vulnerabilities as resolved
3. WHEN updating documentation THEN the System SHALL update the security score to 10/10
4. WHEN updating documentation THEN the System SHALL document all changes made
5. WHEN updating documentation THEN the System SHALL include verification steps for each fix

## Implementation Notes

### Prioridades de Implementación

Las correcciones se dividen en dos fases:

**Fase 1: CRÍTICA** (Requerida para 10/10)
- Requirement 1: JWT_SECRET hardcodeado (3 archivos)
- Requirement 2: Campaign manager endpoints (2 endpoints)
- Requirement 3: Category endpoints (3 endpoints)

**Fase 2: MEJORAS DE CALIDAD** (Opcional pero recomendada)
- Requirement 4: console.log → logger (50+ instancias)
- Requirement 5: Contraseñas por defecto (2 archivos)
- Requirement 6: Validación de entrada (múltiples endpoints)
- Requirement 7: Rate limiting (todos los servicios)
- Requirement 8: SQL logging (1 archivo)

**Fase 3: VERIFICACIÓN**
- Requirement 9: Verificación de configuración
- Requirement 10: Documentación actualizada

### Servicios Afectados

**Fase 1 - Crítica**:
- `chatbot-service`: JWT_SECRET hardcodeado
- `notification-service`: JWT_SECRET hardcodeado
- `ticket-service`: JWT_SECRET hardcodeado
- `campaign-manager-service`: Endpoints sin autenticación
- `product-service`: Category endpoints sin autenticación

**Fase 2 - Mejoras**:
- `order-service`: console.log (6 instancias)
- `ticket-service`: console.log (17 instancias), contraseña por defecto
- `shipment-tracker`: console.log (8 instancias), SQL logging
- Todos los servicios: Rate limiting

### Orden de Implementación Recomendado

1. **JWT_SECRET hardcodeado** (más crítico - afecta autenticación)
2. **Category endpoints** (permite manipulación del catálogo)
3. **Campaign endpoints** (expone información de negocio)
4. **console.log → logger** (mejora calidad de logs)
5. **Contraseñas por defecto** (previene configuraciones inseguras)
6. **Validación de entrada** (mejora robustez)
7. **Rate limiting** (protección adicional)
8. **SQL logging** (mejora logs de desarrollo)
9. **Verificación de configuración** (detecta problemas temprano)
10. **Documentación** (refleja estado actual)

### Archivos Específicos a Modificar

**Fase 1 - Crítica**:
1. `domains/support/chatbot-service/shared/middleware/auth.ts:16`
2. `domains/customer/notification-service/shared/middleware/auth.ts:17`
3. `domains/support/ticket-service/config/index.ts:23`
4. `domains/commerce/campaign-manager-service/api/routes.ts:88,138`
5. `domains/catalog/product-service/api/routes/categoryRoutes.ts:10-12`

**Fase 2 - Mejoras**:
- `domains/commerce/order-service/shared/middleware/auth.ts` (6 console.log)
- `domains/support/ticket-service/api/TicketController.ts` (10 console.log)
- `domains/support/ticket-service/index.ts` (7 console.log)
- `domains/support/shipment-tracker/api/TrackingController.ts` (8 console.log)
- `domains/support/ticket-service/config/database.ts:11` (contraseña)
- `domains/support/shipment-tracker/config/database.ts:13` (SQL logging)

### Comandos de Verificación

**Verificar JWT_SECRET obligatorio**:
```bash
# Debe fallar si JWT_SECRET no está configurado
docker-compose -f docker-compose.optimized.yml up chatbot

# Debe iniciar correctamente con JWT_SECRET
JWT_SECRET=test docker-compose -f docker-compose.optimized.yml up chatbot
```

**Verificar autenticación en endpoints**:
```bash
# Debe retornar 401 sin token
curl http://localhost:3011/api/campaigns

# Debe retornar 200 con token válido
curl -H "Authorization: Bearer <token>" http://localhost:3011/api/campaigns
```

**Verificar rate limiting**:
```bash
# Hacer 101 requests en menos de 15 minutos
for i in {1..101}; do curl http://localhost:3012/api/tickets; done
# El request 101 debe retornar 429
```

### Consideraciones de Seguridad

1. **No romper compatibilidad**: Los cambios deben ser compatibles con el flujo actual
2. **Logging apropiado**: Loggear intentos fallidos sin exponer información sensible
3. **Mensajes de error**: Claros pero sin revelar detalles de implementación
4. **Testing exhaustivo**: Probar cada cambio antes de pasar al siguiente
5. **Rollback plan**: Tener plan de reversión si algo falla

### Variables de Entorno Requeridas

Después de la implementación, estas variables son **OBLIGATORIAS**:

```bash
# Autenticación
JWT_SECRET=<secret-seguro-de-al-menos-32-caracteres>

# Base de datos
POSTGRES_PASSWORD=<contraseña-segura>
POSTGRES_USER=postgres
POSTGRES_HOST=postgresql
POSTGRES_PORT=5432
POSTGRES_DB=technovastore

# MongoDB
MONGODB_URI=mongodb://mongodb:27017/technovastore

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
```

### Impacto en Despliegue

**Cambios que requieren reconstrucción de containers**:
- Todos los cambios de código requieren `docker-compose up -d --build <service>`

**Cambios que requieren variables de entorno**:
- JWT_SECRET debe estar configurado en `.env` o docker-compose
- POSTGRES_PASSWORD debe estar configurado

**Verificación post-despliegue**:
1. Verificar que todos los servicios inician correctamente
2. Verificar que endpoints protegidos retornan 401 sin token
3. Verificar que endpoints protegidos funcionan con token válido
4. Verificar logs estructurados en lugar de console.log
5. Verificar rate limiting con múltiples requests

### Métricas de Éxito

**Fase 1 - Crítica**:
- ✅ Aplicación falla si JWT_SECRET no está configurado
- ✅ GET /campaigns retorna 401 sin token
- ✅ GET /campaigns/:id retorna 401 sin token
- ✅ POST /categories retorna 401 sin token
- ✅ PUT /categories/:id retorna 401 sin token
- ✅ DELETE /categories/:id retorna 401 sin token
- ✅ Puntuación de seguridad: 10/10

**Fase 2 - Mejoras**:
- ✅ 0 instancias de console.log en código de producción
- ✅ Aplicación falla si POSTGRES_PASSWORD no está configurado
- ✅ Todos los endpoints validan entrada
- ✅ Todos los servicios tienen rate limiting
- ✅ SQL logging usa logger estructurado

**Fase 3 - Verificación**:
- ✅ Verificación de configuración al inicio implementada
- ✅ Documentación actualizada con puntuación 10/10
- ✅ Todos los tests pasan
- ✅ No hay regresiones en funcionalidad existente

