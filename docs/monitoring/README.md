# Guía de Monitoreo y Observabilidad

Esta guía proporciona información sobre el sistema de monitoreo y observabilidad de TechNovaStore.

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Stack de Monitoreo](#stack-de-monitoreo)
3. [Acceso a Herramientas](#acceso-a-herramientas)
4. [Métricas](#métricas)
5. [Logs](#logs)
6. [Alertas](#alertas)
7. [Dashboards](#dashboards)
8. [Troubleshooting](#troubleshooting)

---

## Introducción

TechNovaStore utiliza un stack completo de observabilidad que incluye:

- **Prometheus**: Recolección de métricas
- **Grafana**: Visualización de métricas y dashboards
- **Elasticsearch**: Almacenamiento de logs
- **Logstash**: Procesamiento de logs
- **Kibana**: Visualización de logs
- **Alertmanager**: Gestión de alertas

---

## Stack de Monitoreo

### Prometheus

**Puerto**: 9090  
**URL**: http://localhost:9090

Prometheus recolecta métricas de todos los servicios cada 15 segundos.

**Métricas recolectadas**:
- HTTP requests (latencia, tasa de error, throughput)
- Uso de CPU y memoria por servicio
- Conexiones a bases de datos
- Tamaño de colas de mensajes
- Métricas de negocio (pedidos, pagos, etc.)

**Configuración**: `infrastructure/prometheus/prometheus.yml`

### Grafana

**Puerto**: 3013  
**URL**: http://localhost:3013  
**Credenciales por defecto**:
- Usuario: `admin`
- Contraseña: `admin` (cambiar en primer acceso)

Grafana proporciona dashboards interactivos para visualizar métricas.

**Dashboards disponibles**:
- Overview del sistema
- Performance por servicio
- Bases de datos (MongoDB, PostgreSQL, Redis)
- Errores y excepciones
- Métricas de negocio

**Configuración**: `infrastructure/grafana/`

### Elasticsearch

**Puerto**: 9200 (HTTP), 9300 (Transport)  
**URL**: http://localhost:9200

Elasticsearch almacena y permite búsquedas en logs estructurados.

**Índices**:
- `logs-*`: Logs de todos los servicios
- `metrics-*`: Métricas históricas

**Configuración**: `infrastructure/elasticsearch/`

### Logstash

**Puertos**:
- 5000 (TCP)
- 5044 (Beats)
- 9600 (API)

Logstash procesa y transforma logs antes de enviarlos a Elasticsearch.

**Pipeline**: Parseo, enriquecimiento, filtrado

**Configuración**: `infrastructure/logstash/`

### Kibana

**Puerto**: 5601  
**URL**: http://localhost:5601

Kibana proporciona interfaz para explorar y visualizar logs.

**Funcionalidades**:
- Búsqueda de logs
- Visualizaciones
- Dashboards
- Alertas

**Configuración**: `infrastructure/kibana/`

### Alertmanager

**Puerto**: 9093  
**URL**: http://localhost:9093

Alertmanager gestiona alertas de Prometheus.

**Canales de notificación**:
- Email
- Slack
- PagerDuty
- Webhooks

**Configuración**: `infrastructure/alertmanager/`

---

## Acceso a Herramientas

### Iniciar Stack de Monitoreo

```bash
# Iniciar solo herramientas de monitoreo
docker-compose -f docker-compose.optimized.yml up -d prometheus grafana alertmanager

# Iniciar stack ELK
docker-compose -f docker-compose.optimized.yml up -d elasticsearch logstash kibana

# Iniciar todo el stack de observabilidad
docker-compose -f docker-compose.optimized.yml up -d prometheus grafana alertmanager elasticsearch logstash kibana
```

### Verificar Estado

```bash
# Ver estado de servicios de monitoreo
docker-compose -f docker-compose.optimized.yml ps prometheus grafana elasticsearch kibana

# Ver logs
docker-compose -f docker-compose.optimized.yml logs -f prometheus
docker-compose -f docker-compose.optimized.yml logs -f grafana
```

### URLs de Acceso

| Herramienta | URL | Credenciales |
|-------------|-----|--------------|
| Prometheus | http://localhost:9090 | N/A |
| Grafana | http://localhost:3013 | admin/admin |
| Elasticsearch | http://localhost:9200 | N/A |
| Kibana | http://localhost:5601 | N/A |
| Alertmanager | http://localhost:9093 | N/A |

---

## Métricas

### Métricas de Sistema

**CPU y Memoria**:
```promql
# CPU por servicio
rate(process_cpu_seconds_total[5m])

# Memoria por servicio
process_resident_memory_bytes
```

**Disco**:
```promql
# Uso de disco
node_filesystem_avail_bytes
```

### Métricas de Aplicación

**HTTP Requests**:
```promql
# Tasa de requests
rate(http_requests_total[5m])

# Latencia p95
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Tasa de error
rate(http_requests_total{status=~"5.."}[5m])
```

**Base de Datos**:
```promql
# Conexiones activas MongoDB
mongodb_connections{state="current"}

# Queries PostgreSQL
rate(pg_stat_database_xact_commit[5m])

# Operaciones Redis
rate(redis_commands_processed_total[5m])
```

### Métricas de Negocio

**Pedidos**:
```promql
# Pedidos creados por minuto
rate(orders_created_total[1m])

# Valor promedio de pedidos
avg(order_total_value)
```

**Pagos**:
```promql
# Pagos procesados
rate(payments_processed_total[5m])

# Tasa de fallos de pago
rate(payments_failed_total[5m]) / rate(payments_total[5m])
```

---

## Logs

### Estructura de Logs

Todos los servicios usan logging estructurado con Winston:

```json
{
  "timestamp": "2024-11-22T10:30:00.000Z",
  "level": "info",
  "service": "order-service",
  "message": "Order created",
  "orderId": "ORD-123",
  "userId": "user-456",
  "total": 99.99
}
```

### Niveles de Log

- `error`: Errores críticos que requieren atención inmediata
- `warn`: Advertencias que pueden indicar problemas
- `info`: Información general de operaciones
- `debug`: Información detallada para debugging

### Búsqueda de Logs en Kibana

**Buscar por servicio**:
```
service: "order-service"
```

**Buscar errores**:
```
level: "error"
```

**Buscar por usuario**:
```
userId: "user-123"
```

**Buscar por rango de tiempo**:
```
timestamp: [2024-11-22T00:00:00 TO 2024-11-22T23:59:59]
```

**Búsqueda combinada**:
```
service: "order-service" AND level: "error" AND timestamp: [now-1h TO now]
```

### Logs por Servicio

**Ver logs de un servicio**:
```bash
# En tiempo real
docker-compose -f docker-compose.optimized.yml logs -f order-service

# Últimas 100 líneas
docker-compose -f docker-compose.optimized.yml logs --tail=100 order-service

# Desde una hora específica
docker-compose -f docker-compose.optimized.yml logs --since 1h order-service
```

---

## Alertas

### Alertas Configuradas

#### Alertas de Sistema

**Alta Utilización de CPU**:
```yaml
alert: HighCPUUsage
expr: rate(process_cpu_seconds_total[5m]) > 0.8
for: 5m
severity: warning
```

**Memoria Alta**:
```yaml
alert: HighMemoryUsage
expr: process_resident_memory_bytes / node_memory_MemTotal_bytes > 0.9
for: 5m
severity: critical
```

**Disco Lleno**:
```yaml
alert: DiskSpaceLow
expr: node_filesystem_avail_bytes / node_filesystem_size_bytes < 0.1
for: 5m
severity: warning
```

#### Alertas de Aplicación

**Alta Tasa de Error**:
```yaml
alert: HighErrorRate
expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
for: 5m
severity: critical
```

**Latencia Alta**:
```yaml
alert: HighLatency
expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
for: 5m
severity: warning
```

**Servicio Caído**:
```yaml
alert: ServiceDown
expr: up == 0
for: 1m
severity: critical
```

#### Alertas de Base de Datos

**MongoDB Conexiones Altas**:
```yaml
alert: MongoDBHighConnections
expr: mongodb_connections{state="current"} > 1000
for: 5m
severity: warning
```

**PostgreSQL Queries Lentas**:
```yaml
alert: PostgreSQLSlowQueries
expr: rate(pg_stat_database_blks_read[5m]) > 1000
for: 5m
severity: warning
```

### Configurar Notificaciones

**Email**:
```yaml
# infrastructure/alertmanager/alertmanager.yml
receivers:
  - name: 'email'
    email_configs:
      - to: 'alerts@technovastore.com'
        from: 'alertmanager@technovastore.com'
        smarthost: 'smtp.gmail.com:587'
```

**Slack**:
```yaml
receivers:
  - name: 'slack'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
        channel: '#alerts'
```

---

## Dashboards

### Dashboards de Grafana

#### Dashboard: System Overview

**Métricas mostradas**:
- CPU total del sistema
- Memoria total del sistema
- Disco disponible
- Network I/O
- Servicios activos

**Importar**: `infrastructure/grafana/dashboards/system-overview.json`

#### Dashboard: Service Performance

**Métricas por servicio**:
- Request rate
- Error rate
- Latencia (p50, p95, p99)
- Throughput

**Importar**: `infrastructure/grafana/dashboards/service-performance.json`

#### Dashboard: Databases

**Métricas de bases de datos**:
- MongoDB: Conexiones, operaciones, latencia
- PostgreSQL: Conexiones, queries, cache hit ratio
- Redis: Comandos, memoria, keys

**Importar**: `infrastructure/grafana/dashboards/databases.json`

#### Dashboard: Business Metrics

**Métricas de negocio**:
- Pedidos por hora
- Valor total de ventas
- Tasa de conversión
- Usuarios activos

**Importar**: `infrastructure/grafana/dashboards/business-metrics.json`

### Crear Dashboard Personalizado

1. Acceder a Grafana: http://localhost:3013
2. Click en "+" → "Dashboard"
3. Click en "Add new panel"
4. Configurar query de Prometheus
5. Personalizar visualización
6. Guardar dashboard

---

## Troubleshooting

### Prometheus No Recolecta Métricas

**Verificar targets**:
```bash
# Acceder a Prometheus
curl http://localhost:9090/api/v1/targets

# Verificar que servicios estén "up"
```

**Solución**:
```bash
# Reiniciar Prometheus
docker-compose -f docker-compose.optimized.yml restart prometheus

# Verificar configuración
docker exec technovastore-prometheus cat /etc/prometheus/prometheus.yml
```

### Grafana No Muestra Datos

**Verificar datasource**:
1. Ir a Configuration → Data Sources
2. Verificar que Prometheus esté configurado
3. Test connection

**Solución**:
```bash
# Reiniciar Grafana
docker-compose -f docker-compose.optimized.yml restart grafana

# Verificar logs
docker-compose -f docker-compose.optimized.yml logs grafana
```

### Elasticsearch No Recibe Logs

**Verificar Logstash**:
```bash
# Ver logs de Logstash
docker-compose -f docker-compose.optimized.yml logs logstash

# Verificar pipeline
docker exec technovastore-logstash cat /usr/share/logstash/pipeline/logstash.conf
```

**Solución**:
```bash
# Reiniciar Logstash
docker-compose -f docker-compose.optimized.yml restart logstash

# Verificar índices en Elasticsearch
curl http://localhost:9200/_cat/indices
```

### Kibana No Muestra Logs

**Crear index pattern**:
1. Ir a Management → Index Patterns
2. Crear pattern: `logs-*`
3. Seleccionar timestamp field: `@timestamp`

**Solución**:
```bash
# Reiniciar Kibana
docker-compose -f docker-compose.optimized.yml restart kibana

# Verificar conexión a Elasticsearch
curl http://localhost:5601/api/status
```

### Alertas No Se Envían

**Verificar Alertmanager**:
```bash
# Ver configuración
docker exec technovastore-alertmanager cat /etc/alertmanager/alertmanager.yml

# Ver alertas activas
curl http://localhost:9093/api/v1/alerts
```

**Solución**:
```bash
# Reiniciar Alertmanager
docker-compose -f docker-compose.optimized.yml restart alertmanager

# Verificar logs
docker-compose -f docker-compose.optimized.yml logs alertmanager
```

---

## Recursos Adicionales

### Documentación

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Elasticsearch Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Kibana Documentation](https://www.elastic.co/guide/en/kibana/current/index.html)

### Archivos de Configuración

- Prometheus: `infrastructure/prometheus/prometheus.yml`
- Grafana: `infrastructure/grafana/`
- Elasticsearch: `infrastructure/elasticsearch/`
- Logstash: `infrastructure/logstash/`
- Kibana: `infrastructure/kibana/`
- Alertmanager: `infrastructure/alertmanager/`

### Documentos Relacionados

- [MONITORING.md](./MONITORING.md) - Guía detallada de monitoreo
- [LOGGING.md](./LOGGING.md) - Guía de logging
- [Architecture](../architecture/ARCHITECTURE.md) - Arquitectura del sistema

---

**Última actualización**: Noviembre 2024  
**Mantenido por**: Equipo de DevOps TechNovaStore
