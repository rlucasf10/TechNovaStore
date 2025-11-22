# Guía de Scripts de Automatización (Makefile y make.ps1)

Esta guía explica cómo usar los scripts de automatización de TechNovaStore para gestionar tareas comunes del proyecto.

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Archivos](#archivos)
3. [Comandos Disponibles](#comandos-disponibles)
4. [Ejemplos de Uso](#ejemplos-de-uso)
5. [Diferencias entre Plataformas](#diferencias-entre-plataformas)
6. [Troubleshooting](#troubleshooting)

---

## Introducción

TechNovaStore incluye scripts de automatización para simplificar tareas comunes de desarrollo, testing, compilación y deployment. Estos scripts están disponibles en dos versiones:

- **Makefile**: Para Linux, macOS y WSL (Windows Subsystem for Linux)
- **make.ps1**: Para Windows PowerShell

Ambos scripts proporcionan exactamente la misma funcionalidad, solo difieren en la sintaxis de ejecución.

---

## Archivos

### Makefile

**Ubicación**: `Makefile` (raíz del proyecto)  
**Plataforma**: Linux, macOS, WSL  
**Requisitos**: GNU Make

Script de automatización usando GNU Make para gestionar tareas comunes del proyecto.

**Características**:
- Comandos organizados por categoría
- Soporte para dominios de negocio (Screaming Architecture)
- Integración con Docker Compose
- Git Flow automatizado
- Health checks y validación

### make.ps1

**Ubicación**: `make.ps1` (raíz del proyecto)  
**Plataforma**: Windows PowerShell  
**Requisitos**: PowerShell 5.1 o superior

Script de automatización equivalente al Makefile para usuarios de Windows.

**Características**:
- Misma funcionalidad que Makefile
- Sintaxis PowerShell nativa
- Colores en la salida
- Manejo de errores mejorado

---

## Comandos Disponibles

### Ver Ayuda

```bash
# Linux/macOS/WSL
make help

# Windows PowerShell
.\make.ps1 help
```

### 📦 Instalación de Dependencias

| Comando | Descripción |
|---------|-------------|
| `install` | Instalar todas las dependencias del proyecto |
| `install-catalog` | Instalar dependencias del dominio Catalog |
| `install-commerce` | Instalar dependencias del dominio Commerce |
| `install-customer` | Instalar dependencias del dominio Customer |
| `install-support` | Instalar dependencias del dominio Support |
| `install-platform` | Instalar dependencias del dominio Platform |

**Ejemplo**:
```bash
# Instalar todas las dependencias
make install

# Instalar solo dependencias del dominio Catalog
make install-catalog
```

### 🔨 Compilación

| Comando | Descripción |
|---------|-------------|
| `build` | Compilar todos los servicios |
| `build-catalog` | Compilar servicios del dominio Catalog |
| `build-commerce` | Compilar servicios del dominio Commerce |
| `build-customer` | Compilar servicios del dominio Customer |
| `build-support` | Compilar servicios del dominio Support |
| `build-platform` | Compilar servicios del dominio Platform |

**Ejemplo**:
```bash
# Compilar todos los servicios
make build

# Compilar solo servicios del dominio Commerce
make build-commerce
```

### 🧪 Testing

| Comando | Descripción |
|---------|-------------|
| `test` | Ejecutar todos los tests |
| `test-catalog` | Ejecutar tests del dominio Catalog |
| `test-commerce` | Ejecutar tests del dominio Commerce |
| `test-customer` | Ejecutar tests del dominio Customer |
| `test-support` | Ejecutar tests del dominio Support |
| `test-platform` | Ejecutar tests del dominio Platform |
| `test-integration` | Ejecutar tests de integración |
| `test-e2e` | Ejecutar tests end-to-end |

**Ejemplo**:
```bash
# Ejecutar todos los tests
make test

# Ejecutar solo tests del dominio Support
make test-support

# Ejecutar tests E2E
make test-e2e
```

### 🔍 Calidad de Código

| Comando | Descripción |
|---------|-------------|
| `lint` | Ejecutar linting en todos los servicios |
| `lint-fix` | Corregir automáticamente problemas de linting |
| `format` | Formatear código con Prettier |
| `format-check` | Verificar formato de código sin modificar |

**Ejemplo**:
```bash
# Ejecutar linting
make lint

# Corregir problemas de linting
make lint-fix

# Formatear código
make format
```

### 🐳 Docker

| Comando | Descripción |
|---------|-------------|
| `docker-up` | Iniciar servicios Docker (usa docker-compose.optimized.yml) |
| `docker-down` | Detener servicios Docker |
| `docker-build` | Construir imágenes Docker |
| `docker-rebuild` | Reconstruir y reiniciar servicios |
| `docker-logs` | Ver logs de todos los servicios |
| `docker-logs-service` | Ver logs de un servicio específico (interactivo) |
| `docker-restart` | Reiniciar todos los servicios |
| `docker-restart-service` | Reiniciar un servicio específico (interactivo) |
| `docker-clean` | Limpiar contenedores y volúmenes |
| `docker-ps` | Ver estado de los servicios |
| `docker-stats` | Ver uso de recursos de los contenedores |

**Ejemplo**:
```bash
# Iniciar todos los servicios
make docker-up

# Ver logs de un servicio específico
make docker-logs-service
# Cuando pregunte, escribir: chatbot

# Reiniciar un servicio
make docker-restart-service
# Cuando pregunte, escribir: frontend

# Ver estado de servicios
make docker-ps

# Ver uso de recursos
make docker-stats
```

**Windows PowerShell**:
```powershell
# Ver logs de un servicio específico
.\make.ps1 docker-logs chatbot

# Reiniciar un servicio específico
.\make.ps1 docker-restart frontend
```

### 🚀 Producción

| Comando | Descripción |
|---------|-------------|
| `prod-build` | Construir imágenes para producción |
| `prod-up` | Iniciar servicios en modo producción |
| `prod-down` | Detener servicios de producción |
| `prod-logs` | Ver logs de producción |
| `prod-ps` | Ver estado de servicios de producción |

**Ejemplo**:
```bash
# Construir para producción
make prod-build

# Iniciar en producción
make prod-up

# Ver logs
make prod-logs
```

### 🗄️ Base de Datos

| Comando | Descripción |
|---------|-------------|
| `db-migrate` | Ejecutar migraciones de base de datos |
| `db-seed` | Poblar base de datos con datos de prueba |
| `db-backup` | Crear backup de base de datos |
| `db-restore` | Restaurar base de datos desde backup |

**Ejemplo**:
```bash
# Poblar base de datos
make db-seed

# Ejecutar migraciones
make db-migrate
```

### 🧹 Limpieza

| Comando | Descripción |
|---------|-------------|
| `clean` | Limpiar artefactos de compilación (dist/, build/, coverage/) |
| `clean-all` | Limpieza completa incluyendo node_modules |

**Ejemplo**:
```bash
# Limpiar artefactos de compilación
make clean

# Limpieza completa (¡cuidado! elimina node_modules)
make clean-all
```

### 🌿 Git Flow

| Comando | Descripción |
|---------|-------------|
| `feature-start` | Iniciar nueva feature branch |
| `feature-finish` | Finalizar feature y merge a develop |
| `release-start` | Iniciar release branch |
| `release-finish` | Finalizar release y merge a master/develop |

**Ejemplo**:
```bash
# Iniciar nueva feature
make feature-start
# Cuando pregunte, escribir: add-product-filters

# Finalizar feature
make feature-finish
```

### 🛠️ Utilidades

| Comando | Descripción |
|---------|-------------|
| `check-structure` | Verificar estructura de dominios |
| `monitor` | Monitorear servicios en tiempo real |
| `health-check` | Verificar salud de todos los servicios |
| `validate` | Validar configuración de todos los servicios |
| `info` | Ver información del proyecto |

**Ejemplo**:
```bash
# Verificar estructura de dominios
make check-structure

# Health check de servicios
make health-check

# Ver información del proyecto
make info
```

---

## Ejemplos de Uso

### Flujo de Desarrollo Completo

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-org/technovastore.git
cd technovastore

# 2. Instalar dependencias
make install

# 3. Iniciar servicios Docker
make docker-up

# 4. Compilar servicios
make build

# 5. Ejecutar tests
make test

# 6. Ver logs
make docker-logs
```

### Trabajar en un Dominio Específico

```bash
# Trabajar solo en el dominio Catalog
make install-catalog
make build-catalog
make test-catalog

# Reiniciar servicio específico
make docker-restart-service
# Escribir: product-service
```

### Desarrollo con Hot Reload

```bash
# Iniciar solo bases de datos
make docker-up

# Los servicios se inician automáticamente con hot reload
# Editar código y los cambios se reflejan automáticamente
```

### Preparar para Producción

```bash
# 1. Ejecutar todos los tests
make test

# 2. Verificar linting
make lint

# 3. Verificar formato
make format-check

# 4. Construir para producción
make prod-build

# 5. Iniciar en producción
make prod-up
```

### Debugging

```bash
# Ver logs de un servicio específico
make docker-logs-service
# Escribir: chatbot

# Ver uso de recursos
make docker-stats

# Health check
make health-check

# Reiniciar servicio problemático
make docker-restart-service
# Escribir: chatbot
```

---

## Diferencias entre Plataformas

### Linux/macOS/WSL (Makefile)

```bash
# Ejecutar desde la raíz del proyecto
cd /path/to/technovastore

# Ver ayuda
make help

# Ejecutar comandos
make install
make build
make test
make docker-up

# Comandos interactivos
make docker-logs-service
# Escribir nombre del servicio cuando pregunte
```

### Windows PowerShell (make.ps1)

```powershell
# Ejecutar desde la raíz del proyecto
cd C:\path\to\technovastore

# Ver ayuda
.\make.ps1 help

# Ejecutar comandos
.\make.ps1 install
.\make.ps1 build
.\make.ps1 test
.\make.ps1 docker-up

# Comandos con parámetros
.\make.ps1 docker-logs chatbot
.\make.ps1 docker-restart frontend
```

**Diferencias clave**:
- Makefile usa comandos interactivos (pregunta el servicio)
- make.ps1 acepta el servicio como segundo parámetro
- make.ps1 tiene colores en la salida
- Ambos tienen exactamente la misma funcionalidad

---

## Troubleshooting

### Makefile: "make: command not found"

**Problema**: GNU Make no está instalado.

**Solución**:
```bash
# Ubuntu/Debian
sudo apt-get install build-essential

# macOS
xcode-select --install

# Windows: Usar make.ps1 en su lugar
```

### PowerShell: "Execution Policy"

**Problema**: PowerShell no permite ejecutar scripts.

**Solución**:
```powershell
# Permitir ejecución de scripts (ejecutar como Administrador)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Verificar
Get-ExecutionPolicy
```

### Docker: "Cannot connect to Docker daemon"

**Problema**: Docker no está corriendo.

**Solución**:
```bash
# Verificar que Docker esté corriendo
docker ps

# Windows/macOS: Iniciar Docker Desktop

# Linux: Iniciar servicio Docker
sudo systemctl start docker
sudo systemctl enable docker
```

### Error: "No such file or directory"

**Problema**: Ejecutando desde directorio incorrecto.

**Solución**:
```bash
# Asegurarse de estar en la raíz del proyecto
cd /path/to/technovastore
pwd  # Debe mostrar la raíz del proyecto

# Verificar que existan los archivos
ls -la Makefile make.ps1
```

### Error: "npm: command not found"

**Problema**: Node.js no está instalado.

**Solución**:
```bash
# Instalar Node.js 18+
# Visitar: https://nodejs.org/

# Verificar instalación
node --version
npm --version
```

### Docker: "Service 'X' failed to build"

**Problema**: Error al construir imagen Docker.

**Solución**:
```bash
# Ver logs detallados
docker-compose -f docker-compose.optimized.yml build --no-cache X

# Limpiar y reconstruir
make docker-clean
make docker-build
```

### Tests Fallan

**Problema**: Tests no pasan.

**Solución**:
```bash
# Limpiar y reinstalar dependencias
make clean-all
make install

# Reconstruir
make build

# Ejecutar tests con más detalle
cd domains/catalog/product-service
npm test -- --verbose
```

---

## Arquitectura de los Scripts

### Organización por Dominios

Los scripts están organizados siguiendo la arquitectura de dominios del proyecto:

```
domains/
├── catalog/          → install-catalog, build-catalog, test-catalog
├── commerce/         → install-commerce, build-commerce, test-commerce
├── customer/         → install-customer, build-customer, test-customer
├── support/          → install-support, build-support, test-support
└── platform/         → install-platform, build-platform, test-platform
```

### Docker Compose

Los scripts usan **docker-compose.optimized.yml** por defecto:

```bash
# Desarrollo
make docker-up  → docker-compose -f docker-compose.optimized.yml up -d

# Producción
make prod-up    → docker-compose -f docker-compose.prod.yml up -d
```

### Variables de Entorno

Los scripts respetan las variables de entorno configuradas en:
- `.env.docker`
- `.env.shared`
- `.env.prod` (producción)

---

## Mejores Prácticas

### 1. Usar Comandos por Dominio

```bash
# ✅ BUENO: Trabajar en un dominio específico
make install-catalog
make build-catalog
make test-catalog

# ❌ EVITAR: Instalar/compilar todo si solo trabajas en un dominio
make install
make build
```

### 2. Verificar Antes de Commit

```bash
# Antes de hacer commit
make lint
make format-check
make test
```

### 3. Limpiar Regularmente

```bash
# Limpiar artefactos de compilación
make clean

# Si hay problemas, limpieza completa
make clean-all
make install
```

### 4. Monitorear Recursos

```bash
# Ver uso de recursos antes de iniciar servicios
make docker-stats

# Si hay problemas de memoria, iniciar solo lo necesario
docker-compose -f docker-compose.optimized.yml up -d mongodb redis
```

### 5. Usar Health Checks

```bash
# Después de iniciar servicios
make health-check

# Verificar estructura
make check-structure
```

---

## Documentación Relacionada

- [Architecture](../architecture/ARCHITECTURE.md) - Arquitectura del sistema
- [Development Setup](./setup.md) - Configuración del entorno de desarrollo
- [Docker Best Practices](../deployment/docker-best-practices.md) - Mejores prácticas de Docker
- [Testing Guide](../../e2e-tests/README.md) - Guía de testing

---

## Contribuir

Si encuentras problemas o quieres agregar nuevos comandos:

1. Editar `Makefile` para Linux/macOS
2. Editar `make.ps1` para Windows
3. Mantener ambos sincronizados
4. Actualizar esta documentación
5. Probar en ambas plataformas

---

**Última actualización**: Noviembre 2024  
**Mantenido por**: Equipo de DevOps TechNovaStore
