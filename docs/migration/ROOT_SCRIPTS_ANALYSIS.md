# Análisis de Scripts en la Raíz del Proyecto

**Fecha:** 22 de noviembre de 2025  
**Contexto:** Limpieza de Phase 5 - Organización de scripts dispersos

---

## Scripts Identificados en la Raíz

### Scripts de PowerShell (6 archivos)

1. **`install-all.ps1`**
   - Propósito: Instalar dependencias de todos los servicios
   - Categoría: Setup/Instalación
   - Destino: `scripts/setup/`

2. **`restart-services.ps1`**
   - Propósito: Reiniciar servicios Docker
   - Categoría: Operaciones/Docker
   - Destino: `scripts/docker/`

3. **`start-all-services.ps1`**
   - Propósito: Iniciar todos los servicios Docker
   - Categoría: Operaciones/Docker
   - Destino: `scripts/docker/`

4. **`start-minimal.ps1`**
   - Propósito: Iniciar servicios mínimos para desarrollo
   - Categoría: Operaciones/Docker
   - Destino: `scripts/docker/`

5. **`stop-all.ps1`**
   - Propósito: Detener todos los servicios Docker
   - Categoría: Operaciones/Docker
   - Destino: `scripts/docker/`

6. **`verify-installation.ps1`**
   - Propósito: Verificar instalación del proyecto
   - Categoría: Setup/Verificación
   - Destino: `scripts/setup/`

7. **`verify-services.ps1`**
   - Propósito: Verificar estado de servicios
   - Categoría: Monitoreo
   - Destino: `scripts/monitoring/`

### Archivos de Reporte (2 archivos)

1. **`duplicate-analysis-report.json`**
   - Propósito: Reporte de análisis de duplicados (obsoleto)
   - Categoría: Reporte de migración
   - Destino: `logs/migration/` o eliminar

2. **`FRONTEND_REORGANIZATION_SUMMARY.md`**
   - Propósito: Resumen de reorganización del frontend
   - Categoría: Documentación de migración
   - Destino: `docs/migration/`

---

## Plan de Reorganización

### Crear Nuevas Carpetas

```
scripts/
├── docker/          # Scripts de gestión de Docker
├── setup/           # Scripts de instalación y configuración
├── monitoring/      # Scripts de monitoreo (ya existe parcialmente)
└── deployment/      # Scripts de deployment (ya existe parcialmente)
```

### Movimientos Propuestos

#### A `scripts/docker/`
- `restart-services.ps1`
- `start-all-services.ps1`
- `start-minimal.ps1`
- `stop-all.ps1`

#### A `scripts/setup/`
- `install-all.ps1`
- `verify-installation.ps1`

#### A `scripts/monitoring/`
- `verify-services.ps1`

#### A `logs/migration/`
- `duplicate-analysis-report.json`

#### A `docs/migration/`
- `FRONTEND_REORGANIZATION_SUMMARY.md`

---

## Archivos a Mantener en la Raíz

Los siguientes archivos DEBEN permanecer en la raíz:

### Configuración Esencial
- `.env.*` - Archivos de configuración de entorno
- `.eslintrc.js` - Configuración de ESLint
- `.prettierrc` - Configuración de Prettier
- `.gitignore` - Configuración de Git
- `.dockerignore` - Configuración de Docker
- `.npmrc` - Configuración de npm

### Docker Compose
- `docker-compose.yml`
- `docker-compose.optimized.yml`
- `docker-compose.prod.yml`
- `docker-compose.dev.yml`
- `docker-compose.staging.yml`

### Configuración de Proyecto
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `tsconfig.base.json`
- `jest.config.js`
- `jest.config.base.js`
- `jest.ci.config.js`
- `jest.integration.config.js`
- `Makefile`

### Documentación Principal
- `README.md`
- `CONTRIBUTING.md`

---

## Beneficios de la Reorganización

1. **Claridad:** Scripts organizados por propósito
2. **Mantenibilidad:** Más fácil encontrar y actualizar scripts
3. **Raíz limpia:** Solo archivos esenciales en la raíz
4. **Consistencia:** Toda la documentación de migración en un lugar

---

*Análisis generado como parte de la limpieza de Phase 5*
