# Guías de Mantenimiento - TechNovaStore

Esta sección contiene todas las guías necesarias para el mantenimiento operacional de TechNovaStore, incluyendo monitoreo, backup, troubleshooting y actualizaciones.

## Índice

- [Monitoreo y Alertas](#monitoreo-y-alertas)
- [Logging y Análisis](#logging-y-análisis)
- [Backup y Recuperación](#backup-y-recuperación)
- [Troubleshooting](#troubleshooting)
- [Actualizaciones y Parches](#actualizaciones-y-parches)
- [Optimización de Performance](#optimización-de-performance)

## Monitoreo y Alertas

### Stack de Monitoreo

TechNovaStore utiliza el stack ELK + Prometheus + Grafana para monitoreo completo:

- **Prometheus**: Recolección de métricas
- **Grafana**: Visualización y dashboards
- **Elasticsearch**: Almacenamiento de logs
- **Logstash**: Procesamiento de logs
- **Kibana**: Análisis de logs
- **AlertManager**: Gestión de alertas

### Métricas Clave

#### Métricas de Sistema
```
# CPU Usage
node_cpu_seconds_total

# Memory Usage
node_memory_MemAvailable_bytes
node_memory_MemTotal_bytes

# Disk Usage
node_filesystem_avail_bytes
node_filesystem_size_bytes
```

#### Métricas de Aplicación
```
# HTTP Requests
http_requests_total{method, status, endpoint}
http_request_duration_seconds{method, endpoint}

# Database Connections
db_connections_active
db_connections_idle
db_query_duration_seconds

# Business Metrics
orders_total{status}
revenue_total
products_sync_last_success
```

### Configuración de Prometheus

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'technovastore-api'
    static_configs:
      - targets: ['api-gateway:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'technovastore-services'
    static_configs:
      - targets: 
        - 'product-service:3001'
        - 'user-service:3002'
        - 'order-service:3003'
    metrics_path: '/metrics'
    scrape_interval: 10s
```

## Logging y Análisis

### Configuración de Logging

#### Winston Configuration
```typescript
// shared/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'unknown',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});
```

## Backup y Recuperación

### Estrategia de Backup

#### Backup Automático Diario
```bash
#!/bin/bash
# scripts/backup-daily.sh

set -e

BACKUP_DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/backups/$BACKUP_DATE"

echo "Starting daily backup for $BACKUP_DATE"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL
echo "Backing up PostgreSQL..."
docker exec postgres-primary pg_dump -U technovastore -d technovastore | gzip > "$BACKUP_DIR/postgres-$BACKUP_DATE.sql.gz"

# Backup MongoDB
echo "Backing up MongoDB..."
docker exec mongodb-primary mongodump --uri="mongodb://technovastore:password@localhost:27017/technovastore" --gzip --archive="$BACKUP_DIR/mongodb-$BACKUP_DATE.archive.gz"

# Upload to cloud storage
echo "Uploading to cloud storage..."
# aws s3 sync "$BACKUP_DIR" "s3://technovastore-backups/$BACKUP_DATE/"

# Cleanup old backups (keep 7 days)
find /backups -type d -mtime +7 -exec rm -rf {} \;

echo "Daily backup completed successfully"
```

### Procedimientos de Recuperación

#### Recuperación de Base de Datos PostgreSQL
```bash
#!/bin/bash
# scripts/restore-postgres.sh

BACKUP_DATE=$1
BACKUP_FILE="/backups/$BACKUP_DATE/postgres-$BACKUP_DATE.sql.gz"

echo "Stopping application services..."
docker-compose stop api-gateway product-service user-service order-service

echo "Restoring PostgreSQL database..."
gunzip -c "$BACKUP_FILE" | docker exec -i postgres-primary psql -U technovastore -d technovastore

echo "Starting application services..."
docker-compose start api-gateway product-service user-service order-service

echo "PostgreSQL restore completed"
```

## Troubleshooting

### Problemas Comunes y Soluciones

#### 1. Servicios No Responden

**Síntomas:**
- HTTP 503 Service Unavailable
- Timeouts en requests
- Health checks fallan

**Diagnóstico:**
```bash
# Verificar estado de contenedores
docker-compose ps

# Verificar logs de servicios
docker-compose logs --tail=100 api-gateway
docker-compose logs --tail=100 product-service

# Verificar recursos del sistema
docker stats
free -h
df -h
```

**Soluciones:**
```bash
# Reiniciar servicio específico
docker-compose restart api-gateway

# Reiniciar todos los servicios
docker-compose restart

# Limpiar y reiniciar
docker-compose down
docker system prune -f
docker-compose up -d
```

#### 2. Base de Datos No Disponible

**Síntomas:**
- Connection refused errors
- Database timeout errors
- Servicios no pueden conectar a DB

**Diagnóstico:**
```bash
# Verificar estado de contenedores de DB
docker-compose ps postgresql mongodb redis

# Verificar logs de base de datos
docker-compose logs postgresql
docker-compose logs mongodb

# Probar conectividad
docker exec -it technovastore-postgresql-1 psql -U technovastore -d technovastore -c "SELECT 1;"
```

**Soluciones:**
```bash
# Reiniciar base de datos
docker-compose restart postgresql mongodb

# Verificar configuración de red
docker network inspect technovastore_default
```

### Scripts de Diagnóstico

#### Script de Diagnóstico General
```bash
#!/bin/bash
# scripts/diagnose.sh

echo "=== TechNovaStore System Diagnostic ==="
echo "Timestamp: $(date)"
echo ""

echo "1. System Resources:"
echo "Memory Usage:"
free -h
echo "Disk Usage:"
df -h | grep -E '^/dev/'
echo ""

echo "2. Docker Status:"
echo "Running containers:"
docker-compose ps
echo ""

echo "3. Service Health Checks:"
services=("api-gateway:3000" "product-service:3001" "user-service:3002")
for service in "${services[@]}"; do
  IFS=':' read -r name port <<< "$service"
  echo -n "$name: "
  if curl -f -s "http://localhost:$port/health" > /dev/null; then
    echo "✅ Healthy"
  else
    echo "❌ Unhealthy"
  fi
done
echo ""

echo "4. Database Connectivity:"
echo -n "PostgreSQL: "
if docker exec technovastore-postgresql-1 pg_isready -U technovastore > /dev/null 2>&1; then
  echo "✅ Connected"
else
  echo "❌ Connection failed"
fi

echo "Diagnostic completed. Check above for any issues."
```

## Actualizaciones y Parches

### Proceso de Actualización

#### 1. Actualizaciones de Seguridad
```bash
#!/bin/bash
# scripts/security-update.sh

echo "Applying security updates..."

# Update system packages
apt update && apt upgrade -y

# Update Docker images
docker-compose pull

# Update Node.js dependencies
npm audit fix
npm update

# Rebuild and restart services
docker-compose build --no-cache
docker-compose up -d

echo "Security updates completed"
```

#### 2. Rolling Update (Zero Downtime)
```bash
#!/bin/bash
# scripts/rolling-update.sh

services=("api-gateway" "product-service" "user-service" "order-service")

for service in "${services[@]}"; do
  echo "Updating $service..."
  
  # Scale up with new version
  docker-compose up -d --scale "$service=2" "$service"
  
  # Wait for new instance to be healthy
  sleep 30
  
  # Scale back to 1
  docker-compose up -d --scale "$service=1" "$service"
  
  echo "$service updated successfully"
done
```

### Calendario de Mantenimiento

#### Mantenimiento Diario (Automatizado)
- **02:00**: Backup completo
- **03:00**: Limpieza de logs antiguos
- **04:00**: Optimización de base de datos

#### Mantenimiento Semanal
- **Domingo 01:00**: Actualizaciones de seguridad
- **Domingo 02:00**: Análisis de performance
- **Domingo 03:00**: Verificación de backups

#### Mantenimiento Mensual
- **Primer domingo del mes**: Actualización de dependencias
- **Segundo domingo del mes**: Revisión de configuraciones
- **Tercer domingo del mes**: Pruebas de disaster recovery

## Optimización de Performance

### Optimización de Base de Datos

#### PostgreSQL Tuning
```sql
-- postgresql.conf optimizations
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB

-- Create indexes for common queries
CREATE INDEX CONCURRENTLY idx_orders_user_id_created_at ON orders(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_orders_status ON orders(status);
```

#### MongoDB Optimization
```javascript
// Create compound indexes
db.products.createIndex({ "category": 1, "price": 1 })
db.products.createIndex({ "name": "text", "description": "text" })

// Optimize queries with explain
db.products.find({ category: "electronics", price: { $lt: 1000 } }).explain("executionStats")
```

### Caching Strategy

#### Redis Caching
```typescript
// services/cache/CacheService.ts
export class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
}
```

## Contacto y Soporte

Para soporte de mantenimiento:
- **Email**: ops@technovastore.com
- **Documentación**: [docs.technovastore.com](https://docs.technovastore.com)
- **Issues**: [GitHub Issues](https://github.com/technovastore/issues)

### Escalación de Incidentes

1. **Nivel 1** (Info): Logs automáticos, métricas normales
2. **Nivel 2** (Warning): Alertas por email, revisión en horario laboral
3. **Nivel 3** (Critical): Alertas inmediatas, respuesta 24/7
4. **Nivel 4** (Emergency): Escalación a todo el equipo, respuesta inmediata