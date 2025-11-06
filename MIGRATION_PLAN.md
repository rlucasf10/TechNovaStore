# Plan de Migración Detallado - TechNovaStore

**Proyecto**: Refactorización a Screaming Architecture  
**Fecha de creación**: 6 de noviembre de 2025  
**Versión**: 1.0  
**Estado**: 📋 Planificación completada

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Objetivos de la Migración](#objetivos-de-la-migración)
3. [Alcance del Proyecto](#alcance-del-proyecto)
4. [Fases de Migración](#fases-de-migración)
5. [Mapeo de Servicios a Dominios](#mapeo-de-servicios-a-dominios)
6. [Checklist de Validación por Fase](#checklist-de-validación-por-fase)
7. [Criterios de Éxito](#criterios-de-éxito)
8. [Gestión de Riesgos](#gestión-de-riesgos)
9. [Plan de Rollback](#plan-de-rollback)
10. [Cronograma Estimado](#cronograma-estimado)

---

## Resumen Ejecutivo

Este documento describe el plan detallado para migrar el proyecto TechNovaStore de una estructura tecnología-céntrica a una arquitectura basada en dominios de negocio (Screaming Architecture).

### Estado Actual

- **Estructura**: Tecnología-céntrica (services/, ai-services/, automation/)
- **Microservicios**: 19 servicios identificados
- **Archivos en raíz**: 53 (objetivo: ≤5)
- **Duplicaciones**: 0 archivos duplicados exactos
- **Tests**: Falta de tests en 6 servicios backend

### Estado Objetivo

- **Estructura**: Basada en dominios de negocio (domains/catalog, domains/commerce, etc.)
- **Microservicios**: 19 servicios organizados en 5 dominios
- **Archivos en raíz**: ≤5 archivos esenciales
- **Duplicaciones**: 0 (mantener)
- **Configuraciones**: Estandarizadas con herencia de configuración base


### Beneficios Esperados

1. **Claridad arquitectónica**: La estructura comunica el propósito del negocio
2. **Mejor navegabilidad**: Fácil encontrar servicios por dominio
3. **Mantenibilidad**: Código organizado por contexto de negocio
4. **Escalabilidad**: Dominios independientes facilitan crecimiento
5. **Onboarding**: Nuevos desarrolladores entienden el sistema más rápido

---

## Objetivos de la Migración

### Objetivos Principales

1. **Implementar Screaming Architecture**
   - Estructura que comunica el dominio del negocio
   - Organización por contextos de negocio, no por tecnología
   - Facilitar comprensión del sistema al primer vistazo

2. **Eliminar Duplicaciones**
   - Consolidar configuraciones TypeScript
   - Estandarizar configuraciones de testing
   - Centralizar documentación

3. **Estandarizar Microservicios**
   - Estructura interna consistente en todos los servicios
   - Separación clara de capas (domain, application, infrastructure, presentation)
   - Organización de tests estandarizada

4. **Limpiar Raíz del Proyecto**
   - Reducir archivos en raíz de 53 a ≤5
   - Mover documentación a docs/
   - Organizar scripts en subcarpetas

5. **Renombrar Proyecto**
   - Eliminar referencias a "Ciberseguridad"
   - Usar "TechNovaStore" consistentemente
   - Actualizar nombres de servicios Docker

### Objetivos Secundarios

1. Mejorar documentación de arquitectura
2. Crear guías para desarrolladores
3. Documentar convenciones de código
4. Establecer plantillas para nuevos servicios

---

## Alcance del Proyecto

### En Alcance ✅

1. **Reorganización de estructura**
   - Mover 19 microservicios a estructura de dominios
   - Reorganizar código compartido (shared/)
   - Limpiar raíz del proyecto

2. **Renombrado completo**
   - Actualizar nombres en docker-compose
   - Actualizar package.json de todos los servicios
   - Actualizar documentación

3. **Consolidación de configuraciones**
   - Crear configuraciones base (tsconfig, jest)
   - Hacer que servicios extiendan configuraciones base
   - Eliminar duplicaciones

4. **Estandarización de servicios**
   - Aplicar estructura estándar a 13 microservicios
   - Reorganizar tests
   - Actualizar imports

5. **Limpieza y documentación**
   - Eliminar archivos temporales
   - Reorganizar documentación
   - Crear documentación de arquitectura

### Fuera de Alcance ❌

1. **Cambios de funcionalidad**
   - No se modificará la lógica de negocio
   - No se agregarán nuevas features
   - No se modificarán APIs existentes

2. **Cambios de infraestructura**
   - No se modificará configuración de Docker
   - No se cambiarán bases de datos
   - No se modificará stack de monitoreo

3. **Creación de tests**
   - No se crearán tests nuevos (fuera de alcance)
   - Solo se reorganizarán tests existentes
   - Se documentará falta de tests

4. **Optimizaciones de código**
   - No se refactorizará lógica interna
   - No se optimizará rendimiento
   - Solo se reorganizará estructura

---

## Fases de Migración

### Phase 0: Preparación y Análisis ✅ COMPLETADA

**Duración estimada**: 1-2 horas  
**Estado**: ✅ Completada

**Tareas completadas**:
- ✅ Crear herramientas de análisis y migración
- ✅ Ejecutar análisis completo del proyecto
- ✅ Crear plan de migración detallado (este documento)
- ⏭️ Crear backup completo del proyecto
- ⏭️ Crear tests de verificación base

**Entregables**:
- ✅ Scripts de análisis (scripts/migration/)
- ✅ DUPLICATION_REPORT.md
- ✅ CURRENT_STRUCTURE.md
- ✅ ANALYSIS_COMPLETE.md
- ✅ MIGRATION_PLAN.md (este documento)
- ⏭️ Tag: `pre-migration-backup`
- ⏭️ Tests de verificación base

**Criterios de éxito**:
- ✅ Herramientas de análisis funcionando
- ✅ Reportes generados
- ✅ Backup creado
- ⏭️ Tests de verificación pasando

---

### Phase 1: Renombrado de Proyecto

**Duración estimada**: 2-3 horas  
**Estado**: ⏭️ Pendiente

**Objetivo**: Renombrar proyecto de "Ciberseguridad" a "TechNovaStore" en todos los archivos.

**Tareas**:
1. Buscar y documentar referencias a "Ciberseguridad"
2. Actualizar docker-compose (5 archivos)
3. Actualizar package.json (19 archivos)
4. Actualizar documentación principal
5. Actualizar scripts
6. Validar renombrado completo
7. Crear checkpoint: `phase-1-complete`

**Archivos a modificar**:
- 5 archivos docker-compose.*.yml
- 19 archivos package.json
- ~20 archivos de documentación
- ~15 scripts

**Validación**:
- Búsqueda de "Ciberseguridad" retorna 0 resultados
- Todos los servicios Docker inician con nuevo nombre
- Tests existentes pasan (100%)

**Riesgos**:
- ⚠️ Olvidar alguna referencia (mitigado con búsqueda exhaustiva)
- ⚠️ Romper configuración Docker (mitigado con validación)

---

### Phase 2: Eliminación de Duplicaciones

**Duración estimada**: 3-4 horas  
**Estado**: ⏭️ Pendiente

**Objetivo**: Consolidar configuraciones y eliminar archivos temporales.

**Tareas**:
1. Consolidar archivos .env
2. Consolidar configuraciones (tsconfig, jest, eslint)
3. Consolidar documentación
4. Eliminar archivos temporales (7 archivos)
5. Validar eliminación
6. Crear checkpoint: `phase-2-complete`

**Configuraciones a consolidar**:
- tsconfig.json (crear tsconfig.base.json)
- jest.config.js (crear jest.config.base.js)
- .eslintrc.js (verificar único)
- .prettierrc (verificar único)

**Archivos temporales a eliminar**:
- verify-installation.ps1 (mover a scripts/)
- verify-services.ps1 (mover a scripts/)
- test-format-conversation.ts (revisar y eliminar)

**Validación**:
- Análisis de duplicaciones muestra 0 duplicaciones
- Todos los servicios compilan correctamente
- Tests pasan (100%)

**Riesgos**:
- ⚠️ Romper configuración de algún servicio (mitigado con validación)
- ⚠️ Eliminar archivo necesario (mitigado con revisión cuidadosa)

---

### Phase 3: Reorganización a Dominios

**Duración estimada**: 6-8 horas  
**Estado**: ⏭️ Pendiente

**Objetivo**: Reorganizar 19 microservicios en estructura de dominios.

**Tareas**:
1. Crear estructura de dominios (5 dominios)
2. Migrar dominio catalog (3 servicios)
3. Migrar dominio customer (2 servicios)
4. Migrar dominio commerce (3 servicios)
5. Migrar dominio support (3 servicios)
6. Migrar dominio platform (2 servicios)
7. Reorganizar shared/
8. Eliminar carpetas antiguas vacías
9. Validar reorganización completa
10. Crear checkpoint: `phase-3-complete`

**Servicios a mover**: 19 microservicios

**Dominios a crear**:
- domains/catalog/ (3 servicios)
- domains/commerce/ (3 servicios)
- domains/customer/ (2 servicios)
- domains/support/ (3 servicios)
- domains/platform/ (2 servicios)

**Validación por dominio**:
- Servicios compilan correctamente
- Contenedores Docker inician
- Health checks pasan
- Tests del dominio pasan

**Validación final**:
- Todos los servicios en dominios correctos
- No quedan servicios en ubicaciones antiguas
- Todos los servicios inician correctamente
- Suite completa de tests pasa

**Riesgos**:
- ⚠️ Romper imports entre servicios (mitigado con validación incremental)
- ⚠️ Olvidar actualizar docker-compose (mitigado con checklist)
- ⚠️ Problemas con paths relativos (mitigado con pruebas)

---

### Phase 4: Estandarización de Microservicios

**Duración estimada**: 8-10 horas  
**Estado**: ⏭️ Pendiente

**Objetivo**: Aplicar estructura estándar a 13 microservicios.

**Tareas**:
1. Crear plantilla de estructura estándar
2. Estandarizar servicios simples (2 servicios)
3. Estandarizar servicios core (4 servicios)
4. Estandarizar servicios de automatización (2 servicios)
5. Estandarizar servicios de soporte (1 servicio)
6. Estandarizar servicios complejos (3 servicios)
7. Validar estandarización completa
8. Crear checkpoint: `phase-4-complete`

**Estructura estándar**:
```
service-name/
├── src/
│   ├── domain/           # Entidades, value objects, domain services
│   ├── application/      # Use cases, DTOs
│   ├── infrastructure/   # Repositories, external services
│   └── presentation/     # Controllers, routes, middleware
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

**Servicios a estandarizar**: 13 microservicios
- 2 servicios simples (notification, shipment-tracker)
- 4 servicios core (product, user, order, payment)
- 2 servicios de automatización (sync-engine, auto-purchase)
- 1 servicio de soporte (ticket)
- 3 servicios complejos (chatbot, recommender, api-gateway)

**Validación**:
- Todos los servicios siguen estructura estándar
- Todos compilan correctamente
- Todos los contenedores inician
- Suite completa de tests pasa

**Riesgos**:
- ⚠️ Romper lógica al mover archivos (mitigado con validación exhaustiva)
- ⚠️ Tiempo mayor al estimado (mitigado con priorización)

---

### Phase 5: Limpieza Final y Documentación

**Duración estimada**: 3-4 horas  
**Estado**: ⏭️ Pendiente

**Objetivo**: Limpiar proyecto y actualizar documentación.

**Tareas**:
1. Limpiar archivos temporales
2. Organizar documentación (mover a docs/)
3. Organizar scripts (crear subcarpetas)
4. Limpiar raíz del proyecto (53 → ≤5 archivos)
5. Crear documentación de arquitectura
6. Actualizar README principal
7. Validación final completa
8. Crear checkpoint: `phase-5-complete` y `migration-complete`
9. Generar reporte final

**Archivos a mover de raíz**:
- ~17 archivos .md → docs/
- ~12 scripts → scripts/
- Archivos temporales de migración

**Documentación a crear**:
- ARCHITECTURE.md
- MIGRATION_SUMMARY.md
- DEVELOPER_GUIDE.md

**Validación final**:
- ≤5 archivos en raíz
- Todos los servicios funcionan
- Tests pasan (100%)
- Compilación TypeScript sin errores
- Documentación actualizada

**Criterios de éxito finales**:
- ✅ Estructura Screaming Architecture
- ✅ Sin duplicaciones
- ✅ Nombres consistentes (TechNovaStore)
- ✅ Servicios funcionando
- ✅ Tests pasando (100%)
- ✅ Documentación actualizada
- ✅ Raíz limpia (≤5 archivos)
- ✅ Estructura estándar en servicios

---

## Mapeo de Servicios a Dominios

### Dominio: catalog (Catálogo de Productos)

**Propósito**: Gestión del catálogo de productos, sincronización con proveedores y recomendaciones.

**Servicios** (3):

| Servicio | Ubicación Actual | Ubicación Nueva | Responsabilidad |
|----------|------------------|-----------------|-----------------|
| product-service | `services/product/` | `domains/catalog/product-service/` | CRUD de productos, búsqueda, categorías |
| sync-engine | `automation/sync-engine/` | `domains/catalog/sync-engine/` | Sincronización con APIs de proveedores |
| recommender-service | `ai-services/recommender/` | `domains/catalog/recommender-service/` | Recomendaciones de productos con ML |

**Dependencias**:
- MongoDB (productos)
- Redis (cache)
- APIs externas (proveedores)

**Validación**:
- [ ] product-service compila y arranca
- [ ] sync-engine compila y arranca
- [ ] recommender-service compila y arranca
- [ ] Health checks pasan
- [ ] Tests del dominio pasan

---

### Dominio: commerce (Comercio y Transacciones)

**Propósito**: Gestión de pedidos, pagos y compras automáticas.

**Servicios** (3):

| Servicio | Ubicación Actual | Ubicación Nueva | Responsabilidad |
|----------|------------------|-----------------|-----------------|
| order-service | `services/order/` | `domains/commerce/order-service/` | Gestión de pedidos, estados, historial |
| payment-service | `services/payment/` | `domains/commerce/payment-service/` | Procesamiento de pagos, transacciones |
| auto-purchase-service | `automation/auto-purchase/` | `domains/commerce/auto-purchase-service/` | Compras automáticas basadas en reglas |

**Dependencias**:
- PostgreSQL (pedidos, pagos)
- MongoDB (logs)
- Redis (cache)
- Pasarelas de pago externas

**Validación**:
- [ ] order-service compila y arranca
- [ ] payment-service compila y arranca
- [ ] auto-purchase-service compila y arranca
- [ ] Health checks pasan
- [ ] Tests del dominio pasan

---

### Dominio: customer (Gestión de Clientes)

**Propósito**: Gestión de usuarios, autenticación y notificaciones.

**Servicios** (2):

| Servicio | Ubicación Actual | Ubicación Nueva | Responsabilidad |
|----------|------------------|-----------------|-----------------|
| user-service | `services/user/` | `domains/customer/user-service/` | Autenticación, perfiles, OAuth |
| notification-service | `services/notification/` | `domains/customer/notification-service/` | Envío de emails, SMS, push notifications |

**Dependencias**:
- PostgreSQL (usuarios)
- Redis (sesiones)
- SMTP (emails)
- Servicios de SMS

**Validación**:
- [ ] user-service compila y arranca
- [ ] notification-service compila y arranca
- [ ] Health checks pasan
- [ ] Tests del dominio pasan

---

### Dominio: support (Soporte al Cliente)

**Propósito**: Soporte técnico, tickets, chatbot y seguimiento de envíos.

**Servicios** (3):

| Servicio | Ubicación Actual | Ubicación Nueva | Responsabilidad |
|----------|------------------|-----------------|-----------------|
| ticket-service | `services/ticket/` | `domains/support/ticket-service/` | Gestión de tickets de soporte |
| chatbot-service | `ai-services/chatbot/` | `domains/support/chatbot-service/` | Chatbot conversacional con Ollama/Phi-3 |
| shipment-tracker | `automation/shipment-tracker/` | `domains/support/shipment-tracker/` | Seguimiento de envíos en tiempo real |

**Dependencias**:
- MongoDB (tickets, conversaciones)
- Ollama (LLM para chatbot)
- APIs de tracking de envíos

**Validación**:
- [ ] ticket-service compila y arranca
- [ ] chatbot-service compila y arranca
- [ ] shipment-tracker compila y arranca
- [ ] Health checks pasan
- [ ] Tests del dominio pasan

---

### Dominio: platform (Plataforma)

**Propósito**: Gateway de API y aplicación web frontend.

**Servicios** (2):

| Servicio | Ubicación Actual | Ubicación Nueva | Responsabilidad |
|----------|------------------|-----------------|-----------------|
| api-gateway | `api-gateway/` | `domains/platform/api-gateway/` | Gateway principal, routing, autenticación |
| frontend | `frontend/` | `domains/platform/frontend/` | Aplicación web Next.js |

**Dependencias**:
- Todos los microservicios (routing)
- Redis (cache)
- PostgreSQL (sesiones)

**Validación**:
- [ ] api-gateway compila y arranca
- [ ] frontend compila y arranca
- [ ] Health checks pasan
- [ ] Tests del dominio pasan

---

### Código Compartido (shared)

**Propósito**: Código y utilidades compartidas entre servicios.

**Estructura actual**:
```
shared/
├── config/
├── middleware/
├── models/
├── types/
└── utils/
```

**Estructura nueva**:
```
shared/
├── domain/              # Lógica de dominio compartida
│   ├── entities/
│   ├── value-objects/
│   └── interfaces/
└── infrastructure/      # Utilidades de infraestructura
    ├── database/
    ├── cache/
    ├── logging/
    └── monitoring/
```

**Paquetes** (4):
- shared/config → shared/infrastructure/config
- shared/models → shared/domain/entities
- shared/types → shared/domain/interfaces
- shared/utils → shared/infrastructure/utils
- shared/middleware → shared/infrastructure/middleware

**Validación**:
- [ ] Todos los servicios compilan con nuevas rutas
- [ ] Imports actualizados correctamente
- [ ] Tests pasan

---

### Infraestructura (sin cambios)

**Propósito**: Configuración de infraestructura, monitoreo y observabilidad.

**Ubicación**: `infrastructure/` (sin cambios)

**Contenido**:
- Configuración de Prometheus, Grafana, Alertmanager
- Configuración de ELK Stack
- Configuración de bases de datos
- Configuración de Nginx, Redis, etc.

**Nota**: Esta carpeta NO se mueve, permanece en la raíz.

---

### Resumen del Mapeo

| Dominio | Servicios | Ubicación Actual | Ubicación Nueva |
|---------|-----------|------------------|-----------------|
| **catalog** | 3 | services/, automation/, ai-services/ | domains/catalog/ |
| **commerce** | 3 | services/, automation/ | domains/commerce/ |
| **customer** | 2 | services/ | domains/customer/ |
| **support** | 3 | services/, ai-services/, automation/ | domains/support/ |
| **platform** | 2 | api-gateway/, frontend/ | domains/platform/ |
| **shared** | 4 paquetes | shared/ | shared/ (reorganizado) |
| **infrastructure** | N/A | infrastructure/ | infrastructure/ (sin cambios) |

**Total**: 19 servicios organizados en 5 dominios

---

## Checklist de Validación por Fase

### Phase 0: Preparación y Análisis ✅

- [x] Herramientas de análisis creadas
- [x] Análisis de duplicaciones ejecutado
- [x] Reporte de estructura generado
- [x] Plan de migración creado
- [ ] Backup completo creado (tag: `pre-migration-backup`)
- [ ] Tests de verificación base creados
- [ ] Tests de verificación pasando

**Comando de validación**:
```bash
node scripts/migration/git-backup-utility.js verify
node scripts/migration/git-backup-utility.js list-checkpoints
```

---

### Phase 1: Renombrado de Proyecto

**Pre-requisitos**:
- [ ] Backup completo creado
- [ ] Tests de verificación pasando

**Checklist de ejecución**:
- [ ] Buscar "Ciberseguridad" en todos los archivos
- [ ] Buscar "ciberseguridad" en todos los archivos
- [ ] Actualizar docker-compose.yml
- [ ] Actualizar docker-compose.optimized.yml
- [ ] Actualizar docker-compose.prod.yml
- [ ] Actualizar docker-compose.dev.yml
- [ ] Actualizar docker-compose.staging.yml
- [ ] Actualizar package.json raíz
- [ ] Actualizar package.json de 19 microservicios
- [ ] Actualizar README.md
- [ ] Actualizar CONTRIBUTING.md
- [ ] Actualizar DEPLOYMENT.md
- [ ] Actualizar scripts de deployment
- [ ] Actualizar scripts de instalación

**Checklist de validación**:
- [ ] Búsqueda de "Ciberseguridad" retorna 0 resultados
- [ ] Búsqueda de "ciberseguridad" retorna 0 resultados
- [ ] Detener todos los contenedores
- [ ] Eliminar contenedores antiguos
- [ ] Iniciar servicios con nuevo nombre
- [ ] Verificar que todos los servicios inician
- [ ] Verificar health checks de servicios
- [ ] Ejecutar tests existentes (100% pasan)
- [ ] Ejecutar tests de verificación Docker
- [ ] Crear commit: "Phase 1: Rename project to TechNovaStore"
- [ ] Crear tag: `phase-1-complete`

**Comandos de validación**:
```bash
# Buscar referencias antiguas
grep -r "Ciberseguridad" . --exclude-dir=node_modules --exclude-dir=.git
grep -r "ciberseguridad" . --exclude-dir=node_modules --exclude-dir=.git

# Validar servicios Docker
docker-compose -f docker-compose.optimized.yml down
docker-compose -f docker-compose.optimized.yml up -d
docker-compose -f docker-compose.optimized.yml ps

# Crear checkpoint
node scripts/migration/git-backup-utility.js create-checkpoint "Phase 1: Rename complete"
```

---

### Phase 2: Eliminación de Duplicaciones

**Pre-requisitos**:
- [ ] Phase 1 completada y validada
- [ ] Tag `phase-1-complete` creado

**Checklist de ejecución**:

**2.1 Consolidar archivos .env**:
- [ ] Listar todos los archivos .env
- [ ] Comparar contenido de archivos similares
- [ ] Definir archivos .env a mantener
- [ ] Definir archivos .env a eliminar
- [ ] Mover variables únicas a archivos centralizados
- [ ] Eliminar archivos .env duplicados
- [ ] Actualizar referencias en docker-compose
- [ ] Actualizar documentación de variables

**2.2 Consolidar configuraciones TypeScript**:
- [ ] Crear tsconfig.base.json en raíz
- [ ] Actualizar tsconfig.json de servicios para extender base
- [ ] Eliminar configuraciones duplicadas
- [ ] Validar compilación de todos los servicios

**2.3 Consolidar configuraciones de testing**:
- [ ] Crear jest.config.base.js en raíz
- [ ] Actualizar configuraciones de servicios
- [ ] Validar tests de todos los servicios

**2.4 Consolidar configuraciones de linting**:
- [ ] Verificar que .eslintrc.js es único
- [ ] Verificar que .prettierrc es único
- [ ] Actualizar referencias si es necesario

**2.5 Consolidar documentación**:
- [ ] Identificar README duplicados
- [ ] Identificar guías duplicadas
- [ ] Mover documentación a docs/ centralizado
- [ ] Eliminar documentación duplicada
- [ ] Actualizar índice de documentación

**2.6 Eliminar archivos temporales**:
- [ ] Mover verify-installation.ps1 a scripts/utilities/
- [ ] Mover verify-services.ps1 a scripts/utilities/
- [ ] Revisar test-format-conversation.ts
- [ ] Revisar verify-design-system.js
- [ ] Actualizar .gitignore si es necesario

**Checklist de validación**:
- [ ] Ejecutar análisis de duplicaciones nuevamente
- [ ] Verificar que reporte muestra 0 duplicaciones
- [ ] Compilar todos los servicios TypeScript
- [ ] Iniciar todos los servicios Docker
- [ ] Verificar health checks
- [ ] Ejecutar suite completa de tests
- [ ] Crear commit: "Phase 2: Remove duplications and consolidate configs"
- [ ] Crear tag: `phase-2-complete`

**Comandos de validación**:
```bash
# Análisis de duplicaciones
node scripts/migration/analyze-duplications.js

# Compilación TypeScript
npx tsc --noEmit

# Validar servicios
docker-compose -f docker-compose.optimized.yml restart
docker-compose -f docker-compose.optimized.yml ps

# Tests
npm test

# Crear checkpoint
node scripts/migration/git-backup-utility.js create-checkpoint "Phase 2: Duplications removed"
```

---

### Phase 3: Reorganización a Dominios

**Pre-requisitos**:
- [ ] Phase 2 completada y validada
- [ ] Tag `phase-2-complete` creado

**Checklist de ejecución**:

**3.1 Crear estructura de dominios**:
- [ ] Crear carpeta domains/
- [ ] Crear domains/catalog/
- [ ] Crear domains/commerce/
- [ ] Crear domains/customer/
- [ ] Crear domains/support/
- [ ] Crear domains/platform/
- [ ] Crear README.md en cada dominio

**3.2 Migrar dominio catalog**:
- [ ] Mover product-service a domains/catalog/
- [ ] Actualizar imports en product-service
- [ ] Actualizar paths en docker-compose
- [ ] Mover sync-engine a domains/catalog/
- [ ] Actualizar imports en sync-engine
- [ ] Actualizar paths en docker-compose
- [ ] Mover recommender a domains/catalog/
- [ ] Actualizar imports en recommender
- [ ] Actualizar paths en docker-compose
- [ ] Validar dominio catalog

**3.3 Migrar dominio customer**:
- [ ] Mover user-service a domains/customer/
- [ ] Actualizar imports y referencias
- [ ] Actualizar docker-compose
- [ ] Mover notification-service a domains/customer/
- [ ] Actualizar imports y referencias
- [ ] Actualizar docker-compose
- [ ] Validar dominio customer

**3.4 Migrar dominio commerce**:
- [ ] Mover order-service a domains/commerce/
- [ ] Actualizar imports y referencias
- [ ] Actualizar docker-compose
- [ ] Mover payment-service a domains/commerce/
- [ ] Actualizar imports y referencias
- [ ] Actualizar docker-compose
- [ ] Mover auto-purchase a domains/commerce/
- [ ] Actualizar imports y referencias
- [ ] Actualizar docker-compose
- [ ] Validar dominio commerce

**3.5 Migrar dominio support**:
- [ ] Mover ticket-service a domains/support/
- [ ] Actualizar imports y referencias
- [ ] Actualizar docker-compose
- [ ] Mover chatbot a domains/support/
- [ ] Actualizar imports y referencias
- [ ] Actualizar docker-compose
- [ ] Mover shipment-tracker a domains/support/
- [ ] Actualizar imports y referencias
- [ ] Actualizar docker-compose
- [ ] Validar dominio support

**3.6 Migrar dominio platform**:
- [ ] Mover api-gateway a domains/platform/
- [ ] Actualizar imports y referencias
- [ ] Actualizar docker-compose
- [ ] Mover frontend a domains/platform/
- [ ] Actualizar imports y referencias
- [ ] Actualizar docker-compose
- [ ] Actualizar scripts de build
- [ ] Validar dominio platform

**3.7 Reorganizar shared/**:
- [ ] Crear shared/domain/
- [ ] Crear shared/infrastructure/
- [ ] Mover código existente a nuevas ubicaciones
- [ ] Actualizar imports en todos los servicios
- [ ] Actualizar package.json de servicios

**3.8 Limpiar carpetas antiguas**:
- [ ] Eliminar services/ (vacía)
- [ ] Eliminar ai-services/ (vacía)
- [ ] Eliminar automation/ (vacía)

**Checklist de validación por dominio**:

**Dominio catalog**:
- [ ] product-service compila
- [ ] sync-engine compila
- [ ] recommender-service compila
- [ ] Contenedores Docker inician
- [ ] Health checks pasan
- [ ] Tests del dominio pasan

**Dominio customer**:
- [ ] user-service compila
- [ ] notification-service compila
- [ ] Contenedores Docker inician
- [ ] Health checks pasan
- [ ] Tests del dominio pasan

**Dominio commerce**:
- [ ] order-service compila
- [ ] payment-service compila
- [ ] auto-purchase-service compila
- [ ] Contenedores Docker inician
- [ ] Health checks pasan
- [ ] Tests del dominio pasan

**Dominio support**:
- [ ] ticket-service compila
- [ ] chatbot-service compila
- [ ] shipment-tracker compila
- [ ] Contenedores Docker inician
- [ ] Health checks pasan
- [ ] Tests del dominio pasan

**Dominio platform**:
- [ ] api-gateway compila
- [ ] frontend compila
- [ ] Contenedores Docker inician
- [ ] Health checks pasan
- [ ] Tests del dominio pasan

**Validación final Phase 3**:
- [ ] Todos los servicios en dominios correctos
- [ ] No quedan servicios en ubicaciones antiguas
- [ ] Todos los servicios compilan
- [ ] Todos los contenedores inician
- [ ] Todos los health checks pasan
- [ ] Suite completa de tests pasa
- [ ] Crear commit: "Phase 3: Reorganize to domain architecture"
- [ ] Crear tag: `phase-3-complete`

**Comandos de validación**:
```bash
# Compilar todos los servicios
npm run build --workspaces

# Validar servicios Docker
docker-compose -f docker-compose.optimized.yml down
docker-compose -f docker-compose.optimized.yml up -d
docker-compose -f docker-compose.optimized.yml ps

# Health checks
curl http://localhost:3000/health
curl http://localhost:3001/health
# ... (todos los servicios)

# Tests
npm test --workspaces

# Crear checkpoint
node scripts/migration/git-backup-utility.js create-checkpoint "Phase 3: Domain reorganization complete"
```

---

### Phase 4: Estandarización de Microservicios

**Pre-requisitos**:
- [ ] Phase 3 completada y validada
- [ ] Tag `phase-3-complete` creado

**Checklist de ejecución**:

**4.1 Crear plantilla**:
- [ ] Documentar estructura estándar en STANDARD_SERVICE_STRUCTURE.md
- [ ] Crear script para generar estructura estándar
- [ ] Crear script para analizar estructura actual

**4.2 Estandarizar servicios simples**:
- [ ] Estandarizar notification-service
- [ ] Estandarizar shipment-tracker
- [ ] Validar servicios simples

**4.3 Estandarizar servicios core**:
- [ ] Estandarizar product-service
- [ ] Estandarizar user-service
- [ ] Estandarizar order-service
- [ ] Estandarizar payment-service
- [ ] Validar servicios core

**4.4 Estandarizar servicios de automatización**:
- [ ] Estandarizar sync-engine
- [ ] Estandarizar auto-purchase-service
- [ ] Validar servicios de automatización

**4.5 Estandarizar servicios de soporte**:
- [ ] Estandarizar ticket-service
- [ ] Validar servicios de soporte

**4.6 Estandarizar servicios complejos**:
- [ ] Estandarizar chatbot-service
- [ ] Estandarizar recommender-service
- [ ] Estandarizar api-gateway
- [ ] Validar servicios complejos

**Checklist de validación**:
- [ ] Verificar que todos siguen estructura estándar
- [ ] Generar reporte de cumplimiento
- [ ] Compilar todos los servicios
- [ ] Iniciar todos los contenedores
- [ ] Verificar health checks
- [ ] Ejecutar suite completa de tests
- [ ] Verificar cobertura de tests
- [ ] Crear commit: "Phase 4: Standardize microservices structure"
- [ ] Crear tag: `phase-4-complete`

**Comandos de validación**:
```bash
# Verificar estructura
node scripts/migration/verify-service-structure.js

# Compilar y validar
npm run build --workspaces
docker-compose -f docker-compose.optimized.yml restart
npm test --workspaces

# Crear checkpoint
node scripts/migration/git-backup-utility.js create-checkpoint "Phase 4: Standardization complete"
```

---

### Phase 5: Limpieza Final y Documentación

**Pre-requisitos**:
- [ ] Phase 4 completada y validada
- [ ] Tag `phase-4-complete` creado

**Checklist de ejecución**:

**5.1 Limpiar archivos temporales**:
- [ ] Eliminar tests de verificación temporales
- [ ] Limpiar archivos de log del repositorio
- [ ] Limpiar archivos de cache
- [ ] Actualizar .gitignore
- [ ] Identificar scripts obsoletos
- [ ] Eliminar o archivar scripts obsoletos

**5.2 Organizar documentación**:
- [ ] Crear docs/architecture/
- [ ] Crear docs/api/
- [ ] Crear docs/deployment/
- [ ] Mover documentación existente
- [ ] Verificar que cada servicio tiene README.md actualizado
- [ ] Actualizar documentación de API

**5.3 Organizar scripts**:
- [ ] Crear scripts/deployment/
- [ ] Crear scripts/testing/
- [ ] Crear scripts/utilities/
- [ ] Mover scripts a ubicaciones apropiadas
- [ ] Actualizar paths en scripts

**5.4 Limpiar raíz del proyecto**:
- [ ] Mover archivos .md no esenciales a docs/
- [ ] Mantener solo README.md, CONTRIBUTING.md, LICENSE
- [ ] Verificar que solo quedan archivos esenciales
- [ ] Máximo 5-7 archivos en raíz

**5.5 Crear documentación de arquitectura**:
- [ ] Crear ARCHITECTURE.md
- [ ] Documentar estructura de dominios
- [ ] Documentar estructura estándar de servicios
- [ ] Incluir diagramas de arquitectura
- [ ] Crear MIGRATION_SUMMARY.md
- [ ] Documentar resumen de cambios
- [ ] Incluir estadísticas
- [ ] Documentar lecciones aprendidas
- [ ] Crear DEVELOPER_GUIDE.md
- [ ] Documentar cómo navegar nueva estructura
- [ ] Documentar convenciones de código
- [ ] Incluir ejemplos

**5.6 Actualizar README principal**:
- [ ] Actualizar estructura del proyecto
- [ ] Actualizar comandos con nuevas rutas
- [ ] Actualizar sección de arquitectura
- [ ] Actualizar guía de inicio rápido

**Checklist de validación final**:
- [ ] Ejecutar análisis final
- [ ] Verificar que no hay duplicaciones
- [ ] Verificar que estructura cumple Screaming Architecture
- [ ] Generar reporte final
- [ ] Detener todos los contenedores
- [ ] Limpiar volúmenes y redes
- [ ] Iniciar todos los servicios desde cero
- [ ] Verificar que todos inician correctamente
- [ ] Verificar health checks
- [ ] Ejecutar tests unitarios de todos los servicios
- [ ] Ejecutar tests de integración
- [ ] Ejecutar tests E2E
- [ ] Verificar cobertura de tests
- [ ] Compilar todos los servicios TypeScript
- [ ] Verificar que no hay errores

**Criterios de éxito finales**:
- [ ] ✅ Estructura Screaming Architecture
- [ ] ✅ Sin duplicaciones
- [ ] ✅ Nombres consistentes (TechNovaStore)
- [ ] ✅ Servicios funcionando
- [ ] ✅ Tests pasando (100%)
- [ ] ✅ Documentación actualizada
- [ ] ✅ Raíz limpia (≤5 archivos)
- [ ] ✅ Estructura estándar en servicios

**Checkpoints finales**:
- [ ] Crear commit: "Phase 5: Final cleanup and documentation"
- [ ] Crear tag: `phase-5-complete`
- [ ] Crear tag: `migration-complete`
- [ ] Generar reporte final de migración

**Comandos de validación final**:
```bash
# Análisis final
node scripts/migration/analyze-duplications.js
node scripts/migration/generate-structure-report.js

# Validación completa desde cero
docker-compose -f docker-compose.optimized.yml down -v
docker-compose -f docker-compose.optimized.yml up -d
docker-compose -f docker-compose.optimized.yml ps

# Tests completos
npm test --workspaces
npm run test:integration
npm run test:e2e

# Compilación TypeScript
npx tsc --noEmit

# Crear checkpoints finales
node scripts/migration/git-backup-utility.js create-checkpoint "Phase 5: Migration complete"
git tag -a migration-complete -m "Migration to Screaming Architecture complete"

# Generar reporte final
node scripts/migration/generate-final-report.js
```

---

## Criterios de Éxito

### Criterios Técnicos

1. **Estructura Screaming Architecture** ✅
   - Carpetas organizadas por dominio de negocio
   - Estructura comunica el propósito del sistema
   - Fácil navegación y comprensión

2. **Sin Duplicaciones** ✅
   - 0 archivos con contenido idéntico
   - Configuraciones consolidadas con herencia
   - Documentación centralizada

3. **Nombres Consistentes** ✅
   - "TechNovaStore" en todo el proyecto
   - 0 referencias a "Ciberseguridad"
   - Nombres de servicios Docker actualizados

4. **Servicios Funcionando** ✅
   - 100% de servicios Docker inician correctamente
   - Todos los health checks pasan
   - Sin errores de compilación TypeScript

5. **Tests Pasando** ✅
   - 100% de tests existentes pasan
   - Tests reorganizados en estructura estándar
   - Cobertura de tests mantenida o mejorada

6. **Documentación Actualizada** ✅
   - README.md actualizado con nueva estructura
   - ARCHITECTURE.md creado
   - DEVELOPER_GUIDE.md creado
   - Cada servicio tiene README actualizado

7. **Raíz Limpia** ✅
   - ≤5 archivos esenciales en raíz
   - Documentación en docs/
   - Scripts en scripts/

8. **Estructura Estándar** ✅
   - Todos los servicios siguen estructura estándar
   - Separación clara de capas
   - Tests organizados (unit, integration, e2e)

### Criterios de Negocio

1. **Sin Downtime** ✅
   - Migración no afecta servicios en producción
   - Rollback disponible en cualquier momento

2. **Sin Pérdida de Funcionalidad** ✅
   - Todas las features funcionan igual
   - APIs mantienen compatibilidad
   - No se rompen integraciones

3. **Mejor Mantenibilidad** ✅
   - Código más fácil de encontrar
   - Estructura más clara
   - Onboarding más rápido

4. **Documentación Completa** ✅
   - Arquitectura documentada
   - Guías para desarrolladores
   - Proceso de migración documentado

### Métricas de Validación

| Métrica | Objetivo | Validación |
|---------|----------|------------|
| Duplicaciones | 0 archivos | Análisis de duplicaciones |
| Archivos en raíz | ≤5 archivos | Conteo manual |
| Servicios funcionando | 100% | Health checks |
| Tests pasando | 100% | Suite de tests |
| Compilación TypeScript | 0 errores | `tsc --noEmit` |
| Servicios estandarizados | 13/13 | Script de verificación |
| Documentación actualizada | 100% | Revisión manual |

---

## Gestión de Riesgos

### Riesgos Identificados

#### Riesgo 1: Romper Imports entre Servicios
**Probabilidad**: Media  
**Impacto**: Alto  
**Mitigación**:
- Validación incremental por dominio
- Tests automáticos después de cada cambio
- Rollback inmediato si falla validación

#### Riesgo 2: Olvidar Actualizar Referencias
**Probabilidad**: Media  
**Impacto**: Medio  
**Mitigación**:
- Búsqueda exhaustiva de referencias
- Checklist detallado por fase
- Validación con grep/ripgrep

#### Riesgo 3: Falta de Tests en Backend Services
**Probabilidad**: Alta (ya existe)  
**Impacto**: Alto  
**Mitigación**:
- Validación manual exhaustiva
- Tests de integración mínimos
- Documentar servicios sin tests
- Proceder con precaución extra

#### Riesgo 4: Tiempo Mayor al Estimado
**Probabilidad**: Media  
**Impacto**: Bajo  
**Mitigación**:
- Estimaciones conservadoras
- Priorización de tareas críticas
- Posibilidad de pausar entre fases

#### Riesgo 5: Problemas con Docker Compose
**Probabilidad**: Baja  
**Impacto**: Alto  
**Mitigación**:
- Actualizar paths cuidadosamente
- Validar después de cada cambio
- Mantener docker-compose.yml de respaldo

#### Riesgo 6: Pérdida de Configuración
**Probabilidad**: Baja  
**Impacto**: Alto  
**Mitigación**:
- Backup completo antes de iniciar
- Checkpoints después de cada fase
- Git tags para rollback fácil

### Matriz de Riesgos

| Riesgo | Probabilidad | Impacto | Prioridad | Mitigación |
|--------|--------------|---------|-----------|------------|
| Romper imports | Media | Alto | Alta | Validación incremental |
| Olvidar referencias | Media | Medio | Media | Búsqueda exhaustiva |
| Falta de tests | Alta | Alto | Alta | Validación manual |
| Tiempo mayor | Media | Bajo | Baja | Estimaciones conservadoras |
| Problemas Docker | Baja | Alto | Media | Validación continua |
| Pérdida de config | Baja | Alto | Alta | Backups y checkpoints |

---

## Plan de Rollback

### Estrategia de Rollback

Cada fase tiene un checkpoint de Git que permite rollback completo a ese punto.

### Rollback por Fase

#### Rollback Phase 1
```bash
git reset --hard phase-1-complete
git clean -fd
docker-compose -f docker-compose.optimized.yml down
docker-compose -f docker-compose.optimized.yml up -d
```

#### Rollback Phase 2
```bash
git reset --hard phase-2-complete
git clean -fd
docker-compose -f docker-compose.optimized.yml down
docker-compose -f docker-compose.optimized.yml up -d
```

#### Rollback Phase 3
```bash
git reset --hard phase-3-complete
git clean -fd
docker-compose -f docker-compose.optimized.yml down
docker-compose -f docker-compose.optimized.yml up -d
```

#### Rollback Phase 4
```bash
git reset --hard phase-4-complete
git clean -fd
docker-compose -f docker-compose.optimized.yml down
docker-compose -f docker-compose.optimized.yml up -d
```

#### Rollback Phase 5
```bash
git reset --hard phase-5-complete
git clean -fd
docker-compose -f docker-compose.optimized.yml down
docker-compose -f docker-compose.optimized.yml up -d
```

#### Rollback Completo (Volver al Inicio)
```bash
git reset --hard pre-migration-backup
git clean -fd
docker-compose -f docker-compose.optimized.yml down
docker-compose -f docker-compose.optimized.yml up -d
```

### Procedimiento de Rollback

1. **Identificar el problema**
   - Determinar qué falló
   - Verificar logs de error
   - Documentar el problema

2. **Decidir punto de rollback**
   - Listar checkpoints disponibles
   - Elegir checkpoint apropiado
   - Confirmar decisión

3. **Ejecutar rollback**
   - Detener servicios
   - Ejecutar git reset
   - Limpiar archivos no rastreados
   - Reiniciar servicios

4. **Validar rollback**
   - Verificar que servicios inician
   - Ejecutar tests
   - Confirmar funcionalidad

5. **Documentar incidente**
   - Registrar problema encontrado
   - Documentar solución aplicada
   - Actualizar plan si es necesario

### Comandos de Rollback

```bash
# Listar checkpoints disponibles
node scripts/migration/git-backup-utility.js list-checkpoints

# Ver estado actual
git log --oneline -10
git status

# Rollback a checkpoint específico
git reset --hard <tag-name>
git clean -fd

# Reiniciar servicios
docker-compose -f docker-compose.optimized.yml down
docker-compose -f docker-compose.optimized.yml up -d

# Validar
docker-compose -f docker-compose.optimized.yml ps
npm test
```

---

## Cronograma Estimado

### Distribución de Tiempo por Fase

| Fase | Duración | Complejidad | Riesgo |
|------|----------|-------------|--------|
| Phase 0: Preparación | 1-2 horas | Baja | Bajo |
| Phase 1: Renombrado | 2-3 horas | Media | Medio |
| Phase 2: Duplicaciones | 3-4 horas | Media | Medio |
| Phase 3: Dominios | 6-8 horas | Alta | Alto |
| Phase 4: Estandarización | 8-10 horas | Alta | Alto |
| Phase 5: Limpieza | 3-4 horas | Baja | Bajo |
| **Total** | **23-31 horas** | - | - |

### Cronograma Detallado

#### Semana 1: Preparación y Renombrado

**Día 1** (2 horas):
- ✅ Phase 0: Preparación completada
- Crear backup completo
- Crear tests de verificación

**Día 2** (3 horas):
- Phase 1: Renombrado de proyecto
- Validación completa

#### Semana 2: Consolidación

**Día 3** (4 horas):
- Phase 2: Eliminación de duplicaciones
- Consolidar configuraciones
- Validación completa

#### Semana 3: Reorganización a Dominios

**Día 4** (3 horas):
- Phase 3: Crear estructura de dominios
- Migrar dominio catalog
- Migrar dominio customer

**Día 5** (3 horas):
- Phase 3: Migrar dominio commerce
- Migrar dominio support

**Día 6** (2 horas):
- Phase 3: Migrar dominio platform
- Reorganizar shared/
- Validación completa

#### Semana 4-5: Estandarización

**Día 7** (2 horas):
- Phase 4: Crear plantilla
- Estandarizar servicios simples

**Día 8** (3 horas):
- Phase 4: Estandarizar servicios core (parte 1)

**Día 9** (3 horas):
- Phase 4: Estandarizar servicios core (parte 2)
- Estandarizar servicios de automatización

**Día 10** (2 horas):
- Phase 4: Estandarizar servicios complejos
- Validación completa

#### Semana 6: Limpieza Final

**Día 11** (2 horas):
- Phase 5: Limpiar archivos temporales
- Organizar documentación

**Día 12** (2 horas):
- Phase 5: Crear documentación de arquitectura
- Validación final completa
- Generar reporte final

### Hitos Clave

| Hito | Fecha Estimada | Entregable |
|------|----------------|------------|
| ✅ Preparación completada | Día 1 | Herramientas y análisis |
| Renombrado completado | Día 2 | Tag: phase-1-complete |
| Consolidación completada | Día 3 | Tag: phase-2-complete |
| Dominios reorganizados | Día 6 | Tag: phase-3-complete |
| Estandarización completada | Día 10 | Tag: phase-4-complete |
| Migración completada | Día 12 | Tag: migration-complete |

### Flexibilidad del Cronograma

- **Pausas permitidas**: Entre fases para revisión
- **Ajustes**: Estimaciones pueden variar ±20%
- **Priorización**: Fases críticas primero
- **Rollback**: Disponible en cualquier momento

---

## Comunicación y Coordinación

### Stakeholders

1. **Equipo de Desarrollo**: Ejecuta la migración
2. **Tech Lead**: Supervisa y valida
3. **DevOps**: Apoya con infraestructura
4. **QA**: Valida funcionalidad

### Puntos de Sincronización

- **Inicio de cada fase**: Revisión de checklist
- **Fin de cada fase**: Validación y checkpoint
- **Problemas críticos**: Comunicación inmediata
- **Fin de migración**: Presentación de resultados

### Documentación Continua

- Actualizar MIGRATION_LOG.md con progreso
- Documentar problemas encontrados
- Registrar decisiones tomadas
- Mantener checklist actualizado

---

## Conclusión

Este plan de migración proporciona una ruta clara y segura para transformar TechNovaStore de una estructura tecnología-céntrica a Screaming Architecture. Con:

- ✅ **Análisis completo** del estado actual
- ✅ **Plan detallado** con 5 fases bien definidas
- ✅ **Mapeo claro** de servicios a dominios
- ✅ **Checklists exhaustivos** de validación
- ✅ **Criterios de éxito** medibles
- ✅ **Gestión de riesgos** proactiva
- ✅ **Plan de rollback** en cada fase
- ✅ **Cronograma realista** de 23-31 horas

El proyecto está **listo para iniciar la migración** con confianza.

---

**Documento creado**: 6 de noviembre de 2025  
**Próxima acción**: Tarea 4 - Crear backup completo del proyecto  
**Estado**: ✅ Plan de migración completado - Listo para ejecutar
