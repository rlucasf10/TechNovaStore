# Campaign Manager Service

Servicio de gestión de campañas promocionales con aplicación automática de descuentos para TechNovaStore.

## Descripción

El Campaign Manager Service es un microservicio que gestiona automáticamente campañas promocionales, aplicando y removiendo descuentos en productos según reglas configuradas y fechas establecidas. Se integra con el Product Service y sincroniza con el frontend para mostrar campañas dinámicas.

## Características Principales

- ✅ Gestión CRUD de campañas promocionales
- ✅ Aplicación y remoción automática de descuentos
- ✅ Scheduler con cron jobs para automatización
- ✅ Reglas de descuento flexibles (por producto, categoría o global)
- ✅ Integración con Product Service
- ✅ Analytics y reportes de campañas
- ✅ API REST para administración
- ✅ Integración con stack de monitoreo (Prometheus, Grafana, ELK)

## Arquitectura

Este servicio sigue **Screaming Architecture**, donde los casos de uso son carpetas en la raíz del proyecto:

```
campaign-manager-service/
├── create-campaign/              # Caso de uso: Crear campaña
├── update-campaign/              # Caso de uso: Actualizar campaña
├── delete-campaign/              # Caso de uso: Eliminar campaña
├── apply-campaign-discounts/     # Caso de uso: Aplicar descuentos
├── remove-campaign-discounts/    # Caso de uso: Remover descuentos
├── shared/                       # Infraestructura compartida
│   ├── models/                   # Modelos de datos
│   ├── repositories/             # Repositorios
│   ├── clients/                  # Clientes externos
│   ├── utils/                    # Utilidades
│   └── types/                    # Tipos compartidos
├── api/                          # Capa de presentación HTTP
├── config/                       # Configuración
├── cron/                         # Tareas programadas
└── index.ts                      # Entry point
```

## Variables de Entorno Requeridas

### Variables Obligatorias

```bash
# Puerto del servicio
PORT=3011

# Base de datos PostgreSQL
DATABASE_URL=postgresql://admin:password@postgresql:5432/technovastore
POSTGRES_HOST=postgresql
POSTGRES_PORT=5432
POSTGRES_DB=technovastore
POSTGRES_USER=admin
POSTGRES_PASSWORD=password

# Servicios externos (URLs internas de Docker)
PRODUCT_SERVICE_URL=http://product-service:3000
NOTIFICATION_SERVICE_URL=http://notification-service:3000

# Seguridad
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Entorno
NODE_ENV=development
```

### Variables Opcionales

```bash
# Logging
LOG_LEVEL=debug  # debug, info, warn, error

# Node.js
NODE_OPTIONS=--max-old-space-size=768
```

### Configuración por Entorno

Las variables se configuran automáticamente según el archivo docker-compose usado:

- **docker-compose.optimized.yml**: Desarrollo local con límites de recursos
- **docker-compose.dev.yml**: Desarrollo sin límites de recursos
- **docker-compose.yml**: Producción con variables desde .env
- **docker-compose.prod.yml**: Producción con alta disponibilidad
- **docker-compose.staging.yml**: Staging con configuración intermedia

## Instalación y Ejecución

### ⚠️ IMPORTANTE: Este proyecto usa Docker EXCLUSIVAMENTE

**NUNCA ejecutar comandos npm/node directamente en local**. Todos los comandos deben ejecutarse dentro de contenedores Docker.

### Con Docker (OBLIGATORIO)

#### 1. Construir la imagen base (primera vez)

```bash
# Construir la imagen base de servicios
docker build -f docker/base/Dockerfile.service-base -t technovastore-base:latest .
```

#### 2. Construir el servicio

```bash
# Construir la imagen del servicio
docker-compose -f docker-compose.optimized.yml build campaign-manager-service
```

#### 3. Iniciar el servicio

```bash
# Iniciar solo campaign-manager-service y sus dependencias
docker-compose -f docker-compose.optimized.yml up -d postgresql product-service notification-service campaign-manager-service

# O iniciar todos los servicios
docker-compose -f docker-compose.optimized.yml up -d
```

#### 4. Ver logs

```bash
# Ver logs en tiempo real
docker-compose -f docker-compose.optimized.yml logs -f campaign-manager-service

# Ver últimas 100 líneas
docker logs technovastore-campaign-manager --tail 100
```

#### 5. Verificar estado

```bash
# Ver estado del contenedor
docker ps | grep campaign-manager

# Health check
curl http://localhost:3011/health

# Métricas
curl http://localhost:3011/metrics
```

### Comandos de Desarrollo (dentro del contenedor)

```bash
# Instalar dependencias
docker exec technovastore-campaign-manager npm install

# Ejecutar en modo desarrollo (hot-reload)
docker exec technovastore-campaign-manager npm run dev

# Ejecutar tests
docker exec technovastore-campaign-manager npm test

# Ejecutar tests con cobertura
docker exec technovastore-campaign-manager npm test -- --coverage

# Compilar TypeScript
docker exec technovastore-campaign-manager npm run build

# Acceder a shell del contenedor
docker exec -it technovastore-campaign-manager sh
```

### Reconstruir después de cambios en el código

```bash
# Detener el servicio
docker-compose -f docker-compose.optimized.yml stop campaign-manager-service

# Reconstruir y reiniciar
docker-compose -f docker-compose.optimized.yml up -d --build campaign-manager-service

# Ver logs para verificar
docker-compose -f docker-compose.optimized.yml logs -f campaign-manager-service
```

### Troubleshooting

#### El servicio no inicia

```bash
# Ver logs completos
docker logs technovastore-campaign-manager

# Verificar que PostgreSQL está corriendo
docker ps | grep postgresql

# Verificar conectividad a PostgreSQL
docker exec technovastore-campaign-manager sh -c "nc -zv postgresql 5432"
```

#### Problemas con dependencias

```bash
# Limpiar y reinstalar
docker exec technovastore-campaign-manager rm -rf node_modules
docker exec technovastore-campaign-manager npm install --legacy-peer-deps
```

#### Reconstruir desde cero

```bash
# Detener y eliminar contenedor
docker-compose -f docker-compose.optimized.yml stop campaign-manager-service
docker-compose -f docker-compose.optimized.yml rm -f campaign-manager-service

# Eliminar imagen
docker rmi technovastore-campaign-manager:latest

# Reconstruir
docker-compose -f docker-compose.optimized.yml build --no-cache campaign-manager-service
docker-compose -f docker-compose.optimized.yml up -d campaign-manager-service
```

## Endpoints API

### Gestión de Campañas

- `POST /api/campaigns` - Crear campaña
- `GET /api/campaigns` - Listar campañas
- `GET /api/campaigns/:id` - Obtener campaña
- `PUT /api/campaigns/:id` - Actualizar campaña
- `DELETE /api/campaigns/:id` - Eliminar campaña
- `GET /api/campaigns/active` - Obtener campaña activa

### Operaciones de Descuentos

- `POST /api/campaigns/:id/apply-discounts` - Aplicar descuentos manualmente
- `POST /api/campaigns/:id/remove-discounts` - Remover descuentos manualmente

### Analytics

- `GET /api/campaigns/:id/analytics` - Obtener métricas de campaña

### Sistema

#### `GET /health` - Health Check

Verifica el estado de salud del servicio comprobando:
- Conexión a PostgreSQL
- Conexión a Product Service

**Response 200 OK** (sistema saludable):
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:00:00Z",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "up",
      "responseTime": 5
    },
    "productService": {
      "status": "up",
      "responseTime": 12
    }
  }
}
```

**Response 503 Service Unavailable** (sistema no saludable):
```json
{
  "status": "unhealthy",
  "timestamp": "2025-01-15T10:00:00Z",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "down",
      "responseTime": 2000,
      "error": "Connection refused"
    },
    "productService": {
      "status": "up",
      "responseTime": 15
    }
  }
}
```

#### `GET /metrics` - Métricas de Prometheus

Expone métricas en formato Prometheus para monitoreo:

**Métricas principales**:
- `campaign_active_count` (gauge): Número de campañas activas
- `campaign_discounts_applied_total` (counter): Total de descuentos aplicados
- `campaign_discount_application_duration_seconds` (histogram): Tiempo de aplicación de descuentos

**Métricas del sistema** (incluidas automáticamente):
- `process_cpu_*`: Uso de CPU
- `nodejs_*`: Métricas de Node.js
- `process_resident_memory_bytes`: Uso de memoria

**Response 200 OK** (formato Prometheus):
```
# HELP campaign_active_count Número de campañas activas en el sistema
# TYPE campaign_active_count gauge
campaign_active_count 3

# HELP campaign_discounts_applied_total Número total de descuentos aplicados
# TYPE campaign_discounts_applied_total counter
campaign_discounts_applied_total 1234

# HELP campaign_discount_application_duration_seconds Tiempo de aplicación de descuentos
# TYPE campaign_discount_application_duration_seconds histogram
campaign_discount_application_duration_seconds_bucket{le="0.1"} 0
campaign_discount_application_duration_seconds_bucket{le="0.5"} 5
campaign_discount_application_duration_seconds_bucket{le="1"} 15
...
```

## Cron Jobs

El servicio ejecuta automáticamente:

- **Cada hora**: Verificación de campañas pendientes de activación
- **Cada hora**: Verificación de campañas pendientes de desactivación

## Integración con Product Service

El servicio actualiza los siguientes campos en los productos:

- `in_campaign`: Boolean indicando si el producto está en campaña
- `campaign_id`: ID de la campaña activa
- `campaign_price`: Precio con descuento
- `original_price`: Precio original antes del descuento
- `discount_percentage`: Porcentaje de descuento aplicado

## Monitoreo

### Métricas de Prometheus

- `campaign_active_count`: Número de campañas activas
- `campaign_discounts_applied_total`: Total de descuentos aplicados
- `campaign_discount_application_duration_seconds`: Tiempo de aplicación de descuentos

### Logs Estructurados

Todos los logs se envían en formato JSON al stack ELK para análisis y visualización.

## Testing

```bash
# Ejecutar todos los tests
docker exec technovastore-campaign-manager npm test

# Ejecutar tests con cobertura
docker exec technovastore-campaign-manager npm test -- --coverage

# Ejecutar tests específicos
docker exec technovastore-campaign-manager npm test -- create-campaign
```

## Estado del Desarrollo

✅ **Fase 1-7 Completadas**: Casos de uso, modelos, repositorios, clientes, API y tests implementados
✅ **Fase 8 Completada**: Configuración de Docker y deployment
✅ **Fase 9-10 Completadas**: Frontend - Panel de administración y dashboard de analytics
✅ **Fase 11 Completada**: Integración con sistema de monitoreo (Prometheus, Grafana, ELK)
✅ **Fase 12 Completada**: Validación final y documentación

**Estado: 🎉 COMPLETADO**

Ver progreso detallado en `.kiro/specs/campaign-manager-service/tasks.md`

## Puertos y Servicios

- **Campaign Manager Service**: `http://localhost:3011`
- **Health Check**: `http://localhost:3011/health`
- **Métricas**: `http://localhost:3011/metrics`
- **API**: `http://localhost:3011/api/campaigns`

### Dependencias

- **PostgreSQL**: `postgresql:5432` (interno) / `localhost:5432` (externo)
- **Product Service**: `http://product-service:3000` (interno) / `http://localhost:3001` (externo)
- **Notification Service**: `http://notification-service:3000` (interno) / `http://localhost:3005` (externo)

## Documentación Adicional

- [Documento de Requisitos](/.kiro/specs/campaign-manager-service/requirements.md)
- [Documento de Diseño](/.kiro/specs/campaign-manager-service/design.md)
- [Plan de Implementación](/.kiro/specs/campaign-manager-service/tasks.md)

## Licencia

Privado - TechNovaStore © 2025
