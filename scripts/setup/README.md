# Scripts de Instalación y Configuración

Scripts para instalar, configurar y verificar el proyecto TechNovaStore.

---

## Scripts Disponibles

### `install-all.ps1`
Instala todas las dependencias de npm para todos los servicios del proyecto.

**Uso:**
```powershell
.\scripts\setup\install-all.ps1
```

**Acciones realizadas:**
1. Instala dependencias del proyecto raíz
2. Instala dependencias de cada microservicio
3. Instala dependencias de shared packages
4. Instala dependencias del frontend
5. Verifica instalación exitosa

**Tiempo estimado:** 5-10 minutos (dependiendo de la conexión)

**Requisitos:**
- Node.js 18+ instalado
- npm 9+ instalado
- Conexión a internet

---

### `verify-installation.ps1`
Verifica que el proyecto esté correctamente instalado y configurado.

**Uso:**
```powershell
.\scripts\setup\verify-installation.ps1
```

**Verificaciones realizadas:**
1. ✅ Node.js y npm instalados
2. ✅ Docker Desktop instalado y corriendo
3. ✅ Dependencias de npm instaladas
4. ✅ Archivos de configuración presentes
5. ✅ Variables de entorno configuradas
6. ✅ Puertos disponibles

**Salida:**
- ✅ Verde: Todo correcto
- ⚠️ Amarillo: Advertencia (no crítico)
- ❌ Rojo: Error (requiere acción)

---

## Proceso de Instalación Completo

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd TechNovaStore
```

### 2. Instalar Dependencias
```powershell
.\scripts\setup\install-all.ps1
```

### 3. Configurar Variables de Entorno
```powershell
# Copiar archivos de ejemplo
Copy-Item .env.docker.example .env.docker
Copy-Item .env.shared.example .env.shared

# Editar con tus valores
notepad .env.docker
notepad .env.shared
```

### 4. Verificar Instalación
```powershell
.\scripts\setup\verify-installation.ps1
```

### 5. Iniciar Servicios
```powershell
.\scripts\docker\start-minimal.ps1
```

---

## Configuración Adicional

### Configurar Logging
```powershell
.\scripts\setup-logging.ps1
```

### Crear Usuario Administrador
```powershell
.\scripts\setup\create-admin-user.ps1
```

### Configurar CDN (Opcional)
```powershell
.\scripts\setup-cloudflare-cdn.js
```

---

## Troubleshooting

### Error: "npm not found"
**Solución:** Instalar Node.js desde https://nodejs.org/

### Error: "Docker not running"
**Solución:** Iniciar Docker Desktop

### Error: "Port already in use"
**Solución:** 
```powershell
# Ver qué proceso usa el puerto
netstat -ano | findstr :<puerto>

# Detener proceso
taskkill /PID <pid> /F
```

### Error: "Permission denied"
**Solución:** Ejecutar PowerShell como Administrador

### Error: "Module not found"
**Solución:** 
```powershell
# Limpiar cache de npm
npm cache clean --force

# Reinstalar dependencias
Remove-Item -Recurse -Force node_modules
.\scripts\setup\install-all.ps1
```

---

## Requisitos del Sistema

### Mínimos
- **OS:** Windows 10/11, macOS 10.15+, Linux (Ubuntu 20.04+)
- **RAM:** 8 GB (solo servicios esenciales)
- **Disco:** 10 GB libres
- **CPU:** 4 cores

### Recomendados
- **OS:** Windows 11, macOS 12+, Linux (Ubuntu 22.04+)
- **RAM:** 16 GB (todos los servicios)
- **Disco:** 20 GB libres
- **CPU:** 8 cores

### Software Requerido
- Node.js 18.x o superior
- npm 9.x o superior
- Docker Desktop 4.x o superior
- Git 2.x o superior

---

## Archivos de Configuración

### Variables de Entorno
- `.env.docker` - Configuración para Docker
- `.env.shared` - Variables compartidas entre servicios
- `.env.prod.example` - Template para producción
- `.env.staging.example` - Template para staging

### Configuración de Proyecto
- `package.json` - Dependencias del proyecto
- `tsconfig.base.json` - Configuración base de TypeScript
- `jest.config.base.js` - Configuración base de Jest
- `.eslintrc.js` - Configuración de ESLint

---

## Scripts Relacionados

### En `scripts/docker/`
- `start-all-services.ps1` - Iniciar todos los servicios
- `start-minimal.ps1` - Iniciar servicios mínimos
- `stop-all.ps1` - Detener todos los servicios

### En `scripts/monitoring/`
- `verify-services.ps1` - Verificar estado de servicios
- `health-check.js` - Verificar salud de servicios
- `validate-all-services.js` - Validar todos los servicios

---

## Próximos Pasos

Después de completar la instalación:

1. **Explorar la documentación:**
   - `README.md` - Documentación principal
   - `docs/` - Documentación detallada

2. **Iniciar desarrollo:**
   - `.\scripts\docker\start-minimal.ps1`
   - Abrir http://localhost:3011 (Frontend)
   - Abrir http://localhost:3000 (API Gateway)

3. **Ejecutar tests:**
   - `npm test` - Tests unitarios
   - `npm run test:integration` - Tests de integración

4. **Monitorear servicios:**
   - http://localhost:3013 (Grafana)
   - http://localhost:9090 (Prometheus)
   - http://localhost:5601 (Kibana)

---

*Scripts organizados como parte de Phase 5: Limpieza Final y Documentación*
