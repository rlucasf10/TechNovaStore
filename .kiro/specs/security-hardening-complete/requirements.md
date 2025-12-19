# Documento de Requisitos - Hardening de Seguridad Completo

## Introducción

Este documento define los requisitos para completar el hardening de seguridad en TODOS los microservicios del proyecto TechNovaStore. Se identificaron problemas de seguridad en el código que deben corregirse:

1. **Secretos hardcodeados** con valores por defecto inseguros
2. **console.log en código de producción** que puede exponer información sensible

**Objetivo**: Eliminar todas las malas prácticas de seguridad en el código fuente.

**Exclusiones**: Los secretos en archivos `.env` y `docker-compose` se implementarán más adelante con HashiCorp Vault.

## Glossary

- **JWT_SECRET**: Secreto para firmar tokens JWT
- **JWT_REFRESH_SECRET**: Secreto para firmar refresh tokens
- **POSTGRES_PASSWORD**: Contraseña de PostgreSQL
- **REDIS_PASSWORD**: Contraseña de Redis
- **Hardcoded Secret**: Secreto codificado directamente en el código
- **Fallback Value**: Valor por defecto cuando una variable de entorno no está configurada
- **Structured Logging**: Logging con formato estructurado (JSON) usando Winston

## Requirements

### Requirement 1: Eliminación de JWT_SECRET Hardcodeado

**User Story:** As a security administrator, I want JWT_SECRET to be mandatory in ALL microservices, so that no service can start with an insecure default secret.

#### Acceptance Criteria

1. WHEN api-gateway starts and JWT_SECRET is not set THEN the System SHALL throw an error and refuse to start
2. WHEN user-service starts and JWT_SECRET is not set THEN the System SHALL throw an error and refuse to start
3. WHEN payment-service starts and JWT_SECRET is not set THEN the System SHALL throw an error and refuse to start
4. WHEN auto-purchase-service starts and JWT_SECRET is not set THEN the System SHALL throw an error and refuse to start
5. WHEN shared infrastructure config is loaded and JWT_SECRET is not set THEN the System SHALL throw an error
6. WHEN JWT_SECRET is shorter than 32 characters THEN the System SHALL log a warning message

### Requirement 2: Eliminación de POSTGRES_PASSWORD Hardcodeado

**User Story:** As a security administrator, I want POSTGRES_PASSWORD to be mandatory in ALL microservices that use PostgreSQL.

#### Acceptance Criteria

1. WHEN user-service starts and POSTGRES_PASSWORD is not set THEN the System SHALL throw an error
2. WHEN notification-service starts and POSTGRES_PASSWORD is not set THEN the System SHALL throw an error
3. WHEN payment-service starts and POSTGRES_PASSWORD is not set THEN the System SHALL throw an error
4. WHEN campaign-manager-service starts and POSTGRES_PASSWORD is not set THEN the System SHALL throw an error
5. WHEN shared infrastructure config is loaded and POSTGRES_PASSWORD is not set THEN the System SHALL throw an error
6. WHEN database password is missing THEN the System SHALL log a critical error with instructions

### Requirement 3: Reemplazo de console.log en Middlewares de Autenticación

**User Story:** As a developer, I want all authentication middlewares to use structured logging.

#### Acceptance Criteria

1. WHEN logging authentication events in product-service THEN the System SHALL use Winston logger
2. WHEN logging authentication events in shipment-tracker THEN the System SHALL use Winston logger
3. WHEN logging authentication events in campaign-manager-service THEN the System SHALL use Winston logger
4. WHEN logging authentication errors THEN the System SHALL use logger.error with structured context
5. WHEN logging authorization failures THEN the System SHALL use logger.warn with user and endpoint info

### Requirement 4: Eliminación de JWT_REFRESH_SECRET Hardcodeado

**User Story:** As a security administrator, I want JWT_REFRESH_SECRET to be mandatory.

#### Acceptance Criteria

1. WHEN shared infrastructure config is loaded and JWT_REFRESH_SECRET is not set THEN the System SHALL throw an error
2. WHEN JWT_REFRESH_SECRET is shorter than 32 characters THEN the System SHALL log a warning

### Requirement 5: Eliminación de REDIS_PASSWORD Hardcodeado

**User Story:** As a security administrator, I want REDIS_PASSWORD to be mandatory in services that use Redis.

#### Acceptance Criteria

1. WHEN api-gateway starts and REDIS_PASSWORD is not set THEN the System SHALL throw an error
2. WHEN Redis password is missing THEN the System SHALL log a critical error with instructions

### Requirement 6: Reemplazo de console.log en Código de Producción Backend

**User Story:** As a developer, I want all production code to use structured logging.

#### Acceptance Criteria

1. WHEN logging in chatbot-service THEN the System SHALL use Winston logger instead of console methods
2. WHEN logging in shipment-tracker THEN the System SHALL use Winston logger instead of console methods
3. WHEN logging in campaign-manager-service THEN the System SHALL use Winston logger instead of console methods
4. WHEN logging in notification-service THEN the System SHALL use Winston logger instead of console methods
5. WHEN logging in sync-engine THEN the System SHALL use Winston logger instead of console methods
6. WHEN logging in recommender-service THEN the System SHALL use Winston logger instead of console methods
7. WHEN logging in ticket-service THEN the System SHALL use Winston logger instead of console methods
8. WHEN logging in payment-service clients THEN the System SHALL use Winston logger instead of console methods
9. WHEN logging in order-service clients THEN the System SHALL use Winston logger instead of console methods

### Requirement 7: Consistencia en Validación de Configuración

**User Story:** As a system administrator, I want all microservices to validate critical configuration at startup.

#### Acceptance Criteria

1. WHEN any microservice starts THEN the System SHALL verify JWT_SECRET is set and has minimum length
2. WHEN any microservice using PostgreSQL starts THEN the System SHALL verify POSTGRES_PASSWORD is set
3. WHEN configuration validation fails THEN the System SHALL provide clear error messages
4. WHEN configuration validation fails THEN the System SHALL exit with non-zero status code

### Requirement 8: Logging Condicional en Frontend para Producción

**User Story:** As a developer, I want the frontend to not log debug information in production.

#### Acceptance Criteria

1. WHEN the frontend runs in production THEN the System SHALL NOT output console.log messages
2. WHEN the frontend runs in development THEN the System SHALL output console.log messages for debugging
3. WHEN creating the logger THEN the System SHALL provide the same API as console (log, error, warn, debug)

## Archivos a Modificar

### Secretos Hardcodeados (13 archivos)

**JWT_SECRET (5 archivos):**
1. `domains/platform/api-gateway/config/index.ts`
2. `domains/customer/user-service/config/index.ts`
3. `domains/commerce/payment-service/config/index.ts`
4. `domains/commerce/auto-purchase-service/shared/middleware/auth.ts`
5. `shared/infrastructure/config/src/environment.ts`

**POSTGRES_PASSWORD (6 archivos):**
6. `domains/customer/user-service/config/index.ts`
7. `domains/customer/notification-service/index.ts`
8. `domains/commerce/payment-service/config/index.ts`
9. `domains/commerce/campaign-manager-service/shared/utils/database.ts`
10. `domains/commerce/campaign-manager-service/scripts/migrate-campaigns.ts`
11. `shared/infrastructure/config/src/environment.ts`

**JWT_REFRESH_SECRET (1 archivo):**
12. `shared/infrastructure/config/src/environment.ts`

**REDIS_PASSWORD (1 archivo):**
13. `domains/platform/api-gateway/shared/utils/redis.ts`

### console.log en Backend (70+ archivos)

**Middlewares de Autenticación (3 archivos):**
- `domains/catalog/product-service/shared/middleware/auth.ts`
- `domains/support/shipment-tracker/shared/middleware/auth.ts`
- `domains/commerce/campaign-manager-service/shared/middleware/auth.ts`

**chatbot-service (15 archivos):**
- index.ts, api/*, casos de uso/*, shared/*

**shipment-tracker (13 archivos):**
- index.ts, casos de uso/*, shared/providers/*, shared/clients/*, shared/utils/*

**campaign-manager-service (5 archivos):**
- index.ts, config/*, shared/clients/*, scripts/*

**notification-service (10 archivos):**
- index.ts, casos de uso/*, shared/*

**sync-engine (6 archivos):**
- index.ts, casos de uso/*, shared/workers/*, shared/scheduler/*

**recommender-service (8 archivos):**
- casos de uso/*, api/*, shared/*

**Otros servicios (7 archivos):**
- ticket-service, payment-service, order-service, auto-purchase-service

### console.log en Frontend (55+ archivos)

**Servicios (2 archivos):**
- chatService.ts, automationService.ts

**API Routes (11 archivos):**
- admin, products, categories, campaigns, proxy, recommendations, recommender

**Componentes (40+ archivos):**
- tickets, commerce, dashboard usuario, auth, admin, shared

**Páginas (11 archivos):**
- admin dashboard, wishlist, pedidos, productos, login

## Patrones de Implementación

### Patrón para Secretos Obligatorios

```typescript
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  logger.error('CRITICAL: JWT_SECRET environment variable is not set');
  throw new Error('JWT_SECRET must be configured. Application cannot start.');
}

if (JWT_SECRET.length < 32) {
  logger.warn('WARNING: JWT_SECRET is shorter than 32 characters');
}
```

### Patrón para Logger en Backend

```typescript
// ❌ ANTES
console.log('[Auth] Token encontrado');
console.error('Error:', error);

// ✅ DESPUÉS
logger.debug('Token encontrado', { source: 'cookie' });
logger.error('Authentication error', { error: error.message });
```

### Patrón para Logger en Frontend

```typescript
// domains/platform/frontend/src/shared/lib/logger.ts
const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  log: (...args: any[]) => isDev && console.log(...args),
  error: (...args: any[]) => isDev && console.error(...args),
  warn: (...args: any[]) => isDev && console.warn(...args),
  debug: (...args: any[]) => isDev && console.debug(...args),
  info: (...args: any[]) => isDev && console.info(...args),
};
```
