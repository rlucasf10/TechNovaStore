# Scripts de Deployment

Scripts para desplegar y construir el proyecto TechNovaStore en diferentes entornos.

---

## Scripts Disponibles

### Deployment General

#### `deploy.ps1` (PowerShell)
Deployment general del proyecto para desarrollo.

**Uso:**
```powershell
.\scripts\deployment\deploy.ps1
```

#### `deploy.sh` (Bash)
Deployment general del proyecto para desarrollo (Linux/Mac).

**Uso:**
```bash
./scripts/deployment/deploy.sh
```

---

### Deployment a Producción

#### `deploy-prod.ps1` (PowerShell)
Deployment a producción con configuraciones optimizadas.

**Uso:**
```powershell
.\scripts\deployment\deploy-prod.ps1
```

**Características:**
- Configuración de producción
- Optimizaciones de rendimiento
- Validaciones de seguridad

#### `deploy-prod.sh` (Bash)
Deployment a producción (Linux/Mac).

**Uso:**
```bash
./scripts/deployment/deploy-prod.sh
```

#### `deploy-prod-enhanced.sh` (Bash)
Deployment mejorado con validaciones adicionales.

**Uso:**
```bash
./scripts/deployment/deploy-prod-enhanced.sh
```

**Características adicionales:**
- Validaciones pre-deployment
- Health checks automáticos
- Rollback automático en caso de fallo

---

### Build Optimizado

#### `build-optimized.ps1` (PowerShell)
Build optimizado de imágenes Docker.

**Uso:**
```powershell
.\scripts\deployment\build-optimized.ps1
```

**Optimizaciones:**
- Multi-stage builds
- Cache de capas Docker
- Reducción de tamaño de imágenes

#### `build-optimized.sh` (Bash)
Build optimizado de imágenes Docker (Linux/Mac).

**Uso:**
```bash
./scripts/deployment/build-optimized.sh
```

---

### Configuración de Logging

#### `setup-logging.ps1` (PowerShell)
Configurar sistema de logging (ELK Stack).

**Uso:**
```powershell
.\scripts\deployment\setup-logging.ps1
```

#### `setup-logging.sh` (Bash)
Configurar sistema de logging (Linux/Mac).

**Uso:**
```bash
./scripts/deployment/setup-logging.sh
```

---

### Configuración de CDN

#### `setup-cloudflare-cdn.js` (Node.js)
Configurar CDN de Cloudflare para el proyecto.

**Uso:**
```bash
node scripts/deployment/setup-cloudflare-cdn.js
```

**Requisitos:**
- Cuenta de Cloudflare
- API Token configurado
- Dominio registrado

#### `install-cdn-dependencies.ps1` (PowerShell)
Instalar dependencias necesarias para CDN.

**Uso:**
```powershell
.\scripts\deployment\install-cdn-dependencies.ps1
```

---

## Flujo de Deployment

### Desarrollo

```powershell
# 1. Build optimizado
.\scripts\deployment\build-optimized.ps1

# 2. Deploy a desarrollo
.\scripts\deployment\deploy.ps1

# 3. Verificar servicios
node scripts\testing\health-check.js
```

---

### Producción

```powershell
# 1. Build optimizado
.\scripts\deployment\build-optimized.ps1

# 2. Deploy a producción
.\scripts\deployment\deploy-prod-enhanced.sh

# 3. Validar deployment
node scripts\testing\validate-all-services.js
```

---

## Variables de Entorno

Los scripts de deployment utilizan las siguientes variables de entorno:

- `NODE_ENV` - Entorno de ejecución (development, production)
- `DOCKER_COMPOSE_FILE` - Archivo docker-compose a usar
- `BUILD_CACHE` - Habilitar/deshabilitar cache de build

---

## Troubleshooting

### Build falla por falta de memoria

**Solución:**
```powershell
# Aumentar memoria de Docker Desktop
# Settings > Resources > Memory > 4GB+
```

### Deployment falla por puerto ocupado

**Solución:**
```powershell
# Detener servicios existentes
.\scripts\docker\stop-all.ps1

# Reintentar deployment
.\scripts\deployment\deploy.ps1
```

---

*Documentación actualizada: 22 de noviembre de 2025*
