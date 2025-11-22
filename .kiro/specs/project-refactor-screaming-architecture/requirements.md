# Requirements Document

## Introduction

Este documento define los requisitos para la refactorización completa del proyecto TechNovaStore hacia una arquitectura limpia y organizada basada en Screaming Architecture. El objetivo es transformar la estructura actual del proyecto para que las carpetas "griten" QUÉ HACE el sistema, no QUÉ TECNOLOGÍA usa, eliminando duplicaciones, inconsistencias y archivos innecesarios, mientras se asegura que nada se rompa durante el proceso.

## Glossary

- **Screaming Architecture**: Arquitectura donde la estructura de carpetas refleja el dominio del negocio y los casos de uso, no las tecnologías utilizadas
- **TechNovaStore**: Sistema de e-commerce con microservicios, IA y automatización
- **Duplicación**: Archivos, configuraciones o código repetido innecesariamente
- **Inconsistencia**: Nombres, estructuras o patrones que no siguen un estándar unificado
- **Microservicio**: Servicio independiente con su propia base de código
- **Test de Verificación**: Test temporal creado para validar que los cambios no rompan funcionalidad
- **Migración Segura**: Proceso de cambio que incluye validación en cada paso
- **Carpeta Base**: Directorio raíz del proyecto (actualmente "Ciberseguridad", será "TechNovaStore")

## Requirements

### Requirement 1: Renombrado Seguro del Proyecto

**User Story:** Como desarrollador, quiero que el proyecto se renombre de "Ciberseguridad" a "TechNovaStore" en todos los archivos y configuraciones, para que el nombre sea consistente en todo el sistema.

#### Acceptance Criteria

1. WHEN el sistema busca referencias al nombre antiguo, THE System SHALL identificar todas las ocurrencias en archivos de configuración, código fuente, documentación y scripts
2. WHEN el sistema renombra referencias, THE System SHALL actualizar todos los archivos docker-compose (yml), package.json, README, y archivos de configuración con el nuevo nombre
3. WHEN el sistema actualiza nombres de contenedores, THE System SHALL cambiar todos los nombres de imágenes y contenedores Docker de "ciberseguridad" a "technovastore"
4. WHEN el sistema actualiza nombres de volúmenes, THE System SHALL renombrar todos los volúmenes Docker para usar el nuevo nombre del proyecto
5. WHEN el sistema completa el renombrado, THE System SHALL ejecutar tests de verificación para confirmar que todos los servicios inician correctamente

### Requirement 2: Eliminación de Duplicaciones

**User Story:** Como desarrollador, quiero eliminar todos los archivos duplicados y configuraciones redundantes, para reducir la complejidad y el mantenimiento del proyecto.

#### Acceptance Criteria

1. WHEN el sistema analiza archivos de configuración, THE System SHALL identificar archivos .env duplicados, package.json redundantes y configuraciones repetidas
2. WHEN el sistema detecta documentación duplicada, THE System SHALL consolidar archivos README, guías y documentación técnica en ubicaciones únicas
3. WHEN el sistema encuentra archivos temporales, THE System SHALL eliminar archivos .example innecesarios, backups antiguos y archivos de prueba obsoletos
4. WHEN el sistema consolida configuraciones, THE System SHALL crear archivos de configuración centralizados que eliminen la redundancia
5. WHEN el sistema elimina duplicaciones, THE System SHALL mantener un log de cambios detallado con ubicación original y destino de cada archivo

### Requirement 3: Reorganización a Screaming Architecture

**User Story:** Como desarrollador, quiero que la estructura de carpetas refleje el dominio del negocio y los casos de uso, para que sea inmediatamente claro qué hace el sistema al ver su estructura.

#### Acceptance Criteria

1. WHEN el sistema organiza carpetas de dominio, THE System SHALL crear estructura basada en dominios de negocio (catalog, orders, payments, users, support, automation, intelligence)
2. WHEN el sistema organiza por casos de uso, THE System SHALL agrupar código por funcionalidad de negocio dentro de cada dominio
3. WHEN el sistema mueve microservicios, THE System SHALL reorganizar servicios dentro de sus dominios correspondientes manteniendo su independencia
4. WHEN el sistema organiza código compartido, THE System SHALL consolidar utilidades, tipos y middleware en ubicaciones lógicas por propósito
5. WHEN el sistema organiza tests, THE System SHALL crear estructura clara con carpetas unit/, integration/ y e2e/ por dominio
6. WHEN el sistema organiza documentación, THE System SHALL ubicar documentación cerca del código que documenta, eliminando archivos sueltos en la raíz
7. WHEN el sistema organiza infraestructura, THE System SHALL agrupar configuraciones de Docker, CI/CD y deployment en carpeta dedicada

### Requirement 4: Limpieza de Archivos Innecesarios

**User Story:** Como desarrollador, quiero eliminar archivos innecesarios de la raíz del proyecto, para tener un proyecto limpio y fácil de navegar.

#### Acceptance Criteria

1. WHEN el sistema identifica archivos de documentación, THE System SHALL mover o eliminar archivos .md innecesarios de la raíz del proyecto
2. WHEN el sistema identifica archivos de configuración, THE System SHALL consolidar archivos de configuración dispersos en ubicaciones apropiadas
3. WHEN el sistema identifica scripts, THE System SHALL organizar scripts en carpetas por propósito (deployment, testing, utilities)
4. WHEN el sistema identifica archivos temporales, THE System SHALL eliminar archivos de log, cache y temporales que no deben estar en el repositorio
5. WHEN el sistema completa la limpieza, THE System SHALL mantener solo archivos esenciales en la raíz (README.md, package.json, docker-compose.yml, .gitignore)

### Requirement 5: Estandarización de Estructura Interna de Microservicios con Screaming Architecture

**User Story:** Como desarrollador, quiero que todos los microservicios sigan Screaming Architecture internamente, para que la estructura refleje los casos de uso del negocio y sea inmediatamente comprensible.

#### Acceptance Criteria

1. WHEN el sistema organiza un microservicio, THE System SHALL crear carpetas por caso de uso que reflejen funcionalidades de negocio
2. WHEN el sistema organiza código de caso de uso, THE System SHALL agrupar toda la lógica relacionada (entidades, servicios, tests) en la misma carpeta del caso de uso
3. WHEN el sistema organiza código compartido, THE System SHALL consolidar infraestructura y utilidades compartidas en carpeta shared/ separada
4. WHEN el sistema organiza API, THE System SHALL ubicar controladores y rutas HTTP en carpeta api/ dedicada
5. WHEN el sistema organiza tests, THE System SHALL ubicar tests junto al código que prueban dentro de cada carpeta de caso de uso
6. WHEN el sistema nombra carpetas, THE System SHALL usar nombres que describan QUÉ HACE el código, no QUÉ TECNOLOGÍA usa
7. WHEN el sistema completa la organización, THE System SHALL asegurar que la estructura "grite" el dominio del negocio al leerla

### Requirement 6: Validación Continua Durante Migración

**User Story:** Como desarrollador, quiero que cada cambio sea validado antes de continuar, para asegurar que nada se rompa durante la refactorización.

#### Acceptance Criteria

1. WHEN el sistema completa un cambio estructural, THE System SHALL ejecutar tests de verificación automáticos
2. WHEN el sistema mueve archivos, THE System SHALL validar que todas las referencias e imports se actualicen correctamente
3. WHEN el sistema modifica configuración de Docker, THE System SHALL verificar que todos los contenedores inicien correctamente
4. WHEN el sistema detecta un error, THE System SHALL detener el proceso y reportar el problema con contexto detallado
5. WHEN el sistema completa una fase, THE System SHALL crear un checkpoint de Git para permitir rollback si es necesario

### Requirement 7: Actualización de Referencias y Paths

**User Story:** Como desarrollador, quiero que todas las referencias a rutas y archivos se actualicen automáticamente, para que el código siga funcionando después de la reorganización.

#### Acceptance Criteria

1. WHEN el sistema mueve un archivo, THE System SHALL actualizar todos los imports relativos y absolutos que lo referencian
2. WHEN el sistema reorganiza carpetas, THE System SHALL actualizar paths en archivos de configuración (tsconfig.json, jest.config.js, etc.)
3. WHEN el sistema cambia estructura, THE System SHALL actualizar referencias en docker-compose.yml y Dockerfiles
4. WHEN el sistema modifica ubicaciones, THE System SHALL actualizar scripts de deployment y CI/CD con nuevas rutas
5. WHEN el sistema completa actualizaciones, THE System SHALL ejecutar verificación de compilación TypeScript sin errores

### Requirement 8: Documentación de Cambios

**User Story:** Como desarrollador, quiero documentación clara de todos los cambios realizados, para entender la nueva estructura y poder revertir si es necesario.

#### Acceptance Criteria

1. WHEN el sistema inicia la refactorización, THE System SHALL crear documento MIGRATION.md con plan detallado de cambios
2. WHEN el sistema completa cada fase, THE System SHALL actualizar MIGRATION.md con estado de progreso y cambios realizados
3. WHEN el sistema mueve archivos, THE System SHALL mantener log detallado con ubicación original y nueva de cada archivo
4. WHEN el sistema completa la refactorización, THE System SHALL crear documento ARCHITECTURE.md describiendo la nueva estructura
5. WHEN el sistema genera documentación, THE System SHALL incluir guía de migración para desarrolladores con ejemplos de nuevas rutas

### Requirement 9: Preservación de Funcionalidad

**User Story:** Como desarrollador, quiero que toda la funcionalidad existente se preserve durante la refactorización, para que el sistema siga funcionando correctamente.

#### Acceptance Criteria

1. WHEN el sistema reorganiza código, THE System SHALL mantener toda la lógica de negocio sin modificaciones
2. WHEN el sistema mueve archivos, THE System SHALL preservar el historial de Git usando git mv cuando sea posible
3. WHEN el sistema actualiza configuración, THE System SHALL mantener todas las variables de entorno y secretos
4. WHEN el sistema reorganiza tests, THE System SHALL asegurar que todos los tests existentes sigan pasando
5. WHEN el sistema completa la refactorización, THE System SHALL ejecutar suite completa de tests (unit, integration, e2e) con 100% de éxito

### Requirement 10: Creación de Tests de Verificación Temporales

**User Story:** Como desarrollador, quiero crear tests temporales de verificación durante la migración, para validar que cada cambio funciona correctamente antes de continuar.

#### Acceptance Criteria

1. WHEN el sistema inicia una fase de migración, THE System SHALL crear tests de verificación específicos para esa fase
2. WHEN el sistema completa un cambio crítico, THE System SHALL ejecutar tests de verificación y reportar resultados
3. WHEN el sistema valida servicios Docker, THE System SHALL crear tests que verifiquen que todos los contenedores inician y responden
4. WHEN el sistema valida imports, THE System SHALL crear tests que verifiquen que no hay imports rotos
5. WHEN el sistema completa la migración, THE System SHALL eliminar todos los tests temporales de verificación
