# Scripts de TechNovaStore

Colección de scripts para gestionar, desplegar y monitorear el proyecto TechNovaStore.

---

## Estructura de Carpetas

```
scripts/
├── archive/              # Scripts archivados (migración completada)
├── deployment/          # Scripts de deployment y build
├── docker/              # Gestión de contenedores Docker
├── setup/               # Instalación y configuración
├── testing/             # Scripts de testing y validación
└── utilities/           # Utilidades generales y monitoreo
```

---

## Scripts por Categoría

### 🐳 Docker (`scripts/docker/`)

Scripts para gestionar contenedores y servicios Docker.

- **`start-all-services.ps1`** - Iniciar todos los servicios
- **`start-minimal.ps1`** - Iniciar servicios mínimos (desarrollo)
- **`stop-all.ps1`** - Detener todos los servicios
- **`restart-services.ps1`** - Reiniciar servicios

📖 [Ver documentación completa](docker/README.md)

---

### ⚙️ Setup (`scripts/setup/`)

Scripts para instalar y configurar el proyecto.

- **`install-all.ps1`** - Instalar todas las dependencias
- **`verify-installation.ps1`** - Verificar instalación correcta

📖 [Ver documentación completa](setup/README.md)

---

### 🚀 Deployment (`scripts/deployment/`)

Scripts para desplegar el proyecto en diferentes entornos.

- **`deploy.ps1`** - Deployment general (PowerShell)
- **`deploy.sh`** - Deployment general (Bash)
- **`deploy-prod.ps1`** - Deployment a producción (PowerShell)
- **`deploy-prod.sh`** - Deployment a producción (Bash)
- **`deploy-prod-enhanced.sh`** - Deployment mejorado con validaciones
- **`build-optimized.ps1`** - Build optimizado de imágenes Docker (PowerShell)
- **`build-optimized.sh`** - Build optimizado de imágenes Docker (Bash)
- **`setup-logging.ps1`** - Configurar sistema de logging (PowerShell)
- **`setup-logging.sh`** - Configurar sistema de logging (Bash)
- **`setup-cloudflare-cdn.js`** - Configurar CDN de Cloudflare
- **`install-cdn-dependencies.ps1`** - Instalar dependencias de CDN

**Uso:**
```bash
# Desarrollo
.\scripts\deployment\deploy.ps1

# Producción
.\scripts\deployment\deploy-prod.ps1

# Build optimizado
.\scripts\deployment\build-optimized.ps1
```

---

### 🧪 Testing (`scripts/testing/`)

Scripts para testing y validación de servicios.

- **`health-check.js`** - Verificar salud de servicios
- **`validate-all-services.js`** - Validar todos los servicios

**Uso rápido:**
```bash
# Verificar salud de servicios
node scripts/testing/health-check.js

# Validar todos los servicios
node scripts/testing/validate-all-services.js
```

---

### 🛠️ Utilities (`scripts/utilities/`)

Scripts de utilidades generales y monitoreo.

- **`populate-free-products.js`** - Poblar base de datos con productos de prueba
- **`create-admin-user.ps1`** - Crear usuario administrador
- **`monitor-services.js`** - Monitorear servicios en tiempo real
- **`start-monitoring.cmd`** - Iniciar stack de monitoreo
- **`monitoring`** - Script de monitoreo

**Uso:**
```bash
# Poblar productos de prueba
node scripts/utilities/populate-free-products.js

# Crear usuario administrador
.\scripts\utilities\create-admin-user.ps1

# Monitorear en tiempo real
node scripts/utilities/monitor-services.js
```

---

### 📦 Archive (`scripts/archive/`)

Scripts archivados de la migración a Screaming Architecture.

- **`migration-2025/`** - Scripts de migración (Phases 0-4)

⚠️ **Nota:** Estos scripts ya cumplieron su propósito y NO deben ejecutarse nuevamente.

📖 [Ver documentación del archivo](archive/migration-2025/README.md)

---

## Guías de Uso Rápido

### Instalación Inicial

```powershell
# 1. Instalar dependencias
.\scripts\setup\install-all.ps1

# 2. Verificar instalación
.\scripts\setup\verify-installation.ps1

# 3. Iniciar servicios mínimos
.\scripts\docker\start-minimal.ps1

# 4. Verificar servicios
node scripts\testing\health-check.js
```

---

### Desarrollo Diario

```powershell
# Iniciar servicios
.\scripts\docker\start-minimal.ps1

# Verificar salud
node scripts\testing\health-check.js

# Detener al finalizar
.\scripts\docker\stop-all.ps1
```

---

### Deployment

```powershell
# Build optimizado
.\scripts\deployment\build-optimized.ps1

# Deploy a producción
.\scripts\deployment\deploy-prod.ps1
```

---

### Testing y Validación

```powershell
# Verificar salud de servicios
node scripts\testing\health-check.js

# Validar todos los servicios
node scripts\testing\validate-all-services.js
```

---

### Monitoreo

```powershell
# Monitorear en tiempo real
node scripts\utilities\monitor-services.js

# Iniciar stack de monitoreo
.\scripts\utilities\start-monitoring.cmd
```

---

## Requisitos

### Software Requerido
- **Node.js:** 18.x o superior
- **npm:** 9.x o superior
- **Docker Desktop:** 4.x o superior
- **PowerShell:** 7.x o superior (Windows)
- **Bash:** 4.x o superior (Linux/Mac)

### Sistema Operativo
- Windows 10/11
- macOS 10.15+
- Linux (Ubuntu 20.04+)

---

## Convenciones

### Nomenclatura de Scripts

- **PowerShell:** `nombre-script.ps1`
- **Bash:** `nombre-script.sh`
- **Node.js:** `nombre-script.js`
- **Batch:** `nombre-script.cmd`

### Organización

- Scripts de **deployment** → `scripts/deployment/`
- Scripts de **gestión de Docker** → `scripts/docker/`
- Scripts de **instalación** → `scripts/setup/`
- Scripts de **testing** → `scripts/testing/`
- Scripts de **utilidades y monitoreo** → `scripts/utilities/`

---

## Documentación Adicional

### Documentación del Proyecto
- `README.md` - Documentación principal del proyecto
- `CONTRIBUTING.md` - Guía de contribución
- `docs/` - Documentación detallada

### Documentación de Migración
- `docs/migration/MIGRATION_PLAN.md` - Plan de migración
- `docs/migration/ROOT_SCRIPTS_ANALYSIS.md` - Análisis de scripts en raíz
- `docs/architecture/CURRENT_STRUCTURE.md` - Estructura actual

### Documentación de Scripts
- `scripts/docker/README.md` - Scripts de Docker
- `scripts/setup/README.md` - Scripts de setup
- `scripts/archive/migration-2025/README.md` - Scripts archivados

---

## Troubleshooting

### Scripts de PowerShell no se ejecutan

**Error:** "Execution of scripts is disabled on this system"

**Solución:**
```powershell
# Ejecutar como Administrador
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

### Docker no está corriendo

**Error:** "Cannot connect to the Docker daemon"

**Solución:**
1. Iniciar Docker Desktop
2. Esperar a que esté completamente iniciado
3. Verificar: `docker ps`

---

### Puerto ocupado

**Error:** "Port 3000 is already in use"

**Solución:**
```powershell
# Ver qué proceso usa el puerto
netstat -ano | findstr :3000

# Detener proceso
taskkill /PID <pid> /F
```

---

### Permisos insuficientes

**Error:** "Permission denied"

**Solución:**
- **Windows:** Ejecutar PowerShell como Administrador
- **Linux/Mac:** Usar `sudo` o ajustar permisos con `chmod +x`

---

## Contribuir

Para agregar nuevos scripts:

1. Colocar el script en la carpeta apropiada
2. Seguir las convenciones de nomenclatura
3. Agregar documentación en el README de la carpeta
4. Actualizar este README principal
5. Crear PR con descripción clara

---

## Historial de Cambios

### 22 de noviembre de 2025
- ✅ Reorganización completa de scripts (Phase 5, Task 34.1)
- ✅ Creada estructura `deployment/`, `testing/`, `utilities/`
- ✅ Movidos scripts de deployment a `scripts/deployment/`
- ✅ Movidos scripts de testing a `scripts/testing/`
- ✅ Movidos scripts de utilities a `scripts/utilities/`
- ✅ Actualizada documentación completa
- ✅ Estructura anterior: `docker/`, `setup/`, `archive/`
- ✅ Archivados scripts de migración

### Octubre-Noviembre de 2025
- ✅ Migración a Screaming Architecture (Phases 0-4)
- ✅ Scripts de análisis y consolidación
- ✅ Scripts de corrección y validación

---

## Contacto y Soporte

Para preguntas o problemas con los scripts:

1. Revisar la documentación en `docs/`
2. Consultar los READMEs específicos de cada carpeta
3. Revisar issues en el repositorio
4. Contactar al equipo de desarrollo

---

*Documentación actualizada como parte de Phase 5: Limpieza Final y Documentación*
