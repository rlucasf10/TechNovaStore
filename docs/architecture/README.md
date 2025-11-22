# Documentación de Arquitectura

Esta carpeta contiene toda la documentación relacionada con la arquitectura del sistema TechNovaStore.

## Contenido

### Estructura del Proyecto

- **[CURRENT_STRUCTURE.md](./CURRENT_STRUCTURE.md)** - Estructura actual del proyecto después de la refactorización a Screaming Architecture

### Configuración del Sistema

- **[CONFIGURACION-CONSOLIDADA.md](./CONFIGURACION-CONSOLIDADA.md)** - Configuración consolidada del sistema
- **[ENV_CONSOLIDATION_STRATEGY.md](./ENV_CONSOLIDATION_STRATEGY.md)** - Estrategia para consolidar variables de entorno
- **[ENV_CONSOLIDATION_SUMMARY.md](./ENV_CONSOLIDATION_SUMMARY.md)** - Resumen de la consolidación de variables de entorno
- **[ENV_DUPLICATION_REPORT.md](./ENV_DUPLICATION_REPORT.md)** - Reporte de duplicación de variables de entorno

### Bases de Datos

- **[GUIA_CONEXION_BASES_DATOS.md](./GUIA_CONEXION_BASES_DATOS.md)** - Guía completa para conectarse a las bases de datos del sistema (MongoDB, PostgreSQL, Redis)

## Arquitectura General

TechNovaStore utiliza **Screaming Architecture** - una arquitectura donde la estructura de carpetas refleja el dominio del negocio, no las tecnologías utilizadas.

### Dominios Principales

```
domains/
├── catalog/          # Gestión de catálogo de productos
├── commerce/         # Comercio y transacciones
├── customer/         # Gestión de clientes
├── support/          # Soporte al cliente
└── platform/         # Plataforma y gateway
```

### Principios de Diseño

1. **Organización por Dominio**: Los servicios se agrupan por dominio de negocio
2. **Casos de Uso Visibles**: La estructura "grita" qué hace el sistema
3. **Independencia de Servicios**: Cada microservicio es independiente
4. **Código Compartido Mínimo**: Solo lo esencial se comparte entre servicios

## Ver También

- [Documentación de Deployment](../deployment/) - Cómo desplegar el sistema
- [Documentación de Desarrollo](../development/) - Guías para desarrolladores
- [Documentación de Seguridad](../security/) - Configuración de seguridad
