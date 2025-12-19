# Implementation Plan

Este plan de implementación convierte el diseño de refactorización a Screaming Architecture en tareas ejecutables. Cada tarea está diseñada para ser incremental, validada y reversible.

## Estructura del Plan

El plan está organizado en 6 fases principales, cada una con tareas y subtareas específicas. Todas las tareas son obligatorias para asegurar una migración segura y completa.

---

## Phase 0: Preparación y Análisis

- [x] 1. Crear herramientas de análisis y migración





  - Crear script para analizar duplicaciones en el proyecto
  - Crear script para generar reporte de estructura actual
  - Crear utilidad para crear backups de Git
  - _Requirements: 2.1, 2.2, 6.1_

- [x] 2. Ejecutar análisis completo del proyecto



  - Ejecutar análisis de archivos duplicados (.env, configs, docs)
  - Generar reporte de duplicaciones con recomendaciones
  - Identificar archivos temporales y obsoletos
  - Documentar estructura actual en CURRENT_STRUCTURE.md
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Crear plan de migración detallado



  - Generar MIGRATION_PLAN.md con todas las fases
  - Documentar mapeo de servicios a dominios
  - Crear checklist de validación por fase
  - Definir criterios de éxito para cada fase
  - _Requirements: 8.1, 8.2_

- [x] 4. Crear backup completo del proyecto




  - Crear tag de Git: `pre-migration-backup`
  - Verificar que tag se creó correctamente
  - Documentar comando de rollback completo
  - _Requirements: 6.5, 9.2_

- [x] 4.1 Crear tests de verificación base


  - Crear test para verificar que servicios Docker inician
  - Crear test para verificar compilación TypeScript
  - Crear test para verificar que tests existentes pasan
  - _Requirements: 10.1, 10.2_

---

## Phase 1: Renombrado de Proyecto

- [x] 5. Buscar y documentar todas las referencias a "Ciberseguridad"



  - Buscar "Ciberseguridad" en todos los archivos
  - Buscar "ciberseguridad" en todos los archivos
  - Generar lista de archivos a modificar
  - Priorizar archivos por criticidad (Docker > configs > docs)
  - _Requirements: 1.1_

- [x] 6. Actualizar archivos docker-compose




- [x] 6.1 Actualizar docker-compose.yml



  - Reemplazar nombres de servicios "ciberseguridad" → "technovastore"
  - Actualizar nombres de imágenes Docker
  - Actualizar nombres de contenedores
  - Actualizar nombres de volúmenes
  - Actualizar nombres de redes
  - _Requirements: 1.2, 1.3, 1.4_

- [x] 6.2 Actualizar docker-compose.optimized.yml



  - Aplicar mismos cambios que en docker-compose.yml
  - Verificar que perfiles (core, ai, automation) están correctos
  - _Requirements: 1.2, 1.3, 1.4_

- [x] 6.3 Actualizar docker-compose.prod.yml



  - Aplicar mismos cambios para producción
  - Verificar configuración de producción
  - _Requirements: 1.2, 1.3, 1.4_

- [x] 6.4 Actualizar docker-compose.dev.yml y docker-compose.staging.yml





  - Aplicar cambios en archivos de desarrollo y staging
  - _Requirements: 1.2, 1.3, 1.4_

- [x] 7. Actualizar archivos package.json


- [x] 7.1 Actualizar package.json raíz





  - Cambiar nombre del proyecto
  - Actualizar descripción
  - Actualizar referencias en scripts
  - _Requirements: 1.2_

- [x] 7.2 Actualizar package.json de todos los microservicios





  - Actualizar @technovastore scope en todos los servicios
  - Verificar que dependencias compartidas usan nuevo nombre
  - _Requirements: 1.2_

- [x] 7.3 Actualizar package.json de shared packages




  - Actualizar nombres de paquetes compartidos
  - Actualizar referencias cruzadas
  - _Requirements: 1.2_

- [x] 8. Actualizar documentación principal





  - Actualizar README.md con nuevo nombre
  - Actualizar CONTRIBUTING.md
  - Actualizar DEPLOYMENT.md
  - Actualizar todos los archivos .md en raíz
  - _Requirements: 1.2_

- [x] 9. Actualizar scripts





  - Actualizar scripts de deployment (PowerShell y Bash)
  - Actualizar scripts de instalación
  - Actualizar scripts de verificación
  - _Requirements: 1.2, 7.4_

- [x] 10. Validar renombrado completo




- [x] 10.1 Ejecutar búsqueda de referencias antiguas





  - Buscar "Ciberseguridad" (debe retornar 0 resultados)
  - Buscar "ciberseguridad" (debe retornar 0 resultados)
  - _Requirements: 1.1, 1.5_

- [x] 10.2 Validar servicios Docker






  - Detener todos los contenedores
  - Eliminar contenedores antiguos
  - Iniciar servicios con nuevo nombre
  - Verificar que todos los servicios inician correctamente
  - Verificar health checks de servicios
  - _Requirements: 1.5, 6.1_

- [x] 10.3 Ejecutar tests de verificación





  - Ejecutar tests existentes (deben pasar 100%)
  - Ejecutar tests de verificación Docker
  - _Requirements: 1.5, 10.2_

- [x] 10.4 Crear checkpoint de Git


  - Commit: "Phase 1: Rename project to TechNovaStore"
  - Crear tag: `phase-1-complete`
  - _Requirements: 6.5_

---

## Phase 2: Eliminación de Duplicaciones

- [x] 11. Analizar y consolidar archivos .env




- [x] 11.1 Identificar archivos .env duplicados





  - Listar todos los archivos .env en el proyecto
  - Comparar contenido de archivos similares
  - Identificar variables duplicadas
  - _Requirements: 2.1_

- [x] 11.2 Crear estrategia de consolidación



  - Definir archivos .env a mantener
  - Definir archivos .env a eliminar
  - Crear plan de migración de variables
  - _Requirements: 2.4_

- [x] 11.3 Consolidar archivos .env



  - Mover variables únicas a archivos centralizados
  - Eliminar archivos .env duplicados
  - Actualizar referencias en docker-compose
  - Actualizar documentación de variables de entorno
  - _Requirements: 2.4, 7.2_

- [x] 12. Consolidar archivos de configuración


- [x] 12.1 Identificar configuraciones duplicadas





  - Buscar tsconfig.json duplicados
  - Buscar jest.config.js duplicados
  - Buscar .eslintrc duplicados
  - Buscar .prettierrc duplicados
  - _Requirements: 2.1_

- [x] 12.2 Consolidar configuraciones TypeScript




  - Crear tsconfig.base.json en raíz
  - Actualizar tsconfig.json de servicios para extender base
  - Eliminar configuraciones duplicadas
  - _Requirements: 2.4, 7.2_

- [x] 12.3 Consolidar configuraciones de testing



  - Crear jest.config.base.js en raíz
  - Actualizar configuraciones de servicios
  - _Requirements: 2.4_

- [x] 12.4 Consolidar configuraciones de linting



  - Verificar que .eslintrc.js y .prettierrc son únicos
  - Actualizar referencias si es necesario
  - _Requirements: 2.4_

- [ ] 13. Consolidar documentación
- [x] 13.1 Identificar documentación duplicada





  - Buscar README duplicados
  - Buscar guías duplicadas
  - Buscar documentación obsoleta
  - _Requirements: 2.2_

- [x] 13.2 Consolidar documentación técnica



  - Mover documentación a docs/ centralizado
  - Eliminar documentación duplicada
  - Actualizar índice de documentación
  - _Requirements: 2.2, 2.5_

- [x] 14. Eliminar archivos temporales y obsoletos


- [x] 14.1 Identificar archivos temporales



  - Buscar archivos .example innecesarios
  - Buscar archivos .backup, .old, .copy
  - Buscar archivos de log en repositorio
  - Buscar archivos de test temporales
  - _Requirements: 2.3_

- [x] 14.2 Eliminar archivos temporales



  - Eliminar archivos identificados
  - Actualizar .gitignore si es necesario
  - _Requirements: 2.3, 4.4_

- [x] 15. Validar eliminación de duplicaciones


- [x] 15.1 Verificar que no hay duplicaciones




  - Ejecutar análisis de duplicaciones nuevamente
  - Verificar que reporte muestra 0 duplicaciones
  - _Requirements: 2.5_

- [x] 15.2 Validar servicios funcionan



  - Iniciar todos los servicios Docker
  - Verificar que servicios inician correctamente
  - Verificar health checks
  - _Requirements: 6.1, 9.4_

- [x] 15.3 Ejecutar tests



  - Ejecutar suite completa de tests
  - Verificar que todos los tests pasan
  - _Requirements: 9.4_

- [x] 15.4 Crear checkpoint de Git


  - Commit: "Phase 2: Remove duplications and consolidate configs"
  - Crear tag: `phase-2-complete`
  - _Requirements: 6.5_

---

## Phase 3: Reorganización a Dominios

- [x] 16. Crear estructura de dominios






- [x] 16.1 Crear carpetas de dominios

  - Crear carpeta domains/
  - Crear domains/catalog/
  - Crear domains/commerce/
  - Crear domains/customer/
  - Crear domains/support/
  - Crear domains/platform/
  - _Requirements: 3.1, 3.7_


- [x] 16.2 Crear estructura interna de cada dominio

  - Crear README.md en cada dominio explicando su propósito
  - Preparar estructura para recibir servicios
  - _Requirements: 3.1_

- [x] 17. Migrar dominio catalog
- [x] 17.1 Mover product-service a domains/catalog/




  - Mover carpeta services/product/ a domains/catalog/product-service/
  - Actualizar imports en el servicio
  - Actualizar paths en docker-compose
  - Actualizar Dockerfile si es necesario
  - _Requirements: 3.2, 3.3, 7.1, 7.2_

- [x] 17.2 Mover sync-engine a domains/catalog/
  - Mover automation/sync-engine/ a domains/catalog/sync-engine/
  - Actualizar imports y referencias
  - Actualizar docker-compose
  - _Requirements: 3.2, 3.3, 7.1, 7.2_

- [x] 17.3 Mover recommender a domains/catalog/
  - Mover ai-services/recommender/ a domains/catalog/recommender-service/
  - Actualizar imports y referencias
  - Actualizar docker-compose
  - _Requirements: 3.2, 3.3, 7.1, 7.2_

- [x] 17.4 Validar dominio catalog
  - Compilar servicios del dominio
  - Iniciar contenedores Docker del dominio
  - Verificar health checks
  - Ejecutar tests de los servicios
  - _Requirements: 6.1, 6.2, 9.4_

- [x] 18. Migrar dominio customer
- [x] 18.1 Mover user-service a domains/customer/
  - Mover services/user/ a domains/customer/user-service/
  - Actualizar imports y referencias
  - Actualizar docker-compose
  - _Requirements: 3.2, 3.3, 7.1, 7.2_

- [x] 18.2 Mover notification-service a domains/customer/
  - Mover services/notification/ a domains/customer/notification-service/
  - Actualizar imports y referencias
  - Actualizar docker-compose
  - _Requirements: 3.2, 3.3, 7.1, 7.2_

- [x] 18.3 Validar dominio customer
  - Compilar servicios del dominio
  - Iniciar contenedores Docker
  - Verificar health checks
  - Ejecutar tests
  - _Requirements: 6.1, 6.2, 9.4_

- [x] 19. Migrar dominio commerce
- [x] 19.1 Mover order-service a domains/commerce/
  - Mover services/order/ a domains/commerce/order-service/
  - Actualizar imports y referencias
  - Actualizar docker-compose
  - _Requirements: 3.2, 3.3, 7.1, 7.2_

- [x] 19.2 Mover payment-service a domains/commerce/
  - Mover services/payment/ a domains/commerce/payment-service/
  - Actualizar imports y referencias
  - Actualizar docker-compose
  - _Requirements: 3.2, 3.3, 7.1, 7.2_

- [x] 19.3 Mover auto-purchase a domains/commerce/
  - Mover automation/auto-purchase/ a domains/commerce/auto-purchase-service/
  - Actualizar imports y referencias
  - Actualizar docker-compose
  - _Requirements: 3.2, 3.3, 7.1, 7.2_

- [x] 19.4 Validar dominio commerce
  - Compilar servicios del dominio
  - Iniciar contenedores Docker
  - Verificar health checks
  - Ejecutar tests
  - _Requirements: 6.1, 6.2, 9.4_

- [x] 20. Migrar dominio support
- [x] 20.1 Mover ticket-service a domains/support/
  - Mover services/ticket/ a domains/support/ticket-service/
  - Actualizar imports y referencias
  - Actualizar docker-compose
  - _Requirements: 3.2, 3.3, 7.1, 7.2_

- [x] 20.2 Mover chatbot a domains/support/
  - Mover ai-services/chatbot/ a domains/support/chatbot-service/
  - Actualizar imports y referencias
  - Actualizar docker-compose
  - _Requirements: 3.2, 3.3, 7.1, 7.2_

- [x] 20.3 Mover shipment-tracker a domains/support/
  - Mover automation/shipment-tracker/ a domains/support/shipment-tracker/
  - Actualizar imports y referencias
  - Actualizar docker-compose
  - _Requirements: 3.2, 3.3, 7.1, 7.2_

- [x] 20.4 Validar dominio support
  - Compilar servicios del dominio
  - Iniciar contenedores Docker
  - Verificar health checks
  - Ejecutar tests
  - _Requirements: 6.1, 6.2, 9.4_

- [ ] 21. Migrar dominio platform
- [x] 21.1 Mover api-gateway a domains/platform/
  - Mover api-gateway/ a domains/platform/api-gateway/
  - Actualizar imports y referencias
  - Actualizar docker-compose
  - _Requirements: 3.2, 3.3, 7.1, 7.2_

- [x] 21.2 Mover frontend a domains/platform/
  - Mover frontend/ a domains/platform/frontend/
  - Actualizar imports y referencias
  - Actualizar docker-compose
  - Actualizar scripts de build
  - _Requirements: 3.2, 3.3, 7.1, 7.2_

- [x] 21.3 Validar dominio platform
  - Compilar servicios del dominio
  - Iniciar contenedores Docker
  - Verificar health checks
  - Ejecutar tests
  - _Requirements: 6.1, 6.2, 9.4_

- [ ] 22. Reorganizar código compartido (shared)
- [x] 22.1 Reorganizar shared/ por propósito
  - Crear shared/domain/ para lógica de dominio compartida
  - Crear shared/infrastructure/ para utilidades de infraestructura
  - Mover código existente a nuevas ubicaciones
  - _Requirements: 3.4_

- [x] 22.2 Actualizar referencias a shared
  - Actualizar imports en todos los servicios
  - Actualizar package.json de servicios
  - _Requirements: 7.1, 7.2_

- [x] 23. Eliminar carpetas antiguas vacías
  - Eliminar services/ (ahora vacía)
  - Eliminar ai-services/ (ahora vacía)
  - Eliminar automation/ (ahora vacía)
  - _Requirements: 3.2_

- [x] 24. Validar reorganización completa
- [x] 24.1 Validar estructura de dominios
  - Verificar que todos los servicios están en dominios correctos
  - Verificar que no quedan servicios en ubicaciones antiguas
  - _Requirements: 3.1, 3.2_

- [x] 24.2 Validar todos los servicios
  - Iniciar todos los contenedores Docker
  - Verificar que todos los servicios inician
  - Verificar health checks de todos los servicios
  - _Requirements: 6.1, 6.2_

- [x] 24.3 Ejecutar suite completa de tests
  - Ejecutar tests de todos los servicios
  - Verificar que todos los tests pasan
  - _Requirements: 9.4_

- [x] 24.4 Crear checkpoint de Git
  - Commit: "Phase 3: Reorganize to domain architecture"
  - Crear tag: `phase-3-complete`
  - _Requirements: 6.5_

---

## Phase 4: Estandarización de Microservicios con Screaming Architecture

**IMPORTANTE**: Todos los servicios deben seguir Screaming Architecture con:
- Organización por casos de uso (carpetas con nombres de negocio)
- Tests junto al código que prueban (dentro de cada carpeta de caso de uso)
- Infraestructura compartida en shared/
- Capa API separada en api/
- NO usar carpetas técnicas (domain/, application/, infrastructure/, presentation/)
- NO usar carpeta test/ separada

**REGLA CRÍTICA DE REFACTORIZACIÓN**:
- ⚠️ **NUNCA reescribir código desde cero**
- ✅ **SIEMPRE refactorizar código existente**
- ✅ **MANTENER toda la lógica y funcionalidad original**
- ✅ **SOLO reorganizar archivos y estructura**
- ✅ **Verificar que tests originales siguen pasando**

- [x] 25. Crear plantilla de estructura estándar con Screaming Architecture
  - Documentar estructura estándar en STANDARD_SERVICE_STRUCTURE.md
  - Crear script para generar estructura estándar por casos de uso
  - Crear script para analizar estructura actual de servicio
  - _Requirements: 5.1, 5.2, 5.6, 5.7_

- [x] 26. Estandarizar servicios simples con Screaming Architecture (notification, shipment-tracker)
- [x] 26.1 Estandarizar notification-service con Screaming Architecture
  - **IMPORTANTE**: REFACTORIZAR código existente, NO reescribir desde cero
  - Leer y analizar código actual en src/services/NotificationService.ts
  - Identificar métodos existentes como casos de uso (sendOrderConfirmation → send-order-confirmation)
  - Crear carpetas por caso de uso basadas en métodos existentes
  - Extraer lógica de cada método a su carpeta de caso de uso (MANTENER lógica original)
  - Mover EmailService y TemplateService a shared/email/ y shared/templates/
  - Mover DelayDetector a shared/utils/
  - Reorganizar controladores y rutas existentes en capa api/ (extraer de src/controllers/ y src/routes/)
  - Actualizar imports manteniendo funcionalidad original
  - Validar que tests pasan y servicio funciona EXACTAMENTE igual que antes
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 26.2 Estandarizar shipment-tracker con Screaming Architecture
  - **IMPORTANTE**: REFACTORIZAR código existente, NO reescribir desde cero
  - Leer y analizar código actual en src/services/ShipmentTracker.ts
  - Identificar métodos existentes como casos de uso
  - Crear carpetas por caso de uso basadas en métodos existentes
  - Extraer lógica de cada método a su carpeta (MANTENER lógica original)
  - Extraer tests existentes y moverlos junto a cada caso de uso
  - Mover providers a shared/providers/
  - Mover NotificationService a shared/clients/
  - Reorganizar controladores y rutas existentes en capa api/ (extraer de src/controllers/ y src/routes/)
  - Actualizar imports y referencias manteniendo funcionalidad original
  - Validar que tests pasan y servicio funciona EXACTAMENTE igual que antes
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 27. Estandarizar servicios core con Screaming Architecture (product, user, order, payment)
- [x] 27.1 Estandarizar product-service con Screaming Architecture
  - **IMPORTANTE**: REFACTORIZAR código existente, NO reescribir desde cero
  - Leer y analizar código actual del servicio
  - Identificar casos de uso (create-product, update-product, search-products, etc.)
  - Crear carpetas por caso de uso basadas en funcionalidad existente
  - Extraer lógica existente a cada carpeta de caso de uso (MANTENER lógica original)
  - Extraer tests existentes y moverlos junto a cada caso de uso
  - Consolidar infraestructura en shared/
  - Reorganizar controladores y rutas existentes en capa api/ (extraer de src/controllers/ y src/routes/)
  - Actualizar imports y referencias manteniendo funcionalidad original
  - Validar que tests pasan y servicio funciona EXACTAMENTE igual que antes
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 27.2 Estandarizar user-service con Screaming Architecture
  - **IMPORTANTE**: REFACTORIZAR código existente, NO reescribir desde cero
  - **ESTRUCTURA**: Casos de uso EN LA RAÍZ del servicio (NO dentro de src/)
  - Leer y analizar código actual del servicio (src/services/, src/controllers/, src/models/)
  - Identificar métodos existentes como casos de uso (register-user, authenticate-user, update-profile, etc.)
  - Crear carpetas por caso de uso EN LA RAÍZ basadas en funcionalidad existente
  - Extraer lógica de cada método a su carpeta de caso de uso (MANTENER lógica original)
  - Crear tests MUY COMPLETOS para cada caso de uso (mínimo 10-15 tests por caso de uso)
  - Consolidar infraestructura en shared/ EN LA RAÍZ (modelos, repositorios, validadores, middleware, utils)
  - Reorganizar controladores y rutas en api/ EN LA RAÍZ (extraer de src/controllers/ y src/routes/)
  - Actualizar imports y referencias manteniendo funcionalidad original
  - Validar que tests pasan y servicio funciona EXACTAMENTE igual que antes
  - **BORRAR completamente** las carpetas src/ y dist/ antiguas una vez validado todo
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 27.3 Estandarizar order-service con Screaming Architecture
  - **IMPORTANTE**: REFACTORIZAR código existente, NO reescribir desde cero
  - **ESTRUCTURA**: Casos de uso EN LA RAÍZ del servicio (NO dentro de src/)
  - Leer y analizar código actual del servicio (src/services/, src/controllers/, src/models/)
  - Identificar métodos existentes como casos de uso (create-order, update-order-status, cancel-order, etc.)
  - Crear carpetas por caso de uso EN LA RAÍZ basadas en funcionalidad existente
  - Extraer lógica de cada método a su carpeta de caso de uso (MANTENER lógica original)
  - Crear tests MUY COMPLETOS para cada caso de uso (mínimo 10-15 tests por caso de uso)
  - Consolidar infraestructura en shared/ EN LA RAÍZ (modelos, repositorios, validadores, utils)
  - Reorganizar controladores y rutas en api/ EN LA RAÍZ (extraer de src/controllers/ y src/routes/)
  - Actualizar imports y referencias manteniendo funcionalidad original
  - Validar que tests pasan y servicio funciona EXACTAMENTE igual que antes
  - **BORRAR completamente** las carpetas src/ y dist/ antiguas una vez validado todo
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 27.4 Estandarizar payment-service con Screaming Architecture
  - **IMPORTANTE**: REFACTORIZAR código existente, NO reescribir desde cero
  - **ESTRUCTURA**: Casos de uso EN LA RAÍZ del servicio (NO dentro de src/)
  - Leer y analizar código actual del servicio (src/services/, src/controllers/, src/models/)
  - Identificar métodos existentes como casos de uso (process-payment, refund-payment, verify-payment, etc.)
  - Crear carpetas por caso de uso EN LA RAÍZ basadas en funcionalidad existente
  - Extraer lógica de cada método a su carpeta de caso de uso (MANTENER lógica original)
  - Crear tests MUY COMPLETOS para cada caso de uso (mínimo 10-15 tests por caso de uso)
  - Consolidar infraestructura en shared/ EN LA RAÍZ (modelos, repositorios, providers de pago, utils)
  - Reorganizar controladores y rutas en api/ EN LA RAÍZ (extraer de src/controllers/ y src/routes/)
  - Actualizar imports y referencias manteniendo funcionalidad original
  - Validar que tests pasan y servicio funciona EXACTAMENTE igual que antes
  - **BORRAR completamente** las carpetas src/ y dist/ antiguas una vez validado todo
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 28. Estandarizar servicios de automatización con Screaming Architecture
- [x] 28.1 Estandarizar sync-engine con Screaming Architecture
  - **IMPORTANTE**: REFACTORIZAR código existente, NO reescribir desde cero
  - **ESTRUCTURA**: Casos de uso EN LA RAÍZ del servicio (NO dentro de src/)
  - Leer y analizar código actual del servicio (src/services/, src/controllers/, src/models/)
  - Identificar métodos existentes como casos de uso (sync-products, sync-inventory, sync-prices, etc.)
  - Crear carpetas por caso de uso EN LA RAÍZ basadas en funcionalidad existente
  - Extraer lógica de cada método a su carpeta de caso de uso (MANTENER lógica original)
  - Crear tests MUY COMPLETOS para cada caso de uso (mínimo 10-15 tests por caso de uso)
  - Consolidar infraestructura en shared/ EN LA RAÍZ (modelos, clientes externos, transformadores, schedulers, utils)
  - Reorganizar controladores y rutas en api/ EN LA RAÍZ (extraer de src/controllers/ y src/routes/)
  - Actualizar imports y referencias manteniendo funcionalidad original
  - Validar que tests pasan y servicio funciona EXACTAMENTE igual que antes
  - **BORRAR completamente** las carpetas src/ y dist/ antiguas una vez validado todo
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 28.2 Estandarizar auto-purchase-service con Screaming Architecture
  - **IMPORTANTE**: REFACTORIZAR código existente, NO reescribir desde cero
  - **ESTRUCTURA**: Casos de uso EN LA RAÍZ del servicio (NO dentro de src/)
  - Leer y analizar código actual del servicio (src/services/, src/controllers/, src/models/)
  - Identificar métodos existentes como casos de uso (schedule-purchase, execute-purchase, verify-purchase, etc.)
  - Crear carpetas por caso de uso EN LA Rpeta de caso de uso (MANTENER lógica original)
  - Extraer tests existentes y moverlos junto a cada caso de uso
  - Consolidar infraestructura en shared/ (schedulers, clientes de pago, validadores, etc.)
  - Reorganizar controladores y rutas existentes en capa api/ (extraer de src/controllers/ y src/routes/)
  - Actualizar imports y referencias manteniendo funcionalidad original
  - Validar que tests pasan y servicio funciona EXACTAMENTE igual que antes
  - **BORRAR completamente** las carpetas src/ y dist/ antiguas una vez validado todo
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 29. Estandarizar servicios de soporte
- [x] 29.1 Estandarizar ticket-service con Screaming Architecture
  - **IMPORTANTE**: REFACTORIZAR código existente, NO reescribir desde cero
  - **ESTRUCTURA**: Casos de uso EN LA RAÍZ del servicio (NO dentro de src/)
  - Leer y analizar código actual del servicio (src/services/, src/controllers/)
  - Identificar métodos existentes como casos de uso (create-ticket, assign-ticket, resolve-ticket, etc.)
  - Crear carpetas por caso de uso basadas en funcionalidad existente
  - Extraer lógica de cada método a su carpeta de caso de uso (MANTENER lógica original)
  - Extraer tests existentes y moverlos junto a cada caso de uso
  - Consolidar infraestructura en shared/ (repositorios, notificadores, models, etc.)
  - Reorganizar controladores y rutas existentes en capa api/ (extraer de src/controllers/ y src/routes/)
  - Actualizar imports y referencias manteniendo funcionalidad original
  - Validar que tests pasan y servicio funciona EXACTAMENTE igual que antes
  - **BORRAR completamente** las carpetas src/ y dist/ antiguas una vez validado todo
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 30. Estandarizar servicios complejos (chatbot, recommender, api-gateway)
- [x] 30.1 Estandarizar chatbot-service con Screaming Architecture
  - **IMPORTANTE**: REFACTORIZAR código existente, NO reescribir desde cero
  - **ESTRUCTURA**: Casos de uso EN LA RAÍZ del servicio (NO dentro de src/)
  - Leer y analizar código actual del servicio (estructura más compleja con IA, src/services/, src/controllers/)
  - Identificar métodos existentes como casos de uso (process-message, recognize-intent, generate-response, etc.)
  - Crear carpetas por caso de uso basadas en funcionalidad existente
  - Extraer lógica de cada método a su carpeta de caso de uso (MANTENER lógica original)
  - Extraer tests existentes y moverlos junto a cada caso de uso
  - Consolidar infraestructura en shared/ (clientes Ollama, recognizers, knowledge base, etc.)
  - Reorganizar controladores y rutas existentes en capa api/ (extraer de src/controllers/ y src/routes/)
  - Actualizar imports y referencias manteniendo funcionalidad original
  - Validar que tests pasan y servicio funciona EXACTAMENTE igual que antes
  - **BORRAR completamente** las carpetas src/ y dist/ antiguas una vez validado todo
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 30.2 Estandarizar recommender-service con Screaming Architecture
  - **IMPORTANTE**: REFACTORIZAR código existente, NO reescribir desde cero
  - **ESTRUCTURA**: Casos de uso EN LA RAÍZ del servicio (NO dentro de src/)
  - Leer y analizar código actual del servicio (servicio de ML/recomendaciones, src/services/, src/controllers/)
  - Identificar métodos existentes como casos de uso (get-recommendations, calculate-similarity, update-user-preferences, etc.)
  - Crear carpetas por caso de uso basadas en funcionalidad existente
  - Extraer lógica de cada método a su carpeta de caso de uso (MANTENER lógica original)
  - Extraer tests existentes y moverlos junto a cada caso de uso
  - Consolidar infraestructura en shared/ (algoritmos ML, calculadores, repositorios, etc.)
  - Reorganizar controladores y rutas existentes en capa api/ (extraer de src/controllers/ y src/routes/)
  - Actualizar imports y referencias manteniendo funcionalidad original
  - Validar que tests pasan y servicio funciona EXACTAMENTE igual que antes
  - **BORRAR completamente** las carpetas src/ y dist/ antiguas una vez validado todo
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 30.3 Estandarizar api-gateway con Screaming Architecture
  - **IMPORTANTE**: REFACTORIZAR código existente, NO reescribir desde cero
  - **ESTRUCTURA**: Casos de uso EN LA RAÍZ del servicio (NO dentro de src/)
  - Leer y analizar código actual del servicio (gateway con routing y middleware, src/services/, src/controllers/)
  - Identificar métodos existentes como casos de uso (route-request, authenticate-request, rate-limit, etc.)
  - Crear carpetas por caso de uso basadas en funcionalidad existente
  - Extraer lógica de cada método a su carpeta de caso de uso (MANTENER lógica original)
  - Extraer tests existentes y moverlos junto a cada caso de uso
  - Consolidar infraestructura en shared/ (middleware, clientes de servicios, etc.)
  - Reorganizar controladores y rutas existentes en capa api/ (extraer de src/controllers/ y src/routes/)
  - Actualizar imports y referencias manteniendo funcionalidad original
  - Validar que tests pasan y servicio funciona EXACTAMENTE igual que antes
  - **BORRAR completamente** las carpetas src/ y dist/ antiguas una vez validado todo
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 31. Validar estandarización completa
- [x] 31.1 Verificar estructura de todos los servicios
  - Verificar que todos siguen estructura screaming architecture
  - Generar reporte de cumplimiento
  - _Requirements: 5.5_

- [x] 31.2 Validar todos los servicios
  - Compilar todos los servicios
  - Iniciar todos los contenedores (ya estan iniciados)
  - Verificar health checks (el sync-engine es normal que esté unhealthy)
  - _Requirements: 6.1, 6.2, 9.4_

- [x] 31.3 Ejecutar suite completa de tests
  - Ejecutar tests de todos los servicios
  - Verificar cobertura de tests
  - _Requirements: 9.4_

- [x] 31.4 Crear checkpoint de Git
  - Commit: "Phase 4: Standardize microservices structure"
  - Crear tag: `phase-4-complete`
  - _Requirements: 6.5_

---

## Phase 5: Limpieza Final y Documentación

- [x] 32. Limpiar archivos temporales
- [x] 32.1 Eliminar tests de verificación temporales
  - Eliminar tests creados específicamente para migración
  - Mantener solo tests permanentes
  - _Requirements: 10.5_

- [x] 32.2 Limpiar archivos de log y cache
  - Eliminar archivos de log del repositorio
  - Limpiar archivos de cache
  - Actualizar .gitignore
  - _Requirements: 4.4_

- [x] 32.3 Limpiar scripts obsoletos
  - Identificar scripts que ya no son necesarios
  - Eliminar o archivar scripts obsoletos
  - _Requirements: 4.3_

- [x] 33. Organizar documentación
- [x] 33.1 Reorganizar docs/
  - Crear docs/architecture/
  - Crear docs/api/
  - Crear docs/deployment/
  - Mover documentación existente a ubicaciones apropiadas
  - _Requirements: 3.6, 4.2_

- [x] 33.2 Actualizar documentación de servicios
  - Verificar que cada servicio tiene README.md actualizado
  - Actualizar documentación de API
  - _Requirements: 5.5_

- [x] 34. Organizar scripts
- [x] 34.1 Reorganizar scripts/
  - Crear scripts/deployment/
  - Crear scripts/testing/
  - Crear scripts/utilities/
  - Mover scripts a ubicaciones apropiadas
  - _Requirements: 4.3_

- [x] 34.2 Actualizar scripts con nuevas rutas
  - Actualizar paths en scripts de deployment
  - Actualizar paths en scripts de testing
  - _Requirements: 7.4_

- [x] 35. Limpiar raíz del proyecto
- [x] 35.1 Mover archivos de documentación
  - Mover archivos .md no esenciales a docs/
  - Mantener solo README.md, CONTRIBUTING.md, LICENSE en raíz (los archivos de package, jest, docker-compose, env y demas archivos importante no los muevas o si los mueves debemos actualizar todas los microservicios y referencias que se hagan a estos archivos)
  - _Requirements: 4.1, 4.5_

- [x] 35.2 Verificar archivos esenciales en raíz
  - Verificar que solo quedan archivos esenciales
  - Máximo 5-7 archivos en raíz (los archivos de package, jest, docker-compose, env y demas archivos importante no los muevas o si los mueves debemos actualizar todas los microservicios y referencias que se hagan a estos archivos)
  - _Requirements: 4.5_

- [x] 36. Crear documentación de arquitectura
- [x] 36.1 Crear ARCHITECTURE.md (EN PROGRESO)
  - Documentar nueva estructura de dominios
  - Documentar estructura estándar de servicios
  - Incluir diagramas de arquitectura
  - _Requirements: 8.4_

- [x] 36.2 Crear MIGRATION_SUMMARY.md
  - Documentar resumen de cambios realizados
  - Incluir estadísticas (archivos movidos, eliminados, etc.)
  - Documentar lecciones aprendidas
  - _Requirements: 8.2, 8.4_

- [x] 36.3 Crear DEVELOPER_GUIDE.md
  - Documentar cómo navegar nueva estructura
  - Documentar convenciones de código
  - Incluir ejemplos de nuevas rutas
  - _Requirements: 8.5_

- [x] 37. Actualizar README principal
  - Actualizar estructura del proyecto en README.md
  - Actualizar comandos con nuevas rutas
  - Actualizar sección de arquitectura
  - Actualizar guía de inicio rápido
  - _Requirements: 8.1_

- [x] 38. Validación final completa
- [x] 38.1 Ejecutar análisis final
  - Verificar que no hay duplicaciones
  - Verificar que estructura cumple Screaming Architecture
  - Generar reporte final
  - _Requirements: 3.1, 3.2_

- [x] 38.2 Validar todos los servicios
  - Detener todos los contenedores
  - Limpiar volúmenes y redes
  - Iniciar todos los servicios desde cero 
  - Verificar que todos inician correctamente
  - Verificar health checks
  - _Requirements: 6.1, 6.2, 9.1_

- [x] 38.3 Ejecutar suite completa de tests
  - Ejecutar tests unitarios de todos los servicios
  - Ejecutar tests de integración
  - Ejecutar tests E2E
  - Verificar cobertura de tests
  - _Requirements: 9.4_

- [x] 38.4 Validar compilación TypeScript
  - Compilar todos los servicios
  - Verificar que no hay errores de TypeScript
  - _Requirements: 7.5_

- [x] 38.5 Verificar criterios de éxito
  - ✅ Estructura Screaming Architecture (obviando el frontend)
  - ✅ Sin duplicaciones
  - ✅ Nombres consistentes (TechNovaStore)
  - ✅ Servicios funcionando
  - ✅ Tests pasando (100%)
  - ✅ Documentación actualizada
  - ✅ Raíz limpia (≤5 archivos)
  - ✅ Estructura estándar en servicios
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 38.6 Crear checkpoint final
  - Commit: "Phase 5: Final cleanup and documentation"
  - Crear tag: `phase-5-complete`
  - Crear tag: `migration-complete`
  - _Requirements: 6.5_

- [x] 39. Generar reporte final de migración
  - Generar estadísticas de migración
  - Documentar tiempo total invertido
  - Documentar problemas encontrados y soluciones
  - Crear reporte ejecutivo
  - _Requirements: 8.2, 8.4_

---

## Notas Importantes

### Orden de Ejecución
- Las tareas deben ejecutarse en orden secuencial
- No saltar fases sin completar la anterior
- Validar después de cada fase antes de continuar

### Validación Continua
- Ejecutar validación después de cada cambio crítico
- No continuar si la validación falla
- Usar rollback si es necesario

### Tests de Verificación
- Todos los tests de verificación son obligatorios para asegurar migración segura
- Crear tests de verificación al inicio de cada fase
- Eliminar tests de verificación al final de la migración

### Checkpoints de Git
- Crear commit después de cada fase completada
- Crear tags para facilitar rollback
- Mantener mensajes de commit descriptivos

### Tiempo Estimado
- **Phase 0**: 1-2 horas
- **Phase 1**: 2-3 horas
- **Phase 2**: 3-4 horas
- **Phase 3**: 6-8 horas
- **Phase 4**: 8-10 horas
- **Phase 5**: 3-4 horas
- **Total**: 23-31 horas

### Rollback
- Si algo falla, usar `git reset --hard <tag>` para volver al checkpoint anterior
- Ejemplo: `git reset --hard phase-2-complete`

