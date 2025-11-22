# Sync Engine

Motor de sincronización automática de productos con proveedores externos para TechNovaStore.

## Arquitectura: Screaming Architecture

Este servicio sigue el patrón Screaming Architecture, donde la estructura del proyecto refleja los casos de uso del negocio.

## Estructura

```
sync-engine/
├── trigger-full-sync/        # Sincronización completa
│   ├── TriggerFullSync.ts
│   └── TriggerFullSync.test.ts
├── trigger-price-update/     # Actualización de precios
│   ├── TriggerPriceUpdate.ts
│   └── TriggerPriceUpdate.test.ts
├── compare-product-prices/   # Comparación de precios
│   ├── CompareProductPrices.ts
│   └── CompareProductPrices.test.ts
├── update-dynamic-price/     # Actualización dinámica de precios
│   ├── UpdateDynamicPrice.ts
│   └── UpdateDynamicPrice.test.ts
├── analyze-market/           # Análisis de mercado
│   ├── AnalyzeMarket.ts
│   └── AnalyzeMarket.test.ts
├── get-sync-status/          # Estado de sincronización
│   ├── GetSyncStatus.ts
│   └── GetSyncStatus.test.ts
├── get-sync-metrics/         # Métricas de sincronización
│   ├── GetSyncMetrics.ts
│   └── GetSyncMetrics.test.ts
├── get-pricing-alerts/       # Alertas de precios
│   ├── GetPricingAlerts.ts
│   └── GetPricingAlerts.test.ts
├── get-cache-stats/          # Estadísticas de caché
│   ├── GetCacheStats.ts
│   └── GetCacheStats.test.ts
├── cleanup-old-data/         # Limpieza de datos antiguos
│   ├── CleanupOldData.ts
│   └── CleanupOldData.test.ts
├── manage-providers/         # Gestión de proveedores
│   ├── ManageProviders.ts
│   └── ManageProviders.test.ts
├── health-check/             # Health check
│   ├── HealthCheck.ts
│   └── HealthCheck.test.ts
├── shared/                   # Infraestructura compartida
│   ├── providers/            # Adaptadores de proveedores
│   │   ├── FakeStoreProvider.ts
│   │   ├── DummyJSONProvider.ts
│   │   └── ProviderInterface.ts
│   ├── transformers/         # Transformadores de datos
│   │   └── ProductTransformer.ts
│   ├── schedulers/           # Schedulers de tareas
│   │   └── SyncScheduler.ts
│   ├── cache/                # Gestión de caché
│   │   └── CacheManager.ts
│   └── utils/                # Utilidades
│       └── logger.ts
├── api/                      # Capa de presentación HTTP
│   ├── SyncController.ts
│   └── routes.ts
├── config/                   # Configuración
│   └── index.ts
└── index.ts                  # Entry point
```

## Características Principales

### 1. Sincronización Automática
- Sincronización programada de productos desde múltiples proveedores
- Actualización incremental y completa
- Manejo de errores y reintentos automáticos

### 2. Gestión de Precios
- Comparación de precios entre proveedores
- Actualización dinámica basada en competencia
- Alertas de cambios significativos de precios
- Estrategias de pricing competitivo

### 3. Proveedores Soportados
- **FakeStore API**: Productos de prueba
- **DummyJSON**: Datos de demostración
- Arquitectura extensible para agregar nuevos proveedores

### 4. Caché Inteligente
- Redis para caché de respuestas de proveedores
- Reducción de llamadas a APIs externas
- TTL configurable por proveedor

### 5. Monitoreo y Métricas
- Estadísticas de sincronización en tiempo real
- Métricas de rendimiento por proveedor
- Alertas de fallos y anomalías

## API Endpoints

### Sincronización
- `POST /api/sync/full` - Iniciar sincronización completa
- `POST /api/sync/prices` - Actualizar solo precios
- `GET /api/sync/status` - Estado de sincronización actual
- `GET /api/sync/metrics` - Métricas de sincronización

### Precios
- `POST /api/pricing/compare/:sku` - Comparar precios de un producto
- `POST /api/pricing/update/:sku` - Actualizar precio dinámicamente
- `GET /api/pricing/alerts` - Obtener alertas de precios

### Análisis
- `POST /api/market/analyze` - Analizar mercado por categoría
- `GET /api/cache/stats` - Estadísticas de caché

### Proveedores
- `GET /api/providers` - Listar proveedores configurados
- `POST /api/providers/:id/enable` - Habilitar proveedor
- `POST /api/providers/:id/disable` - Deshabilitar proveedor

### Mantenimiento
- `POST /api/cleanup` - Limpiar datos antiguos
- `GET /health` - Health check del servicio

## Configuración de Proveedores

### FakeStore API
```typescript
{
  id: 'fakestore',
  name: 'FakeStore API',
  baseUrl: 'https://fakestoreapi.com',
  enabled: true,
  rateLimit: 100,  // requests per minute
  cacheTTL: 3600   // seconds
}
```

### DummyJSON
```typescript
{
  id: 'dummyjson',
  name: 'DummyJSON',
  baseUrl: 'https://dummyjson.com',
  enabled: true,
  rateLimit: 100,
  cacheTTL: 3600
}
```

## Estrategias de Pricing

### 1. Competitive Pricing
Ajusta precios basándose en la competencia:
- Si nuestro precio es > 10% más alto → reducir al promedio
- Si nuestro precio es < 5% más bajo → aumentar ligeramente
- Mantener margen mínimo de ganancia

### 2. Dynamic Pricing
Ajusta precios basándose en:
- Demanda del producto
- Stock disponible
- Temporada/eventos
- Precios de competidores

## Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar tests
npm test

# Compilar
npm run build

# Ejecutar en producción
npm start
```

## Variables de Entorno

- `PORT` - Puerto del servicio (default: 3006)
- `NODE_ENV` - Entorno de ejecución
- `MONGODB_URL` - URL de conexión a MongoDB
- `REDIS_URL` - URL de conexión a Redis
- `PRODUCT_SERVICE_URL` - URL del Product Service
- `SYNC_INTERVAL` - Intervalo de sincronización (en minutos)
- `CACHE_TTL` - TTL de caché (en segundos)
- `LOG_LEVEL` - Nivel de logging

## Sincronización Programada

El servicio ejecuta sincronizaciones automáticas:
- **Sincronización completa**: Cada 24 horas
- **Actualización de precios**: Cada 6 horas
- **Limpieza de datos**: Cada 7 días

## Transformación de Datos

Los datos de proveedores externos se transforman al formato interno:

```typescript
// Formato externo (FakeStore)
{
  id: 1,
  title: "Product Name",
  price: 109.95,
  category: "electronics"
}

// Formato interno (TechNovaStore)
{
  sku: "FAKESTORE-1",
  name: "Product Name",
  price: 109.95,
  category: "electronics",
  provider: "fakestore",
  lastSync: "2024-01-01T00:00:00Z"
}
```

## Manejo de Errores

- Reintentos automáticos con backoff exponencial
- Logging detallado de errores
- Notificaciones de fallos críticos
- Fallback a caché en caso de fallo de proveedor

## Monitoreo

- `/health` - Health check del servicio
- Métricas de sincronización en tiempo real
- Alertas de precios significativos
- Estadísticas de caché y rendimiento

## Integración con Otros Servicios

- **Product Service**: Actualiza productos en el catálogo
- **Notification Service**: Envía alertas de precios
- **Redis**: Caché de respuestas de proveedores
- **MongoDB**: Almacenamiento de métricas y logs

## Docker

```bash
# Construir imagen
docker build -t technovastore-sync-engine .

# Ejecutar contenedor
docker run -p 3006:3006 \
  -e MONGODB_URL=mongodb://host.docker.internal:27017/technovastore \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  technovastore-sync-engine
```

## Documentación Adicional

- [FREE_APIS_SETUP.md](./FREE_APIS_SETUP.md) - Configuración de APIs gratuitas
- [IMAGE_AUTOMATION.md](./IMAGE_AUTOMATION.md) - Automatización de imágenes de productos
