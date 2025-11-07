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

- [ ] 19. Migrar dominio commerce
- [ ] 19.1 Mover order-service a domains/commerce/
  - Mover services/order/ a domains/commerce/order-service/
  - Actualizar imports y referencias
  - Actualizar docker-compose
  - _Requirements: 3.2, 3.3, 7.1, 7.2_

- [ ] 19.2 Mover payment-service a domains/commerce/
  - Mover services/payment/ a domains/commerce/payment-service/
  - Actualizar imports y referencias
  - Actualizar docker-compose
  - _Requirements: 3.2, 3.3, 7.1, 7.2_

- [ ] 19.3 Mover auto-purchase a domains/commerce/
  - Mover automation/auto-purchase/ a domains/commerce/auto-purchase-service/
  - Actualizar imports y referencias
  - Actualizar docker-compose
  - _Requirements: 3.2, 3.3, 7.1, 7.2_

- [ ] 19.4 Validar dominio commerce
  - Compilar servicios del dominio
  - Iniciar contenedores Docker
  - Verificar health checks
  - Ejecutar tests
  - _Requirements: 6.1, 6.2, 9.4_

- [ ] 20. Migrar dominio support
- [ ] 20.1 Mover ticket-service a domains/support/
  - Mover services/ticket/ a domains/support/ticket-service/
  - Actualizar imports y referencias
  - Actualizar docker-compose
  - _Requirements: 3.2, 3.3, 7.1, 7.2_

- [ ] 20.2 Mover chatbot a domains/support/
  - Mover ai-services/chatbot/ a domains/support/chatbot-service/
  - Actualizar imports y referencias
  - Actualizar docker-compose
  - _Requirements: 3.2, 3.3, 7.1, 7.2_

- [ ] 20.3 Mover shipment-tracker a domains/support/
  - Mover automation/shipment-tracker/ a domains/support/shipment-tracker/
  - Actualizar imports y referencias
  - Actualizar docker-compose
  - _Requirements: 3.2, 3.3, 7.1, 7.2_

- [ ] 20.4 Validar dominio support
  - Compilar servicios del dominio
  - Iniciar contenedores Docker
  - Verificar health checks
  - Ejecutar tests
  - _Requirements: 6.1, 6.2, 9.4_

- [ ] 21. Migrar dominio platform
- [ ] 21.1 Mover api-gateway a domains/platform/
  - Mover api-gateway/ a domains/platform/api-gateway/
  - Actualizar imports y referencias
  - Actualizar docker-compose
  - _Requirements: 3.2, 3.3, 7.1, 7.2_

- [ ] 21.2 Mover frontend a domains/platform/
  - Mover frontend/ a domains/platform/frontend/
  - Actualizar imports y referencias
  - Actualizar docker-compose
  - Actualizar scripts de build
  - _Requirements: 3.2, 3.3, 7.1, 7.2_

- [ ] 21.3 Validar dominio platform
  - Compilar servicios del dominio
  - Iniciar contenedores Docker
  - Verificar health checks
  - Ejecutar tests
  - _Requirements: 6.1, 6.2, 9.4_

- [ ] 22. Reorganizar código compartido (shared)
- [ ] 22.1 Reorganizar shared/ por propósito
  - Crear shared/domain/ para lógica de dominio compartida
  - Crear shared/infrastructure/ para utilidades de infraestructura
  - Mover código existente a nuevas ubicaciones
  - _Requirements: 3.4_

- [ ] 22.2 Actualizar referencias a shared
  - Actualizar imports en todos los servicios
  - Actualizar package.json de servicios
  - _Requirements: 7.1, 7.2_

- [ ] 23. Eliminar carpetas antiguas vacías
  - Eliminar services/ (ahora vacía)
  - Eliminar ai-services/ (ahora vacía)
  - Eliminar automation/ (ahora vacía)
  - _Requirements: 3.2_

- [ ] 24. Validar reorganización completa
- [ ] 24.1 Validar estructura de dominios
  - Verificar que todos los servicios están en dominios correctos
  - Verificar que no quedan servicios en ubicaciones antiguas
  - _Requirements: 3.1, 3.2_

- [ ] 24.2 Validar todos los servicios
  - Iniciar todos los contenedores Docker
  - Verificar que todos los servicios inician
  - Verificar health checks de todos los servicios
  - _Requirements: 6.1, 6.2_

- [ ] 24.3 Ejecutar suite completa de tests
  - Ejecutar tests de todos los servicios
  - Verificar que todos los tests pasan
  - _Requirements: 9.4_

- [ ] 24.4 Crear checkpoint de Git
  - Commit: "Phase 3: Reorganize to domain architecture"
  - Crear tag: `phase-3-complete`
  - _Requirements: 6.5_

---

## Phase 4: Estandarización de Microservicios

- [ ] 25. Crear plantilla de estructura estándar
  - Documentar estructura estándar en STANDARD_SERVICE_STRUCTURE.md
  - Crear script para generar estructura estándar
  - Crear script para analizar estructura actual de servicio
  - _Requirements: 5.1, 5.2_

- [ ] 26. Estandarizar servicios simples (notification, shipment-tracker)
- [ ] 26.1 Estandarizar notification-service
  - Analizar estructura actual
  - Crear estructura estándar (domain, application, infrastructure, presentation)
  - Mover archivos a nuevas ubicaciones
  - Actualizar imports
  - Reorganizar tests (unit, integration, e2e)
  - Validar servicio
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 26.2 Estandarizar shipment-tracker
  - Aplicar mismo proceso que notification-service
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 27. Estandarizar servicios core (product, user, order, payment)
- [ ] 27.1 Estandarizar product-service
  - Analizar estructura actual
  - Crear estructura estándar
  - Mover archivos (controllers → presentation, models → domain, etc.)
  - Actualizar imports
  - Reorganizar tests
  - Validar servicio
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 27.2 Estandarizar user-service
  - Aplicar mismo proceso
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 27.3 Estandarizar order-service
  - Aplicar mismo proceso
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 27.4 Estandarizar payment-service
  - Aplicar mismo proceso
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 28. Estandarizar servicios de automatización
- [ ] 28.1 Estandarizar sync-engine
  - Aplicar proceso de estandarización
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 28.2 Estandarizar auto-purchase-service
  - Aplicar proceso de estandarización
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 29. Estandarizar servicios de soporte
- [ ] 29.1 Estandarizar ticket-service
  - Aplicar proceso de estandarización
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 30. Estandarizar servicios complejos (chatbot, recommender, api-gateway)
- [ ] 30.1 Estandarizar chatbot-service
  - Analizar estructura actual (más compleja)
  - Crear estructura estándar adaptada
  - Mover archivos cuidadosamente
  - Actualizar imports
  - Reorganizar tests
  - Validar servicio exhaustivamente
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 30.2 Estandarizar recommender-service
  - Aplicar proceso adaptado para servicio de ML
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 30.3 Estandarizar api-gateway
  - Aplicar proceso adaptado para gateway
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 31. Validar estandarización completa
- [ ] 31.1 Verificar estructura de todos los servicios
  - Verificar que todos siguen estructura estándar
  - Generar reporte de cumplimiento
  - _Requirements: 5.5_

- [ ] 31.2 Validar todos los servicios
  - Compilar todos los servicios
  - Iniciar todos los contenedores
  - Verificar health checks
  - _Requirements: 6.1, 6.2, 9.4_

- [ ] 31.3 Ejecutar suite completa de tests
  - Ejecutar tests de todos los servicios
  - Verificar cobertura de tests
  - _Requirements: 9.4_

- [ ] 31.4 Crear checkpoint de Git
  - Commit: "Phase 4: Standardize microservices structure"
  - Crear tag: `phase-4-complete`
  - _Requirements: 6.5_

---

## Phase 5: Limpieza Final y Documentación

- [ ] 32. Limpiar archivos temporales
- [ ] 32.1 Eliminar tests de verificación temporales
  - Eliminar tests creados específicamente para migración
  - Mantener solo tests permanentes
  - _Requirements: 10.5_

- [ ] 32.2 Limpiar archivos de log y cache
  - Eliminar archivos de log del repositorio
  - Limpiar archivos de cache
  - Actualizar .gitignore
  - _Requirements: 4.4_

- [ ] 32.3 Limpiar scripts obsoletos
  - Identificar scripts que ya no son necesarios
  - Eliminar o archivar scripts obsoletos
  - _Requirements: 4.3_

- [ ] 33. Organizar documentación
- [ ] 33.1 Reorganizar docs/
  - Crear docs/architecture/
  - Crear docs/api/
  - Crear docs/deployment/
  - Mover documentación existente a ubicaciones apropiadas
  - _Requirements: 3.6, 4.2_

- [ ] 33.2 Actualizar documentación de servicios
  - Verificar que cada servicio tiene README.md actualizado
  - Actualizar documentación de API
  - _Requirements: 5.5_

- [ ] 34. Organizar scripts
- [ ] 34.1 Reorganizar scripts/
  - Crear scripts/deployment/
  - Crear scripts/testing/
  - Crear scripts/utilities/
  - Mover scripts a ubicaciones apropiadas
  - _Requirements: 4.3_

- [ ] 34.2 Actualizar scripts con nuevas rutas
  - Actualizar paths en scripts de deployment
  - Actualizar paths en scripts de testing
  - _Requirements: 7.4_

- [ ] 35. Limpiar raíz del proyecto
- [ ] 35.1 Mover archivos de documentación
  - Mover archivos .md no esenciales a docs/
  - Mantener solo README.md, CONTRIBUTING.md, LICENSE en raíz
  - _Requirements: 4.1, 4.5_

- [ ] 35.2 Verificar archivos esenciales en raíz
  - Verificar que solo quedan archivos esenciales
  - Máximo 5-7 archivos en raíz
  - _Requirements: 4.5_

- [ ] 36. Crear documentación de arquitectura
- [ ] 36.1 Crear ARCHITECTURE.md
  - Documentar nueva estructura de dominios
  - Documentar estructura estándar de servicios
  - Incluir diagramas de arquitectura
  - _Requirements: 8.4_

- [ ] 36.2 Crear MIGRATION_SUMMARY.md
  - Documentar resumen de cambios realizados
  - Incluir estadísticas (archivos movidos, eliminados, etc.)
  - Documentar lecciones aprendidas
  - _Requirements: 8.2, 8.4_

- [ ] 36.3 Crear DEVELOPER_GUIDE.md
  - Documentar cómo navegar nueva estructura
  - Documentar convenciones de código
  - Incluir ejemplos de nuevas rutas
  - _Requirements: 8.5_

- [ ] 37. Actualizar README principal
  - Actualizar estructura del proyecto en README.md
  - Actualizar comandos con nuevas rutas
  - Actualizar sección de arquitectura
  - Actualizar guía de inicio rápido
  - _Requirements: 8.1_

- [ ] 38. Validación final completa
- [ ] 38.1 Ejecutar análisis final
  - Verificar que no hay duplicaciones
  - Verificar que estructura cumple Screaming Architecture
  - Generar reporte final
  - _Requirements: 3.1, 3.2_

- [ ] 38.2 Validar todos los servicios
  - Detener todos los contenedores
  - Limpiar volúmenes y redes
  - Iniciar todos los servicios desde cero
  - Verificar que todos inician correctamente
  - Verificar health checks
  - _Requirements: 6.1, 6.2, 9.1_

- [ ] 38.3 Ejecutar suite completa de tests
  - Ejecutar tests unitarios de todos los servicios
  - Ejecutar tests de integración
  - Ejecutar tests E2E
  - Verificar cobertura de tests
  - _Requirements: 9.4_

- [ ] 38.4 Validar compilación TypeScript
  - Compilar todos los servicios
  - Verificar que no hay errores de TypeScript
  - _Requirements: 7.5_

- [ ] 38.5 Verificar criterios de éxito
  - ✅ Estructura Screaming Architecture
  - ✅ Sin duplicaciones
  - ✅ Nombres consistentes (TechNovaStore)
  - ✅ Servicios funcionando
  - ✅ Tests pasando (100%)
  - ✅ Documentación actualizada
  - ✅ Raíz limpia (≤5 archivos)
  - ✅ Estructura estándar en servicios
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 38.6 Crear checkpoint final
  - Commit: "Phase 5: Final cleanup and documentation"
  - Crear tag: `phase-5-complete`
  - Crear tag: `migration-complete`
  - _Requirements: 6.5_

- [ ] 39. Generar reporte final de migración
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
