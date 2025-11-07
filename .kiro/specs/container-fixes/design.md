# Design Document: Container Fixes

## Overview

Este documento describe el diseño de la solución para resolver todos los problemas identificados en los 23 contenedores Docker de TechnovaStore. La solución se enfoca en corregir 6 errores críticos, 3 problemas menores, 2 loops de reinicio, y realizar limpieza de archivos innecesarios.

### Objetivos

1. Lograr que al menos 15 de 18 servicios de aplicación estén en estado healthy
2. Resolver todos los errores de compilación TypeScript
3. Corregir problemas de configuración de bases de datos
4. Optimizar asignación de recursos
5. Limpiar archivos Docker Compose obsoletos
6. Mantener compatibilidad entre entornos de desarrollo y producción

### Alcance

**En alcance:**
- Corrección de errores críticos en 6 servicios
- Corrección de problemas menores en 3 servicios
- Corrección de loops de reinicio en 2 servicios de monitoreo
- Limpieza de archivos Docker Compose innecesarios
- Sincronización de configuraciones entre docker-compose.optimized.yml y docker-compose.prod.yml

**Fuera de alcance:**
- Implementación de nuevas funcionalidades
- Cambios en la arquitectura de microservicios
- Migración de bases de datos
- Optimización de rendimiento más allá de la asignación de recursos

## Architecture

### Arquitectura Actual

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Compose Layer                     │
├─────────────────────────────────────────────────────────────┤
│  docker-compose.optimized.yml (desarrollo)                  │
│  docker-compose.prod.yml (producción)                       │
│  docker-compose.staging.yml (staging)                       │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐   ┌───────▼────────┐   ┌───────▼────────┐
│   Databases    │   │   Services     │   │  Monitoring    │
├────────────────┤   ├────────────────┤   ├────────────────┤
│ MongoDB ✅     │   │ Order ❌       │   │ Prometheus ✅  │
│ PostgreSQL ✅  │   │ User ❌        │   │ Grafana ✅     │
│ Redis ✅       │   │ Payment ❌     │   │ Alertmgr 🔄   │
└────────────────┘   │ Product ⚠️     │   │ Node Exp 🔄   │
                     │ Sync ❌        │   └────────────────┘
                     │ Shipment ❌    │
                     │ Recommender ❌ │
                     │ Auto-Purch ⚠️  │
                     │ API Gateway ⚠️ │
                     │ Frontend ✅    │
                     │ Chatbot ✅     │
                     │ Ticket ✅      │
                     │ Notification ✅│
                     └────────────────┘
```

### Estrategia de Corrección

La solución se implementará en 3 fases:

**Fase 1: Errores Críticos de Compilación**
- Resolver dependencias faltantes
- Corregir importaciones TypeScript
- Configurar builds correctamente

**Fase 2: Configuración y Recursos**
- Corregir conexiones a bases de datos
- Ajustar límites de memoria
- Corregir health checks

**Fase 3: Limpieza y Monitoreo**
- Eliminar archivos obsoletos
- Corregir configuraciones de monitoreo
- Validar sistema completo

## Components and Interfaces

### 1. Order Service (Crítico)

**Problema:** Error TS2305 - AuthenticatedRequest no exportado

**Solución:**
```typescript
// Opción A: Agregar a shared/types/index.ts
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Opción B: Definir localmente en services/order/src/types/index.ts
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}
```

**Archivos afectados:**
- `services/order/src/controllers/orderController.ts` (línea 7)
- `shared/types/index.ts` (si se usa opción A)
- `services/order/src/types/index.ts` (si se usa opción B)

**Decisión de diseño:** Usar opción A (shared-types) para reutilización en otros servicios.

### 2. User Service (Crítico)

**Problema:** Error TS2307 - express-validator no encontrado

**Solución:**
```json
// domains/customer/user-service/package.json
{
  "dependencies": {
    "express-validator": "^7.0.0"
  },
  "devDependencies": {
    "@types/express-validator": "^3.0.0"
  }
}
```

**Archivos afectados:**
- `domains/customer/user-service/package.json`
- `domains/customer/user-service/src/controllers/authController.ts` (línea 2)

**Pasos:**
1. Agregar dependencia a package.json
2. Ejecutar `npm install` en el contenedor o rebuild
3. Verificar importación en authController.ts

### 3. Payment Service (Crítico)

**Problema:** dist/index.js no encontrado - falta compilación

**Solución:**
```json
// services/payment/package.json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

**Dockerfile:**
```dockerfile
# Opción A: Modo desarrollo con ts-node
CMD ["npm", "run", "dev"]

# Opción B: Build y ejecutar
CMD ["sh", "-c", "npm run build && npm start"]
```

**Archivos afectados:**
- `services/payment/package.json`
- `services/payment/Dockerfile`

**Decisión de diseño:** Usar opción A (ts-node-dev) para desarrollo, mantener build para producción.

### 4. Sync Engine (Crítico)

**Problema:** Importación incorrecta de Redis

**Solución:**
```typescript
// automation/sync-engine/src/pricing/PriceCache.ts
// ANTES (línea 9):
import Redis from 'redis';
this.redis = Redis.createClient({...});

// DESPUÉS:
import { createClient } from 'redis';
this.redis = createClient({
  url: `redis://:${process.env.REDIS_PASSWORD}@redis:6379`
});
```

**Archivos afectados:**
- `automation/sync-engine/src/pricing/PriceCache.ts` (línea 9)
- Posiblemente otros archivos que usen Redis en sync-engine

**Patrón de búsqueda:** `import Redis from 'redis'` o `Redis.createClient`

### 5. Shipment Tracker (Crítico)

**Problema:** ECONNREFUSED - hostname incorrecto para PostgreSQL

**Solución:**
```yaml
# docker-compose.optimized.yml
shipment-tracker:
  environment:
    POSTGRES_HOST: postgresql  # NO "localhost"
    POSTGRES_PORT: 5432
    POSTGRES_DB: technovastore
    POSTGRES_USER: admin
    POSTGRES_PASSWORD: password
    # O usar URI completa:
    DATABASE_URL: postgresql://REDACTED_DB_PASSWORD@postgresql:5432/technovastore
```

**Archivos afectados:**
- `docker-compose.optimized.yml` (sección shipment-tracker)
- `docker-compose.prod.yml` (sección shipment-tracker)
- `automation/shipment-tracker/src/config/database.ts` (verificar configuración)

**Validación:** El servicio debe usar el hostname del servicio Docker, no localhost.

### 6. Recommender Service (Crítico)

**Problema:** Heap out of memory - límite de 256MB insuficiente

**Solución:**
```yaml
# docker-compose.optimized.yml
recommender:
  deploy:
    resources:
      limits:
        memory: 1G  # Aumentar de 256M a 1G
        cpus: '0.75'
      reservations:
        memory: 512M
        cpus: '0.5'
  environment:
    NODE_OPTIONS: "--max-old-space-size=896"
```

**Archivos afectados:**
- `docker-compose.optimized.yml` (sección recommender)
- `docker-compose.prod.yml` (sección recommender)

**Justificación:** Los servicios de IA/ML requieren más memoria para modelos y procesamiento.

### 7. Product Service (Menor)

**Problema:** Health check devuelve 503 aunque el servicio funciona

**Solución:**
```typescript
// services/product/src/routes/health.ts
import { Router } from 'express';
import mongoose from 'mongoose';
import { redisClient } from '../config/redis';

const router = Router();

router.get('/health', async (req, res) => {
  try {
    // Verificar MongoDB
    const mongoStatus = mongoose.connection.readyState === 1;
    
    // Verificar Redis
    const redisStatus = redisClient.isReady;
    
    if (mongoStatus && redisStatus) {
      return res.status(200).json({
        status: 'healthy',
        mongodb: 'connected',
        redis: 'connected',
        timestamp: new Date().toISOString()
      });
    }
    
    return res.status(503).json({
      status: 'unhealthy',
      mongodb: mongoStatus ? 'connected' : 'disconnected',
      redis: redisStatus ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
```

**Archivos afectados:**
- `services/product/src/routes/health.ts`
- `services/product/src/index.ts` (verificar que la ruta esté registrada)

### 8. Auto Purchase Service (Menor)

**Problema:** No puede conectar con Order Service (dependencia)

**Solución:** Este problema se resolverá automáticamente al arreglar Order Service (componente #1).

**Validación adicional:**
```typescript
// automation/auto-purchase/src/services/orderService.ts
// Verificar que use el hostname correcto
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:3000';
```

**Archivos a verificar:**
- `automation/auto-purchase/src/services/orderService.ts`
- `docker-compose.optimized.yml` (variable ORDER_SERVICE_URL)

### 9. API Gateway (Menor)

**Problema:** openapi.yaml no encontrado

**Solución:**
```yaml
# Opción A: Crear archivo básico
# docs/api/openapi.yaml
openapi: 3.0.0
info:
  title: TechnovaStore API
  version: 1.0.0
  description: API Gateway para TechnovaStore
servers:
  - url: http://localhost:3000
    description: Development server
paths:
  /health:
    get:
      summary: Health check
      responses:
        '200':
          description: Service is healthy

# Opción B: Deshabilitar Swagger en desarrollo
# api-gateway/src/index.ts
if (process.env.NODE_ENV === 'production') {
  // Solo cargar Swagger en producción
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}
```

**Archivos afectados:**
- `docs/api/openapi.yaml` (crear)
- `api-gateway/src/index.ts` (opcional: deshabilitar en dev)

**Decisión de diseño:** Crear archivo básico para evitar warnings, expandir después.

### 10. Alertmanager (Loop de reinicio)

**Problema:** Configuración YAML inválida - campos obsoletos

**Solución:**
```yaml
# infrastructure/alertmanager/alertmanager.yml
# ANTES (líneas 29-30, 43-44):
receivers:
  - name: 'email'
    email_configs:
      - to: 'admin@technovastore.com'
        subject: "Alert: {{ .GroupLabels.alertname }}"
        body: "{{ range .Alerts }}{{ .Annotations.description }}{{ end }}"

# DESPUÉS (formato Alertmanager 0.26+):
receivers:
  - name: 'email'
    email_configs:
      - to: 'admin@technovastore.com'
        headers:
          Subject: "Alert: {{ .GroupLabels.alertname }}"
        text: "{{ range .Alerts }}{{ .Annotations.description }}{{ end }}"
```

**Archivos afectados:**
- `infrastructure/alertmanager/alertmanager.yml` (líneas 29-30, 43-44)

**Referencia:** [Alertmanager Configuration](https://prometheus.io/docs/alerting/latest/configuration/)

### 11. Node Exporter (Loop de reinicio)

**Problema:** Volúmenes del sistema no disponibles en Windows

**Solución:**
```yaml
# docker-compose.optimized.yml
node-exporter:
  image: prom/node-exporter:latest
  container_name: technovastore-node-exporter
  restart: unless-stopped
  ports:
    - "9100:9100"
  # Comentar volúmenes problemáticos en Windows:
  # volumes:
  #   - /proc:/host/proc:ro
  #   - /sys:/host/sys:ro
  #   - /:/rootfs:ro
  # command:
  #   - '--path.procfs=/host/proc'
  #   - '--path.sysfs=/host/sys'
  #   - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
  networks:
    - technovastore-network
  deploy:
    resources:
      limits:
        memory: 128M
        cpus: '0.2'
  profiles: ["exporters"]
```

**Archivos afectados:**
- `docker-compose.optimized.yml` (sección node-exporter)
- `docker-compose.prod.yml` (mantener volúmenes para Linux)

**Decisión de diseño:** Comentar volúmenes en optimized.yml (Windows), mantener en prod.yml (Linux).

### 12. Docker Compose Cleanup

**Archivos a eliminar:**
- `docker-compose.yml` (reemplazado por optimized)
- `docker-compose.dev.yml` (vacío, no se usa)

**Archivos a mantener:**
- `docker-compose.optimized.yml` (desarrollo)
- `docker-compose.prod.yml` (producción)
- `docker-compose.staging.yml` (staging)

**Documentación a actualizar:**
- `README.md`
- `DEPLOYMENT.md`
- `docker-optimization-guide.md`
- Scripts que referencien docker-compose.yml

## Data Models

No aplica - este proyecto no modifica modelos de datos, solo configuraciones.

## Error Handling

### Estrategia de Manejo de Errores

**1. Errores de Compilación TypeScript**
- Validar con `tsc --noEmit` antes de commit
- Configurar pre-commit hooks con husky
- Agregar verificación en CI/CD

**2. Errores de Conexión a Bases de Datos**
- Implementar retry logic con backoff exponencial
- Logs descriptivos con parámetros de conexión (sin passwords)
- Health checks que verifiquen conectividad

**3. Errores de Memoria**
- Monitorear uso con Prometheus
- Alertas cuando uso > 80%
- Documentar requisitos mínimos

**4. Errores de Configuración**
- Validar archivos YAML con yamllint
- Schemas para validación de configuración
- Tests de integración para docker-compose

### Health Check Pattern

Todos los servicios deben implementar el siguiente patrón:

```typescript
interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  dependencies: {
    [key: string]: 'connected' | 'disconnected' | 'unknown';
  };
  version?: string;
  uptime?: number;
}

// Ejemplo:
{
  "status": "healthy",
  "timestamp": "2025-10-21T10:30:00Z",
  "dependencies": {
    "mongodb": "connected",
    "redis": "connected"
  },
  "version": "1.0.0",
  "uptime": 3600
}
```

### Logging Strategy

**Niveles de log por tipo de error:**
- Compilación: ERROR (bloquea inicio)
- Conexión BD: WARN (retry automático), ERROR (después de max retries)
- Memoria: WARN (80%), ERROR (90%), FATAL (OOM)
- Configuración: ERROR (archivo inválido)

**Formato de logs:**
```json
{
  "timestamp": "2025-10-21T10:30:00Z",
  "level": "ERROR",
  "service": "order-service",
  "message": "Failed to compile TypeScript",
  "error": {
    "code": "TS2305",
    "file": "src/controllers/orderController.ts",
    "line": 7,
    "details": "Module '@technovastore/shared-types' has no exported member 'AuthenticatedRequest'"
  }
}
```

## Testing Strategy

### 1. Unit Tests

**No requeridos para este proyecto** - solo correcciones de configuración.

### 2. Integration Tests

**Objetivo:** Verificar que los servicios se comunican correctamente después de las correcciones.

**Tests a implementar:**

```typescript
// tests/integration/services-health.test.ts
describe('Services Health Checks', () => {
  test('Order Service should be healthy', async () => {
    const response = await fetch('http://localhost:3002/health');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });

  test('User Service should be healthy', async () => {
    const response = await fetch('http://localhost:3003/health');
    expect(response.status).toBe(200);
  });

  // ... más tests para cada servicio
});

describe('Service Communication', () => {
  test('Auto Purchase should connect to Order Service', async () => {
    // Verificar que auto-purchase puede crear órdenes
    const response = await fetch('http://localhost:3007/api/test-order');
    expect(response.status).not.toBe(500);
  });

  test('API Gateway should route to all services', async () => {
    const services = ['order', 'user', 'payment', 'product'];
    for (const service of services) {
      const response = await fetch(`http://localhost:3000/api/${service}/health`);
      expect(response.status).toBe(200);
    }
  });
});
```

### 3. Docker Compose Validation

**Script de validación:**

```powershell
# scripts/validate-docker-compose.ps1
$files = @(
  "docker-compose.optimized.yml",
  "docker-compose.prod.yml",
  "docker-compose.staging.yml"
)

foreach ($file in $files) {
  Write-Host "Validating $file..."
  docker-compose -f $file config --quiet
  if ($LASTEXITCODE -ne 0) {
    Write-Error "$file has syntax errors"
    exit 1
  }
}

Write-Host "All docker-compose files are valid"
```

### 4. End-to-End Validation

**Script de validación completa:**

```powershell
# scripts/validate-all-services.ps1

# 1. Iniciar servicios
docker-compose -f docker-compose.optimized.yml up -d

# 2. Esperar 30 segundos para que inicien
Start-Sleep -Seconds 30

# 3. Verificar health checks
$services = @(
  @{name="order-service"; port=3002},
  @{name="user-service"; port=3003},
  @{name="payment-service"; port=3004},
  @{name="product-service"; port=3001},
  @{name="sync-engine"; port=3006},
  @{name="shipment-tracker"; port=3008},
  @{name="recommender"; port=3010}
)

$failed = @()

foreach ($service in $services) {
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:$($service.port)/health" -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
      Write-Host "✅ $($service.name) is healthy"
    } else {
      Write-Host "❌ $($service.name) returned $($response.StatusCode)"
      $failed += $service.name
    }
  } catch {
    Write-Host "❌ $($service.name) is not responding"
    $failed += $service.name
  }
}

# 4. Verificar estabilidad (5 minutos)
Write-Host "Monitoring stability for 5 minutes..."
Start-Sleep -Seconds 300

$containers = docker ps --filter "name=technovastore" --format "{{.Names}}\t{{.Status}}"
Write-Host $containers

# 5. Reporte final
if ($failed.Count -eq 0) {
  Write-Host "✅ All services are healthy and stable"
  exit 0
} else {
  Write-Host "❌ Failed services: $($failed -join ', ')"
  exit 1
}
```

### 5. Regression Tests

**Objetivo:** Asegurar que las correcciones no rompan funcionalidad existente.

**Áreas a verificar:**
- Frontend puede cargar y renderizar páginas
- API Gateway puede enrutar peticiones
- Servicios pueden autenticar usuarios
- Servicios pueden crear/leer/actualizar/eliminar datos
- Monitoreo (Prometheus/Grafana) sigue funcionando

### Testing Checklist

Antes de considerar el proyecto completo:

- [ ] Todos los servicios críticos pasan health checks
- [ ] No hay contenedores en estado "Restarting"
- [ ] docker-compose.optimized.yml es válido
- [ ] docker-compose.prod.yml es válido
- [ ] Servicios mantienen estabilidad por 5+ minutos
- [ ] API Gateway puede comunicarse con todos los backends
- [ ] Logs no muestran errores críticos
- [ ] Uso de memoria está dentro de límites
- [ ] Archivos obsoletos han sido eliminados
- [ ] Documentación ha sido actualizada

## Implementation Notes

### Orden de Implementación

**Fase 1: Errores Críticos (Prioridad ALTA)**
1. User Service (express-validator) - más simple
2. Order Service (AuthenticatedRequest) - depende de shared-types
3. Payment Service (build) - configuración
4. Sync Engine (Redis import) - búsqueda y reemplazo
5. Shipment Tracker (PostgreSQL) - configuración
6. Recommender (memoria) - configuración

**Fase 2: Problemas Menores (Prioridad MEDIA)**
7. Product Service (health check)
8. API Gateway (openapi.yaml)
9. Auto Purchase (validación post Order Service)

**Fase 3: Limpieza (Prioridad BAJA)**
10. Alertmanager (configuración YAML)
11. Node Exporter (volúmenes Windows)
12. Docker Compose cleanup
13. Documentación

### Rollback Strategy

Si algo falla durante la implementación:

1. **Backup antes de empezar:**
   ```powershell
   # Crear backup de configuraciones
   Copy-Item docker-compose.optimized.yml docker-compose.optimized.yml.backup
   Copy-Item docker-compose.prod.yml docker-compose.prod.yml.backup
   ```

2. **Commits atómicos:**
   - Un commit por servicio corregido
   - Mensaje descriptivo: "fix(order-service): add AuthenticatedRequest type"

3. **Validación incremental:**
   - Probar cada servicio después de corregirlo
   - No continuar si un servicio crítico falla

4. **Restauración:**
   ```powershell
   # Si algo falla, restaurar backup
   Copy-Item docker-compose.optimized.yml.backup docker-compose.optimized.yml
   docker-compose -f docker-compose.optimized.yml down
   docker-compose -f docker-compose.optimized.yml up -d
   ```

### Dependencies Between Fixes

```
User Service ─────────────────────┐
                                  │
Order Service ────────────────────┼──> Auto Purchase
                                  │
Payment Service ──────────────────┤
                                  │
Product Service ──────────────────┼──> API Gateway
                                  │
Sync Engine ──────────────────────┤
                                  │
Shipment Tracker ─────────────────┤
                                  │
Recommender ──────────────────────┘

Alertmanager ─────────────────────> (Independiente)
Node Exporter ────────────────────> (Independiente)
Docker Cleanup ───────────────────> (Al final)
```

### Environment-Specific Considerations

**docker-compose.optimized.yml (Windows/Development):**
- Límites de recursos más conservadores
- Node Exporter sin volúmenes del sistema
- Modo desarrollo (ts-node-dev)
- Logs en stdout

**docker-compose.prod.yml (Linux/Production):**
- Límites de recursos más generosos
- Node Exporter con volúmenes completos
- Modo producción (builds compilados)
- Logs en archivos + stdout
- Health checks más estrictos
- Restart policies más agresivos

### Performance Considerations

**Límites de recursos recomendados:**

| Servicio | Memoria Límite | CPU Límite | Justificación |
|----------|----------------|------------|---------------|
| MongoDB | 1G | 1.0 | Base de datos principal |
| PostgreSQL | 1G | 1.0 | Base de datos transaccional |
| Redis | 512M | 0.5 | Cache en memoria |
| Recommender | 1G | 0.75 | Modelos de IA/ML |
| Order Service | 256M | 0.25 | Servicio estándar |
| User Service | 256M | 0.25 | Servicio estándar |
| Payment Service | 256M | 0.25 | Servicio estándar |
| Product Service | 256M | 0.25 | Servicio estándar |
| Sync Engine | 256M | 0.25 | Procesamiento batch |
| Shipment Tracker | 256M | 0.25 | Servicio estándar |

**Total estimado:** ~6GB RAM para todos los servicios

### Security Considerations

- No exponer passwords en logs
- Usar variables de entorno para credenciales
- Mantener .env fuera de git
- Validar inputs en health checks
- Rate limiting en API Gateway

### Monitoring and Observability

Después de las correcciones, verificar:

1. **Prometheus metrics:**
   - `container_memory_usage_bytes`
   - `container_cpu_usage_seconds_total`
   - `up{job="services"}` (todos deben ser 1)

2. **Grafana dashboards:**
   - Services Health Overview
   - Resource Usage
   - Error Rates

3. **Logs centralizados:**
   - Errores críticos deben ser 0
   - Warnings aceptables documentados
