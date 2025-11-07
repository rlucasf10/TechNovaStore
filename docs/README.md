# TechNovaStore - Documentación Técnica

Bienvenido a la documentación técnica de TechNovaStore, una plataforma de e-commerce automatizada construida con arquitectura de microservicios.

## Estructura de la Documentación

### 📚 [Documentación de APIs](./api/README.md)
- Especificaciones OpenAPI/Swagger
- Endpoints de todos los microservicios
- Ejemplos de requests y responses
- Códigos de error y manejo

### 🚀 [Guías de Despliegue](./deployment/)
- [Guía de Despliegue](./deployment/DEPLOYMENT.md)
- [Notas de Despliegue](./deployment/DEPLOYMENT-NOTES.md)
- [Despliegue en Producción](./deployment/PRODUCTION_DEPLOYMENT.md)
- [Despliegue Local](./deployment/local.md)

### 👨‍💻 [Documentación para Desarrolladores](./development/README.md)
- Arquitectura del sistema
- Guías de desarrollo
- Estándares de código
- Testing y debugging

### 🔧 [Guías de Mantenimiento](./maintenance/README.md)
- Monitoreo y logging
- Backup y recuperación
- Troubleshooting
- Actualizaciones y parches

### 🏗️ [Arquitectura](./architecture/)
- [Estructura Actual del Proyecto](./architecture/CURRENT_STRUCTURE.md)

### ⚙️ [Configuración](./configuration/)
- [Estrategia de Consolidación de Variables de Entorno](./configuration/ENV_CONSOLIDATION_STRATEGY.md)
- [Resumen de Consolidación de Variables](./configuration/ENV_CONSOLIDATION_SUMMARY.md)
- [Reporte de Duplicación de Variables](./configuration/ENV_DUPLICATION_REPORT.md)

### 🔒 [Seguridad](./security/)
- [Configuración de Seguridad](./security/SECURITY_SETUP.md)
- [Instrucciones de Corrección de Seguridad](./security/SECURITY_FIX_INSTRUCTIONS.md)
- [Ubicación de Credenciales](./security/DONDE_ESTAN_LAS_CREDENCIALES.md)

### 🔐 [Autenticación](./authentication/)
- [Configuración OAuth en Docker](./authentication/OAUTH_CONFIGURACION_DOCKER.md)
- [Implementación OAuth Completa](./authentication/OAUTH_IMPLEMENTATION_COMPLETE.md)

### 📊 [Monitoreo](./monitoring/)
- [Configuración de Logging](./monitoring/LOGGING.md)
- [Sistema de Monitoreo](./monitoring/MONITORING.md)

### 💾 [Base de Datos](./database/)
- [Guía de Conexión a Bases de Datos](./database/GUIA_CONEXION_BASES_DATOS.md)

### 👤 [Gestión de Usuarios](./user-management/)
- [Usuario Administrador](./user-management/USUARIO_ADMINISTRADOR.md)

### 🎨 [Frontend](./frontend/)
- [Correcciones del Frontend](./frontend/FRONTEND_FIX.md)

### 📦 [Migración](./migration/)
- [Plan de Migración](./migration/MIGRATION_PLAN.md)
- [Preparación de Migración](./migration/MIGRATION_PREPARATION.md)
- [Checkpoints de Migración](./migration/MIGRATION_CHECKPOINTS.md)
- [Instrucciones de Rollback](./migration/ROLLBACK_INSTRUCTIONS.md)
- [Análisis Completo](./migration/ANALYSIS_COMPLETE.md)
- [Reporte de Duplicación](./migration/DUPLICATION_REPORT.md)
- [Reporte de Verificación Fase 1](./migration/VERIFICATION_REPORT_PHASE1.md)
- [Referencias de Renombrado](./migration/RENAME_REFERENCES.md)

## Inicio Rápido

1. **Configuración del entorno de desarrollo**: Ver [Guía de Desarrollo](./development/setup.md)
2. **Despliegue local**: Ver [Despliegue Local](./deployment/local.md)
3. **APIs disponibles**: Ver [Documentación de APIs](./api/README.md)

## Arquitectura General

TechNovaStore utiliza una arquitectura de microservicios con los siguientes componentes principales:

- **API Gateway**: Punto de entrada único para todas las requests
- **Product Service**: Gestión del catálogo de productos
- **User Service**: Autenticación y gestión de usuarios
- **Order Service**: Procesamiento de pedidos
- **Payment Service**: Procesamiento de pagos
- **Notification Service**: Envío de notificaciones
- **Automation Services**: Sincronización y compra automática

## Tecnologías Utilizadas

- **Backend**: Node.js, TypeScript, Express.js
- **Frontend**: React, Next.js, Tailwind CSS
- **Bases de Datos**: MongoDB, PostgreSQL, Redis
- **Containerización**: Docker, Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoreo**: Prometheus, Grafana, ELK Stack

## Soporte

Para soporte técnico o preguntas sobre la documentación, consulta:
- [Issues en GitHub](https://github.com/technovastore/issues)
- [Guía de Troubleshooting](./maintenance/troubleshooting.md)
- [FAQ](./development/faq.md)