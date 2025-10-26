# TechNovaStore - Monitoreo de Performance

## Inicio Rápido

### 1. Iniciar Monitoreo
```cmd
# Windows
scripts\start-monitoring.cmd

# O manualmente
docker-compose up -d prometheus grafana alertmanager mongodb-exporter postgres-exporter redis-exporter node-exporter
```

### 2. Acceder a Servicios
- **Grafana**: http://localhost:3013 (admin/REDACTED_GRAFANA_PASSWORD)
- **Prometheus**: http://localhost:9090
- **AlertManager**: http://localhost:9093

### 3. Verificar Servicios
```bash
node scripts/monitor-services.js
```

## Métricas Principales

### Métricas HTTP
- `http_requests_total`: Total de requests HTTP
- `http_request_duration_seconds`: Duración de requests

### Métricas de Negocio
- `orders_total`: Total de órdenes por estado
- `sync_engine_failures_total`: Fallos del motor de sincronización
- `auto_purchase_failures_total`: Fallos de compra automática

### Métricas de Sistema
- CPU, memoria, conexiones de base de datos
- Estado de servicios (up/down)

## Dashboards Disponibles

1. **TechNovaStore Overview** - Estado general del sistema
2. **TechNovaStore Business** - Métricas de negocio

## Alertas Configuradas

- **ServiceDown**: Servicio no disponible >1 minuto
- **HighErrorRate**: Tasa de error >10% por >2 minutos  
- **SyncEngineFailures**: >5 fallos en 10 minutos
- **AutoPurchaseFailures**: >3 fallos en 10 minutos

## Health Checks

Cada servicio expone `/health` con información detallada:
- Estado del servicio (healthy/degraded/unhealthy)
- Conectividad de dependencias
- Uso de memoria y CPU
- Tiempo de respuesta

## Comandos Útiles

```bash
# Ver logs de monitoreo
docker-compose logs -f prometheus grafana

# Parar monitoreo
docker-compose stop prometheus grafana alertmanager mongodb-exporter postgres-exporter redis-exporter node-exporter

# Verificar servicios
node scripts/monitor-services.js
```