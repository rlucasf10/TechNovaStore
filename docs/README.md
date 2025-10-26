# TechNovaStore - Documentación Técnica

Bienvenido a la documentación técnica de TechNovaStore, una plataforma de e-commerce automatizada construida con arquitectura de microservicios.

## Estructura de la Documentación

### 📚 [Documentación de APIs](./api/README.md)
- Especificaciones OpenAPI/Swagger
- Endpoints de todos los microservicios
- Ejemplos de requests y responses
- Códigos de error y manejo

### 🚀 [Guías de Despliegue](./deployment/README.md)
- Configuración de entornos
- Despliegue con Docker
- CI/CD con GitHub Actions
- Configuración de producción

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