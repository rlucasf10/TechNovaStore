# Guía de Navegación de Documentación

Esta guía te ayudará a encontrar rápidamente la documentación que necesitas en TechNovaStore.

## 🗺️ Mapa de Documentación

### Por Rol

#### 👨‍💻 Desarrolladores

**Empezar aquí**: [docs/development/README.md](./development/README.md)

- **Configuración inicial**: [development/setup.md](./development/setup.md)
- **Arquitectura del sistema**: [architecture/CURRENT_STRUCTURE.md](./architecture/CURRENT_STRUCTURE.md)
- **Correcciones de frontend**: [development/FRONTEND_FIX.md](./development/FRONTEND_FIX.md)
- **APIs disponibles**: [api/README.md](./api/README.md)

#### 🚀 DevOps / SysAdmin

**Empezar aquí**: [docs/deployment/README.md](./deployment/README.md)

- **Despliegue local**: [deployment/local.md](./deployment/local.md)
- **Despliegue en producción**: [deployment/PRODUCTION_DEPLOYMENT.md](./deployment/PRODUCTION_DEPLOYMENT.md)
- **Mejores prácticas Docker**: [deployment/docker-best-practices.md](./deployment/docker-best-practices.md)
- **Monitoreo**: [monitoring/MONITORING.md](./monitoring/MONITORING.md)

#### 🏗️ Arquitectos

**Empezar aquí**: [docs/architecture/README.md](./architecture/README.md)

- **Estructura actual**: [architecture/CURRENT_STRUCTURE.md](./architecture/CURRENT_STRUCTURE.md)
- **Configuración del sistema**: [architecture/CONFIGURACION-CONSOLIDADA.md](./architecture/CONFIGURACION-CONSOLIDADA.md)
- **Bases de datos**: [architecture/GUIA_CONEXION_BASES_DATOS.md](./architecture/GUIA_CONEXION_BASES_DATOS.md)

#### 🔒 Seguridad

**Empezar aquí**: [docs/security/README.md](./security/README.md)

- **Configuración de seguridad**: [security/SECURITY_SETUP.md](./security/SECURITY_SETUP.md)
- **Zero Trust**: [security/TECHNOVA-ZERO-TRUST.md](./security/TECHNOVA-ZERO-TRUST.md)
- **OAuth**: [security/OAUTH_IMPLEMENTATION_COMPLETE.md](./security/OAUTH_IMPLEMENTATION_COMPLETE.md)
- **Troubleshooting**: [security/TROUBLESHOOTING-AUTH.md](./security/TROUBLESHOOTING-AUTH.md)

## 📂 Por Tema

### Configuración y Setup

| Documento | Ubicación | Descripción |
|-----------|-----------|-------------|
| Setup de desarrollo | [development/setup.md](./development/setup.md) | Configuración inicial del entorno |
| Configuración consolidada | [architecture/CONFIGURACION-CONSOLIDADA.md](./architecture/CONFIGURACION-CONSOLIDADA.md) | Configuración general del sistema |
| Variables de entorno | [architecture/ENV_CONSOLIDATION_STRATEGY.md](./architecture/ENV_CONSOLIDATION_STRATEGY.md) | Estrategia de variables de entorno |

### Despliegue

| Documento | Ubicación | Descripción |
|-----------|-----------|-------------|
| Despliegue local | [deployment/local.md](./deployment/local.md) | Cómo ejecutar localmente |
| Despliegue producción | [deployment/PRODUCTION_DEPLOYMENT.md](./deployment/PRODUCTION_DEPLOYMENT.md) | Despliegue en producción |
| Guía principal | [deployment/DEPLOYMENT.md](./deployment/DEPLOYMENT.md) | Guía general de despliegue |
| Notas importantes | [deployment/DEPLOYMENT-NOTES.md](./deployment/DEPLOYMENT-NOTES.md) | Notas y consideraciones |
| Docker best practices | [deployment/docker-best-practices.md](./deployment/docker-best-practices.md) | Mejores prácticas |

### Arquitectura

| Documento | Ubicación | Descripción |
|-----------|-----------|-------------|
| Estructura actual | [architecture/CURRENT_STRUCTURE.md](./architecture/CURRENT_STRUCTURE.md) | Estructura del proyecto |
| Bases de datos | [architecture/GUIA_CONEXION_BASES_DATOS.md](./architecture/GUIA_CONEXION_BASES_DATOS.md) | Conexión a BD |
| Consolidación ENV | [architecture/ENV_CONSOLIDATION_SUMMARY.md](./architecture/ENV_CONSOLIDATION_SUMMARY.md) | Resumen de variables |

### Seguridad

| Documento | Ubicación | Descripción |
|-----------|-----------|-------------|
| Setup de seguridad | [security/SECURITY_SETUP.md](./security/SECURITY_SETUP.md) | Configuración inicial |
| Zero Trust | [security/TECHNOVA-ZERO-TRUST.md](./security/TECHNOVA-ZERO-TRUST.md) | Arquitectura Zero Trust |
| OAuth Docker | [security/OAUTH_CONFIGURACION_DOCKER.md](./security/OAUTH_CONFIGURACION_DOCKER.md) | OAuth en Docker |
| OAuth completo | [security/OAUTH_IMPLEMENTATION_COMPLETE.md](./security/OAUTH_IMPLEMENTATION_COMPLETE.md) | Implementación OAuth |
| Credenciales | [security/DONDE_ESTAN_LAS_CREDENCIALES.md](./security/DONDE_ESTAN_LAS_CREDENCIALES.md) | Ubicación de secretos |
| Troubleshooting | [security/TROUBLESHOOTING-AUTH.md](./security/TROUBLESHOOTING-AUTH.md) | Solución de problemas |

### APIs

| Documento | Ubicación | Descripción |
|-----------|-----------|-------------|
| Documentación API | [api/README.md](./api/README.md) | Guía de APIs |
| OpenAPI Spec | [api/openapi.yaml](./api/openapi.yaml) | Especificación OpenAPI |
| Postman Collection | [api/postman-collection.json](./api/postman-collection.json) | Colección Postman |

### Monitoreo

| Documento | Ubicación | Descripción |
|-----------|-----------|-------------|
| Sistema de monitoreo | [monitoring/MONITORING.md](./monitoring/MONITORING.md) | Configuración de monitoreo |
| Logging | [monitoring/LOGGING.md](./monitoring/LOGGING.md) | Sistema de logs |

### Desarrollo

| Documento | Ubicación | Descripción |
|-----------|-----------|-------------|
| Guía de desarrollo | [development/README.md](./development/README.md) | Guía completa |
| Setup inicial | [development/setup.md](./development/setup.md) | Configuración |
| Frontend fixes | [development/FRONTEND_FIX.md](./development/FRONTEND_FIX.md) | Correcciones frontend |
| Usuario admin | [development/USUARIO_ADMINISTRADOR.md](./development/USUARIO_ADMINISTRADOR.md) | Crear admin |

### Migración

| Documento | Ubicación | Descripción |
|-----------|-----------|-------------|
| Plan de migración | [migration/MIGRATION_PLAN.md](./migration/MIGRATION_PLAN.md) | Plan completo |
| Checkpoints | [migration/MIGRATION_CHECKPOINTS.md](./migration/MIGRATION_CHECKPOINTS.md) | Puntos de control |
| Rollback | [migration/ROLLBACK_INSTRUCTIONS.md](./migration/ROLLBACK_INSTRUCTIONS.md) | Instrucciones de rollback |

## 🔍 Búsqueda Rápida

### "¿Cómo hago...?"

#### ¿Cómo inicio el proyecto localmente?
→ [deployment/local.md](./deployment/local.md)

#### ¿Cómo configuro mi entorno de desarrollo?
→ [development/setup.md](./development/setup.md)

#### ¿Cómo me conecto a las bases de datos?
→ [architecture/GUIA_CONEXION_BASES_DATOS.md](./architecture/GUIA_CONEXION_BASES_DATOS.md)

#### ¿Cómo configuro OAuth?
→ [security/OAUTH_CONFIGURACION_DOCKER.md](./security/OAUTH_CONFIGURACION_DOCKER.md)

#### ¿Cómo despliego en producción?
→ [deployment/PRODUCTION_DEPLOYMENT.md](./deployment/PRODUCTION_DEPLOYMENT.md)

#### ¿Cómo creo un usuario administrador?
→ [development/USUARIO_ADMINISTRADOR.md](./development/USUARIO_ADMINISTRADOR.md)

#### ¿Dónde están las credenciales?
→ [security/DONDE_ESTAN_LAS_CREDENCIALES.md](./security/DONDE_ESTAN_LAS_CREDENCIALES.md)

#### ¿Cómo funciona el monitoreo?
→ [monitoring/MONITORING.md](./monitoring/MONITORING.md)

#### ¿Cuál es la estructura del proyecto?
→ [architecture/CURRENT_STRUCTURE.md](./architecture/CURRENT_STRUCTURE.md)

#### ¿Cómo uso las APIs?
→ [api/README.md](./api/README.md)

### "Tengo un problema con..."

#### Problemas de autenticación
→ [security/TROUBLESHOOTING-AUTH.md](./security/TROUBLESHOOTING-AUTH.md)

#### Problemas de despliegue
→ [deployment/DEPLOYMENT-NOTES.md](./deployment/DEPLOYMENT-NOTES.md)

#### Problemas de frontend
→ [development/FRONTEND_FIX.md](./development/FRONTEND_FIX.md)

#### Problemas de seguridad
→ [security/SECURITY_FIX_INSTRUCTIONS.md](./security/SECURITY_FIX_INSTRUCTIONS.md)

## 📊 Estructura de Carpetas

```
docs/
├── 📁 api/                    # Documentación de APIs
│   ├── openapi.yaml
│   ├── postman-collection.json
│   └── README.md
│
├── 📁 architecture/           # Arquitectura del sistema
│   ├── CONFIGURACION-CONSOLIDADA.md
│   ├── CURRENT_STRUCTURE.md
│   ├── ENV_CONSOLIDATION_*.md
│   ├── GUIA_CONEXION_BASES_DATOS.md
│   └── README.md
│
├── 📁 deployment/             # Guías de despliegue
│   ├── DEPLOYMENT.md
│   ├── DEPLOYMENT-NOTES.md
│   ├── docker-best-practices.md
│   ├── local.md
│   ├── PRODUCTION_DEPLOYMENT.md
│   └── README.md
│
├── 📁 development/            # Documentación para desarrolladores
│   ├── FRONTEND_FIX.md
│   ├── README.md
│   ├── setup.md
│   └── USUARIO_ADMINISTRADOR.md
│
├── 📁 maintenance/            # Mantenimiento del sistema
│   └── README.md
│
├── 📁 migration/              # Documentación de migración
│   ├── MIGRATION_PLAN.md
│   ├── MIGRATION_CHECKPOINTS.md
│   ├── ROLLBACK_INSTRUCTIONS.md
│   └── [otros archivos de migración]
│
├── 📁 monitoring/             # Monitoreo y observabilidad
│   ├── LOGGING.md
│   └── MONITORING.md
│
├── 📁 security/               # Seguridad y autenticación
│   ├── DONDE_ESTAN_LAS_CREDENCIALES.md
│   ├── OAUTH_*.md
│   ├── SECURITY_*.md
│   ├── TECHNOVA-ZERO-TRUST.md
│   ├── TROUBLESHOOTING-AUTH.md
│   └── README.md
│
├── 📄 README.md               # Índice principal
├── 📄 NAVIGATION_GUIDE.md     # Esta guía
└── 📄 REORGANIZATION_SUMMARY.md  # Resumen de cambios
```

## 🎯 Flujos Comunes

### Nuevo Desarrollador

1. Lee [README.md](./README.md) para visión general
2. Sigue [development/setup.md](./development/setup.md) para configurar entorno
3. Revisa [architecture/CURRENT_STRUCTURE.md](./architecture/CURRENT_STRUCTURE.md) para entender estructura
4. Consulta [api/README.md](./api/README.md) para APIs disponibles
5. Lee [development/README.md](./development/README.md) para estándares de código

### Despliegue en Producción

1. Lee [deployment/PRODUCTION_DEPLOYMENT.md](./deployment/PRODUCTION_DEPLOYMENT.md)
2. Revisa [security/SECURITY_SETUP.md](./security/SECURITY_SETUP.md)
3. Configura [monitoring/MONITORING.md](./monitoring/MONITORING.md)
4. Consulta [deployment/docker-best-practices.md](./deployment/docker-best-practices.md)
5. Ten a mano [migration/ROLLBACK_INSTRUCTIONS.md](./migration/ROLLBACK_INSTRUCTIONS.md)

### Solución de Problemas

1. Identifica el área del problema (auth, deployment, frontend, etc.)
2. Busca en la sección correspondiente de esta guía
3. Consulta el documento de troubleshooting específico
4. Si no encuentras solución, revisa los logs en [monitoring/LOGGING.md](./monitoring/LOGGING.md)

## 📝 Notas

- Todos los documentos están en español
- Los README.md de cada carpeta contienen índices detallados
- La documentación sigue principios de Screaming Architecture
- Cada documento referencia los requisitos que cumple

## 🔄 Actualizaciones

Esta guía se actualiza cuando:
- Se agregan nuevos documentos
- Se reorganiza la estructura
- Se identifican nuevos flujos comunes

**Última actualización**: 22 de noviembre de 2025

---

¿No encuentras lo que buscas? Consulta el [README principal](./README.md) o abre un issue en GitHub.
