# Documento de Requisitos - Correcciones de Seguridad

## Introducción

Este documento define los requisitos para implementar las correcciones de seguridad identificadas en la auditoría del 15 de diciembre de 2025. El documento de auditoría completo se encuentra en `SECURITY_REVIEW_FINAL.md`.

Las correcciones incluyen:
1. **Autenticación en microservicios** (Prioridad CRÍTICA 🔴)
2. **Validación de redirecciones** (Prioridad ALTA 🟠)
3. **Manejo de errores en JSON.parse()** (Prioridad MEDIA 🟡)

Actualmente, el API Gateway tiene autenticación configurada correctamente, pero los microservicios individuales no validan tokens, lo que viola el principio de "defensa en profundidad" (defense in depth). Si un atacante logra acceder directamente a un microservicio (bypass del gateway, ataque interno, misconfiguration), podría realizar acciones sin autenticación.

## Glossary

- **Microservicio**: Servicio backend independiente que expone una API REST
- **Middleware de Autenticación**: Función que intercepta requests HTTP y valida tokens JWT antes de permitir acceso a los endpoints
- **Access Token**: Token JWT de corta duración usado para autenticar requests
- **Defense in Depth**: Principio de seguridad que requiere múltiples capas de protección
- **API Gateway**: Punto de entrada único que enruta requests a microservicios (puerto 3000)
- **httpOnly Cookie**: Cookie que no puede ser accedida por JavaScript del navegador
- **Screaming Architecture**: Patrón de arquitectura donde las carpetas se nombran por casos de uso de negocio
- **Open Redirect**: Vulnerabilidad que permite redirigir usuarios a sitios externos maliciosos
- **JSON Injection**: Ataque que explota parsing inseguro de JSON para causar crashes o inyectar código

## Requirements

### Requirement 1: Middleware de Autenticación en ticket-service

**User Story:** As a security administrator, I want all ticket endpoints to require authentication, so that only authorized users can create, view, or modify support tickets.

#### Acceptance Criteria

1. WHEN a request is made to any ticket endpoint THEN the System SHALL validate the access token before processing the request
2. WHEN a request has an invalid or missing token THEN the System SHALL return HTTP 401 Unauthorized
3. WHEN a request has a valid token THEN the System SHALL extract the user ID and pass it to the handler
4. WHEN a request is made to admin endpoints (metrics, analytics) THEN the System SHALL require admin role
5. WHEN authentication fails THEN the System SHALL log the failed attempt with IP address and endpoint

### Requirement 2: Middleware de Autenticación en notification-service

**User Story:** As a security administrator, I want all notification endpoints to require authentication, so that only authorized users can send or manage notifications.

#### Acceptance Criteria

1. WHEN a request is made to any notification endpoint THEN the System SHALL validate the access token before processing the request
2. WHEN a request has an invalid or missing token THEN the System SHALL return HTTP 401 Unauthorized
3. WHEN a request has a valid token THEN the System SHALL extract the user ID and pass it to the handler
4. WHEN a request is made to send notifications THEN the System SHALL verify the user has permission to send to the target user
5. WHEN authentication fails THEN the System SHALL log the failed attempt with IP address and endpoint

### Requirement 3: Middleware de Autenticación en payment-service

**User Story:** As a security administrator, I want all payment endpoints to require authentication, so that only authorized users can process payments or refunds.

#### Acceptance Criteria

1. WHEN a request is made to any payment endpoint THEN the System SHALL validate the access token before processing the request
2. WHEN a request has an invalid or missing token THEN the System SHALL return HTTP 401 Unauthorized
3. WHEN a request has a valid token THEN the System SHALL extract the user ID and pass it to the handler
4. WHEN a request is made to process a refund THEN the System SHALL require admin role
5. WHEN authentication fails THEN the System SHALL log the failed attempt with IP address and endpoint
6. WHEN a payment is processed THEN the System SHALL verify the user ID in the token matches the order owner

### Requirement 4: Middleware de Autenticación en recommender-service

**User Story:** As a security administrator, I want all recommender endpoints to require authentication, so that only authorized users can access personalized recommendations.

#### Acceptance Criteria

1. WHEN a request is made to user-specific recommendation endpoints THEN the System SHALL validate the access token before processing the request
2. WHEN a request has an invalid or missing token THEN the System SHALL return HTTP 401 Unauthorized
3. WHEN a request has a valid token THEN the System SHALL extract the user ID and pass it to the handler
4. WHEN a request is made to public endpoints (trending products) THEN the System MAY allow unauthenticated access
5. WHEN authentication fails THEN the System SHALL log the failed attempt with IP address and endpoint

### Requirement 5: Middleware de Autenticación en shipment-tracker

**User Story:** As a security administrator, I want all shipment tracking endpoints to require authentication, so that only authorized users can view tracking information.

#### Acceptance Criteria

1. WHEN a request is made to any shipment tracking endpoint THEN the System SHALL validate the access token before processing the request
2. WHEN a request has an invalid or missing token THEN the System SHALL return HTTP 401 Unauthorized
3. WHEN a request has a valid token THEN the System SHALL extract the user ID and pass it to the handler
4. WHEN a request is made to view shipment details THEN the System SHALL verify the user owns the associated order
5. WHEN authentication fails THEN the System SHALL log the failed attempt with IP address and endpoint

### Requirement 6: Middleware Compartido y Reutilizable

**User Story:** As a developer, I want a shared authentication middleware, so that all microservices use the same validation logic and maintain consistency.

#### Acceptance Criteria

1. WHEN creating authentication middleware THEN the System SHALL place it in a shared location accessible by all microservices
2. WHEN validating tokens THEN the System SHALL use the same JWT secret across all services
3. WHEN extracting user information THEN the System SHALL provide a consistent interface (userId, email, role)
4. WHEN handling errors THEN the System SHALL return consistent error responses across all services
5. WHEN logging authentication events THEN the System SHALL use a consistent log format

### Requirement 7: Validación de Roles y Permisos

**User Story:** As a security administrator, I want role-based access control on admin endpoints, so that only administrators can access sensitive operations.

#### Acceptance Criteria

1. WHEN a request is made to an admin endpoint THEN the System SHALL verify the user has admin role
2. WHEN a user without admin role attempts to access admin endpoints THEN the System SHALL return HTTP 403 Forbidden
3. WHEN validating roles THEN the System SHALL extract the role from the JWT token payload
4. WHEN a role is missing from the token THEN the System SHALL default to 'user' role
5. WHEN authorization fails THEN the System SHALL log the failed attempt with user ID and endpoint

### Requirement 8: Verificación de Propiedad de Recursos

**User Story:** As a user, I want the system to verify I own a resource before allowing access, so that I cannot view or modify other users' data.

#### Acceptance Criteria

1. WHEN a user requests their own tickets THEN the System SHALL allow access
2. WHEN a user requests another user's tickets THEN the System SHALL return HTTP 403 Forbidden
3. WHEN a user requests their own notifications THEN the System SHALL allow access
4. WHEN a user requests another user's notifications THEN the System SHALL return HTTP 403 Forbidden
5. WHEN a user requests shipment tracking for their order THEN the System SHALL allow access
6. WHEN a user requests shipment tracking for another user's order THEN the System SHALL return HTTP 403 Forbidden
7. WHEN an admin user requests any resource THEN the System SHALL allow access

### Requirement 9: Integración con Arquitectura Existente

**User Story:** As a developer, I want the authentication middleware to integrate seamlessly with the existing Screaming Architecture, so that the codebase remains consistent.

#### Acceptance Criteria

1. WHEN adding middleware THEN the System SHALL place shared utilities in the `shared/` folder at the service root
2. WHEN modifying API routes THEN the System SHALL maintain the existing route structure in `api/` folder
3. WHEN adding authentication THEN the System SHALL NOT break existing functionality
4. WHEN a service is rebuilt THEN the System SHALL compile without errors
5. WHEN tests are run THEN the System SHALL pass all existing tests

### Requirement 10: Validación de Redirecciones en Frontend

**User Story:** As a security administrator, I want all URL redirections validated, so that users cannot be redirected to malicious external sites.

#### Acceptance Criteria

1. WHEN the system redirects to a hardcoded internal URL THEN the System SHALL allow the redirection
2. WHEN the system redirects to a dynamic URL from user input or database THEN the System SHALL validate it is an internal URL
3. WHEN a dynamic URL points to an external domain THEN the System SHALL block the redirection and log a warning
4. WHEN validating URLs THEN the System SHALL use a centralized validation function
5. WHEN a redirection is blocked THEN the System SHALL show a safe error message to the user

### Requirement 11: Manejo de Errores en JSON.parse()

**User Story:** As a developer, I want all JSON.parse() calls protected with error handling, so that invalid JSON does not crash the application.

#### Acceptance Criteria

1. WHEN parsing JSON from external sources THEN the System SHALL wrap JSON.parse() in try-catch
2. WHEN JSON parsing fails THEN the System SHALL log the error with context
3. WHEN JSON parsing fails THEN the System SHALL return a safe default value or handle gracefully
4. WHEN parsing JSON from trusted internal sources THEN the System MAY skip try-catch if performance is critical
5. WHEN a parsing error occurs THEN the System SHALL NOT expose the raw error to the user

### Requirement 12: Validación y Despliegue

**User Story:** As a developer, I want each service validated after adding security fixes, so that I can verify it works correctly before moving to the next service.

#### Acceptance Criteria

1. WHEN security fixes are added to a service THEN the developer SHALL rebuild the container with `--build` flag
2. WHEN the container is rebuilt THEN the developer SHALL verify it starts without errors
3. WHEN the service is running THEN the developer SHALL test the fixed functionality
4. WHEN all tests pass THEN the developer SHALL move to the next service
5. WHEN fixes fail unexpectedly THEN the developer SHALL check logs and fix issues before proceeding

## Implementation Notes

### Prioridades de Implementación

Según la auditoría de seguridad, las correcciones se dividen en:

**Prioridad 1: CRÍTICA 🔴** (Implementar primero)
- Autenticación en microservicios (Requirements 1-5)

**Prioridad 2: ALTA 🟠** (Implementar segundo)
- Validación de redirecciones (Requirement 10)

**Prioridad 3: MEDIA 🟡** (Implementar tercero)
- Manejo de errores en JSON.parse() (Requirement 11)

### Servicios Afectados y Puertos

| Servicio | Puerto | Container Name | Criticidad |
|----------|--------|----------------|------------|
| ticket-service | 3012 | technovastore-ticket-service | Alta |
| notification-service | 3005 | technovastore-notification-service | Alta |
| payment-service | 3004 | technovastore-payment-service | **Crítica** |
| recommender-service | 3010 | technovastore-recommender | Media |
| shipment-tracker | 3008 | technovastore-shipment-tracker | Alta |

### Orden de Implementación Recomendado

**Fase 1: Autenticación en Microservicios**
1. **payment-service** (criticidad máxima - maneja dinero)
2. **ticket-service** (datos sensibles de usuarios)
3. **notification-service** (puede enviar spam si se compromete)
4. **shipment-tracker** (información de pedidos)
5. **recommender-service** (menor criticidad - solo recomendaciones)

**Fase 2: Validación de Redirecciones**
6. **NotificationCenter.tsx** (riesgo medio - URL dinámica)
7. **Otras redirecciones** (riesgo bajo - URLs hardcodeadas)

**Fase 3: Manejo de Errores JSON**
8. **OllamaAdapter.ts** (chatbot-service)
9. **Otros archivos** con JSON.parse() sin try-catch

### Middleware Existente de Referencia

El `user-service` ya tiene middleware de autenticación implementado correctamente. Usar como referencia:
- `domains/customer/user-service/shared/middleware/auth.ts`

### Variables de Entorno Requeridas

Todos los servicios deben tener acceso a:
- `JWT_SECRET`: Secreto compartido para validar tokens
- `NODE_ENV`: Entorno de ejecución (development/production)

### Comandos de Docker para Validación

```bash
# Reconstruir servicio específico
docker-compose -f docker-compose.optimized.yml up -d --build payment-service

# Ver logs del servicio
docker-compose -f docker-compose.optimized.yml logs -f payment-service

# Verificar que el servicio está corriendo
docker ps | grep payment-service

# Ejecutar tests dentro del container
docker exec technovastore-payment-service npm test
```

### Endpoints Públicos vs Protegidos

**Endpoints que DEBEN ser públicos** (sin autenticación):
- Health checks (`/health`, `/ping`)
- Métricas de Prometheus (`/metrics`) - solo accesible internamente

**Endpoints que DEBEN estar protegidos** (con autenticación):
- Todos los demás endpoints de negocio

### Archivos Específicos a Modificar

**Redirecciones a validar:**
- `domains/platform/frontend/src/features/customer/components/dashboard/NotificationCenter.tsx:176` (PRIORIDAD ALTA - URL dinámica)
- `domains/platform/frontend/src/app/error.tsx:49` (riesgo bajo - hardcoded '/')
- `domains/platform/frontend/src/features/customer/services/auth.service.ts:243` (riesgo bajo - hardcoded '/login')

**JSON.parse() a proteger:**
- `domains/support/chatbot-service/shared/clients/OllamaAdapter.ts:219` (PRIORIDAD MEDIA)
- Otros archivos identificados durante la implementación

### Consideraciones de Seguridad

1. **No confiar solo en el API Gateway**: Los microservicios deben validar tokens independientemente
2. **Validar propiedad de recursos**: No solo autenticar, también autorizar
3. **Logging de intentos fallidos**: Para detectar ataques
4. **Consistencia en respuestas de error**: No revelar información sobre la existencia de recursos
5. **Rate limiting**: Considerar añadir en el futuro para prevenir brute force

### Arquitectura de Archivos - Screaming Architecture

**IMPORTANTE**: Todos los servicios backend siguen Screaming Architecture, EXCEPTO el frontend.

**Para servicios backend (payment, ticket, notification, recommender, shipment-tracker):**
- Middleware compartido va en: `shared/middleware/`
- Utilidades compartidas van en: `shared/utils/`
- Modelos compartidos van en: `shared/models/`
- Rutas API van en: `api/routes.ts`
- NO crear carpetas por capas técnicas (domain/, application/, infrastructure/)

**Para frontend:**
- Sigue la estructura feature-based existente
- Utilidades compartidas van en: `src/shared/utils/`
- Componentes compartidos van en: `src/shared/components/`

### Validación de Funcionamiento

Después de implementar cada corrección:

1. **Reconstruir el contenedor** con `--build` flag
2. **Verificar que arranca sin errores** revisando los logs
3. **Probar en la aplicación real** (no páginas de prueba):
   - Para backend: Usar Postman/curl para probar endpoints
   - Para frontend: Verificar en las páginas reales de la aplicación
4. **Verificar logs** para confirmar que la autenticación/validación funciona
5. **Solo entonces** pasar al siguiente servicio/corrección
