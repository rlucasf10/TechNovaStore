# Actualización del Makefile - Screaming Architecture

**Fecha:** 2025-01-XX  
**Estado:** ✅ COMPLETADA

## Resumen

El Makefile ha sido completamente actualizado para reflejar la nueva estructura de dominios basada en Screaming Architecture. Se han agregado comandos organizados por dominio y se ha creado un script equivalente en PowerShell para Windows.

## Cambios Realizados

### 1. Estructura Actualizada

El Makefile ahora está organizado en secciones claras:

- **Instalación de Dependencias** - Por dominio y global
- **Compilación** - Por dominio y global
- **Desarrollo** - Comandos para iniciar entornos
- **Testing** - Tests por dominio, integración y E2E
- **Calidad de Código** - Linting y formateo
- **Limpieza** - Artefactos y node_modules
- **Docker** - Gestión completa de contenedores
- **Producción** - Comandos para producción
- **Base de Datos** - Migraciones y seeds
- **Git Flow** - Gestión de features y releases
- **Utilidades** - Herramientas de verificación

### 2. Comandos por Dominio

#### Instalación
```bash
make install-catalog      # Instalar dependencias del dominio Catalog
make install-commerce     # Instalar dependencias del dominio Commerce
make install-customer     # Instalar dependencias del dominio Customer
make install-support      # Instalar dependencias del dominio Support
make install-platform     # Instalar dependencias del dominio Platform
```

#### Compilación
```bash
make build-catalog        # Compilar servicios del dominio Catalog
make build-commerce       # Compilar servicios del dominio Commerce
make build-customer       # Compilar servicios del dominio Customer
make build-support        # Compilar servicios del dominio Support
make build-platform       # Compilar servicios del dominio Platform
```

#### Testing
```bash
make test-catalog         # Ejecutar tests del dominio Catalog
make test-commerce        # Ejecutar tests del dominio Commerce
make test-customer        # Ejecutar tests del dominio Customer
make test-support         # Ejecutar tests del dominio Support
make test-platform        # Ejecutar tests del dominio Platform
```

### 3. Nuevos Comandos Docker

```bash
make docker-rebuild       # Reconstruir y reiniciar servicios
make docker-logs-service  # Ver logs de un servicio específico
make docker-restart       # Reiniciar todos los servicios
make docker-restart-service # Reiniciar un servicio específico
make docker-ps            # Ver estado de los servicios
make docker-stats         # Ver uso de recursos
```

### 4. Comandos de Desarrollo

```bash
make dev                  # Iniciar bases de datos
make dev-core             # Iniciar servicios core
make dev-full             # Iniciar todos los servicios
```

### 5. Nuevas Utilidades

```bash
make check-structure      # Verificar estructura de dominios
make monitor              # Monitorear servicios
make health-check         # Health check de servicios
make validate             # Validar todos los servicios
make info                 # Ver información del proyecto
```

### 6. Limpieza Mejorada

```bash
make clean                # Limpiar artefactos de compilación
make clean-all            # Limpieza completa (incluye node_modules)
```

## Script de PowerShell para Windows

Se ha creado `make.ps1` como equivalente del Makefile para Windows PowerShell.

### Uso del Script PowerShell

```powershell
# Ver ayuda
.\make.ps1 help

# Instalar dependencias
.\make.ps1 install

# Compilar servicios
.\make.ps1 build

# Ejecutar tests
.\make.ps1 test

# Docker
.\make.ps1 docker-up
.\make.ps1 docker-logs chatbot
.\make.ps1 docker-restart frontend

# Información del proyecto
.\make.ps1 info

# Verificar estructura
.\make.ps1 check-structure
```

### Características del Script PowerShell

- ✅ Colores en la salida para mejor legibilidad
- ✅ Mensajes en español
- ✅ Soporte para parámetros (ej: `docker-logs chatbot`)
- ✅ Manejo de errores
- ✅ Funciones organizadas por dominio
- ✅ Compatible con Windows 10/11

## Mapeo de Dominios

El Makefile refleja la estructura de dominios:

| Dominio | Servicios |
|---------|-----------|
| **catalog** | product-service, sync-engine, recommender-service |
| **commerce** | order-service, payment-service, auto-purchase-service |
| **customer** | user-service, notification-service |
| **support** | ticket-service, chatbot-service, shipment-tracker |
| **platform** | api-gateway, frontend |

## Ejemplos de Uso

### Instalar y Compilar Todo

```bash
# Linux/Mac
make install
make build

# Windows
.\make.ps1 install
.\make.ps1 build
```

### Trabajar con un Dominio Específico

```bash
# Linux/Mac
make install-catalog
make build-catalog
make test-catalog

# Windows
.\make.ps1 install-catalog
.\make.ps1 build-catalog
.\make.ps1 test-catalog
```

### Gestión de Docker

```bash
# Linux/Mac
make docker-up
make docker-logs
make docker-restart chatbot
make docker-stats

# Windows
.\make.ps1 docker-up
.\make.ps1 docker-logs chatbot
.\make.ps1 docker-restart chatbot
.\make.ps1 docker-stats
```

### Desarrollo

```bash
# Linux/Mac
make dev-core              # Iniciar servicios esenciales
make dev-full              # Iniciar todos los servicios

# Windows
.\make.ps1 dev-core
.\make.ps1 dev-full
```

### Verificación y Validación

```bash
# Linux/Mac
make check-structure       # Ver estructura de dominios
make health-check          # Verificar salud de servicios
make validate              # Validar todos los servicios
make info                  # Ver información del proyecto

# Windows
.\make.ps1 check-structure
.\make.ps1 health-check
.\make.ps1 validate
.\make.ps1 info
```

## Mejoras Implementadas

### 1. Organización por Dominios
- Comandos específicos para cada dominio
- Facilita el trabajo en dominios individuales
- Reduce tiempo de compilación y testing

### 2. Mejor Experiencia de Desarrollo
- Comandos más descriptivos
- Mensajes con emojis para mejor legibilidad
- Feedback claro de éxito/error

### 3. Compatibilidad Multiplataforma
- Makefile para Linux/Mac
- Script PowerShell para Windows
- Misma funcionalidad en ambas plataformas

### 4. Comandos Docker Mejorados
- Más opciones de gestión de contenedores
- Ver logs de servicios específicos
- Monitoreo de recursos

### 5. Utilidades de Verificación
- Verificar estructura de dominios
- Health checks automatizados
- Validación de servicios

## Archivos Actualizados

- ✅ `Makefile` - Actualizado con nueva estructura
- ✅ `make.ps1` - Creado para Windows PowerShell
- ✅ `.PHONY` declarations actualizadas
- ✅ Documentación de comandos mejorada

## Compatibilidad

### Linux/Mac
- Requiere: `make`, `bash`, `docker`, `docker-compose`, `node`, `npm`
- Uso: `make <comando>`

### Windows
- Requiere: PowerShell 5.1+, `docker`, `docker-compose`, `node`, `npm`
- Uso: `.\make.ps1 <comando>`

## Próximos Pasos

1. ✅ Makefile actualizado
2. ✅ Script PowerShell creado
3. ✅ Comandos por dominio implementados
4. ✅ Utilidades de verificación agregadas
5. ⏳ Actualizar README.md con nuevos comandos
6. ⏳ Crear guía de desarrollo con ejemplos

## Conclusión

El Makefile y el script PowerShell ahora reflejan completamente la arquitectura Screaming con dominios de negocio. Los desarrolladores pueden trabajar eficientemente con dominios individuales o con todo el proyecto, usando comandos claros y organizados.

**Estado:** ✅ ACTUALIZACIÓN COMPLETADA

Los comandos están listos para usar tanto en Linux/Mac (con `make`) como en Windows (con `.\make.ps1`).
