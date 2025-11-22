# Scripts de Utilities

Scripts de utilidades generales, monitoreo y herramientas auxiliares para TechNovaStore.

---

## Scripts Disponibles

### Gestión de Datos

#### `populate-free-products.js`

Poblar la base de datos con productos de prueba usando APIs gratuitas.

**Uso:**
```bash
node scripts/utilities/populate-free-products.js
```

**Funcionalidad:**
- Obtiene productos de APIs gratuitas (FakeStore API, DummyJSON)
- Transforma datos al formato de TechNovaStore
- Inserta productos en MongoDB
- Genera datos de prueba realistas

**Requisitos:**
- MongoDB corriendo
- Conexión a internet

📖 [Ver documentación detallada](../README_POPULATE.md)

---

### Gestión de Usuarios

#### `create-admin-user.ps1`

Crear usuario administrador en el sistema.

**Uso:**
```powershell
.\scripts\utilities\create-admin-user.ps1
```

**Funcionalidad:**
- Crea usuario con rol de administrador
- Configura permisos completos
- Genera credenciales seguras
- Registra en base de datos

**Parámetros:**
```powershell
# Con parámetros personalizados
.\scripts\utilities\create-admin-user.ps1 -Email "admin@technovastore.com" -Password "SecurePass123!"
```

---

### Monitoreo

#### `monitor-services.js`

Monitorear servicios en tiempo real.

**Uso:**
```bash
node scripts/utilities/monitor-services.js
```

**Funcionalidad:**
- Monitoreo continuo de servicios
- Métricas en tiempo real
- Alertas de problemas
- Dashboard en consola

**Salida:**
```
=== TechNovaStore Service Monitor ===
Actualizado: 2025-11-22 10:30:45

Servicio              Estado    CPU    Memoria    Uptime
─────────────────────────────────────────────────────────
API Gateway           ✓ UP      2%     128 MB     2h 15m
Product Service       ✓ UP      1%     95 MB      2h 15m
Order Service         ✓ UP      3%     110 MB     2h 15m
MongoDB               ✓ UP      5%     512 MB     2h 15m
PostgreSQL            ✓ UP      4%     256 MB     2h 15m
Redis                 ✓ UP      1%     32 MB      2h 15m
```

**Opciones:**
```bash
# Intervalo de actualización (segundos)
node scripts/utilities/monitor-services.js --interval 5

# Modo compacto
node scripts/utilities/monitor-services.js --compact
```

---

#### `start-monitoring.cmd`

Iniciar stack completo de monitoreo (Prometheus, Grafana, ELK).

**Uso:**
```cmd
.\scripts\utilities\start-monitoring.cmd
```

**Funcionalidad:**
- Inicia Prometheus (métricas)
- Inicia Grafana (visualización)
- Inicia ELK Stack (logs)
- Configura dashboards automáticamente

**Servicios iniciados:**
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3013
- Kibana: http://localhost:5601

---

#### `monitoring`

Script auxiliar de monitoreo (legacy).

**Nota:** Este script está siendo reemplazado por `monitor-services.js`. Se mantiene por compatibilidad.

---

## Casos de Uso

### Preparar Entorno de Desarrollo

```bash
# 1. Poblar base de datos con productos de prueba
node scripts/utilities/populate-free-products.js

# 2. Crear usuario administrador
.\scripts\utilities\create-admin-user.ps1

# 3. Iniciar monitoreo
node scripts/utilities/monitor-services.js
```

---

### Monitoreo Continuo

```bash
# Terminal 1: Monitoreo de servicios
node scripts/utilities/monitor-services.js

# Terminal 2: Stack de monitoreo completo
.\scripts\utilities\start-monitoring.cmd
```

---

### Debugging de Problemas

```bash
# 1. Verificar estado de servicios
node scripts/utilities/monitor-services.js --compact

# 2. Ver logs en tiempo real
docker-compose logs -f <service-name>

# 3. Verificar métricas en Grafana
# Abrir: http://localhost:3013
```

---

## Configuración

### Variables de Entorno

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/technovastore

# PostgreSQL
POSTGRES_URI=postgresql://user:pass@localhost:5432/technovastore

# Redis
REDIS_URI=redis://localhost:6379

# Monitoreo
MONITOR_INTERVAL=10
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=90
```

---

## Integración con Herramientas

### Prometheus

Los scripts de monitoreo exponen métricas compatibles con Prometheus:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'technovastore-services'
    static_configs:
      - targets: ['localhost:3000', 'localhost:3001', ...]
```

### Grafana

Dashboards pre-configurados disponibles en:
- `infrastructure/grafana/provisioning/dashboards/`

### ELK Stack

Logs estructurados enviados automáticamente a Logstash:
- Puerto: 5000 (TCP)
- Formato: JSON

---

## Troubleshooting

### populate-free-products.js falla

**Error:** "Cannot connect to MongoDB"

**Solución:**
```bash
# Verificar que MongoDB está corriendo
docker ps | grep mongodb

# Iniciar MongoDB si no está corriendo
docker-compose up -d mongodb

# Reintentar
node scripts/utilities/populate-free-products.js
```

---

### monitor-services.js no muestra servicios

**Error:** "No services found"

**Solución:**
```bash
# Verificar que Docker está corriendo
docker ps

# Verificar que servicios están iniciados
docker-compose ps

# Reiniciar servicios si es necesario
docker-compose restart
```

---

### create-admin-user.ps1 falla

**Error:** "User already exists"

**Solución:**
```powershell
# Eliminar usuario existente primero
# Conectar a MongoDB y ejecutar:
db.users.deleteOne({ email: "admin@technovastore.com" })

# Reintentar
.\scripts\utilities\create-admin-user.ps1
```

---

## Desarrollo de Nuevas Utilidades

Para agregar nuevas utilidades:

1. Crear script en `scripts/utilities/`
2. Seguir convenciones de nomenclatura
3. Agregar documentación en este README
4. Agregar ejemplos de uso
5. Incluir manejo de errores

**Template básico:**
```javascript
#!/usr/bin/env node

/**
 * Descripción del script
 * 
 * Uso: node scripts/utilities/mi-script.js
 */

async function main() {
  try {
    // Lógica principal
    console.log('Script ejecutado exitosamente');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
```

---

## Mantenimiento

### Scripts Obsoletos

Los siguientes scripts están marcados como obsoletos:
- `monitoring` - Reemplazado por `monitor-services.js`

### Scripts en Desarrollo

Los siguientes scripts están en desarrollo:
- `backup-database.js` - Backup automático de bases de datos
- `restore-database.js` - Restauración de backups

---

*Documentación actualizada: 22 de noviembre de 2025*
