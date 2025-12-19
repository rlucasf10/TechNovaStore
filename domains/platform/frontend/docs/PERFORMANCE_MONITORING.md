# Monitoreo de Performance - TechNovaStore Frontend

Este documento describe el sistema de monitoreo de performance implementado en el frontend de TechNovaStore.

## Descripción General

El sistema de monitoreo de performance utiliza **Web Vitals** para rastrear métricas clave de rendimiento que afectan directamente la experiencia del usuario. Estas métricas son recopiladas automáticamente y enviadas a un endpoint de analytics para su análisis.

## Métricas Monitoreadas

### Core Web Vitals

Estas son las métricas principales que Google utiliza para evaluar la experiencia del usuario:

#### 1. LCP (Largest Contentful Paint)
- **Qué mide**: Tiempo hasta que el elemento de contenido más grande es visible
- **Objetivo**: < 2.5 segundos
- **Importancia**: Indica qué tan rápido se carga el contenido principal de la página

#### 2. FID (First Input Delay)
- **Qué mide**: Tiempo desde la primera interacción del usuario hasta que el navegador responde
- **Objetivo**: < 100 milisegundos
- **Importancia**: Mide la capacidad de respuesta de la página

#### 3. CLS (Cumulative Layout Shift)
- **Qué mide**: Cantidad de cambios inesperados en el diseño durante la carga
- **Objetivo**: < 0.1
- **Importancia**: Indica la estabilidad visual de la página

### Métricas Adicionales

#### 4. FCP (First Contentful Paint)
- **Qué mide**: Tiempo hasta que se renderiza el primer contenido
- **Objetivo**: < 1.8 segundos
- **Importancia**: Percepción de velocidad de carga

#### 5. TTFB (Time to First Byte)
- **Qué mide**: Tiempo hasta recibir el primer byte del servidor
- **Objetivo**: < 800 milisegundos
- **Importancia**: Rendimiento del servidor y red

#### 6. INP (Interaction to Next Paint)
- **Qué mide**: Tiempo de respuesta a todas las interacciones del usuario
- **Objetivo**: < 200 milisegundos
- **Importancia**: Responsividad general de la aplicación

## Arquitectura del Sistema

```
┌─────────────────┐
│   Browser       │
│  (Web Vitals)   │
└────────┬────────┘
         │
         │ Métricas
         ▼
┌─────────────────┐
│ WebVitalsReporter│
│   (Component)   │
└────────┬────────┘
         │
         │ POST /api/analytics/web-vitals
         ▼
┌─────────────────┐
│  API Endpoint   │
│  (Next.js API)  │
└────────┬────────┘
         │
         │ Procesar y enviar
         ▼
┌─────────────────┐
│  Analytics      │
│  Service        │
│ (GA4, Custom)   │
└─────────────────┘
```

## Implementación

### 1. Instalación de Dependencias

```bash
npm install web-vitals
```

### 2. Configuración en el Layout

El monitoreo se inicializa automáticamente en el layout raíz:

```tsx
// src/app/layout.tsx
import { WebVitalsReporter } from '@/shared/components/analytics/WebVitalsReporter'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <WebVitalsReporter />
        {children}
      </body>
    </html>
  )
}
```

### 3. Endpoint de Analytics

Las métricas se envían a:

```
POST /api/analytics/web-vitals
```

**Payload:**
```json
{
  "name": "LCP",
  "value": 1234.56,
  "rating": "good",
  "delta": 123.45,
  "id": "v3-1234567890",
  "navigationType": "navigate",
  "timestamp": 1234567890123,
  "url": "https://technovastore.com/productos",
  "userAgent": "Mozilla/5.0..."
}
```

## Clasificación de Métricas

Cada métrica se clasifica en tres categorías:

| Rating | Color | Descripción |
|--------|-------|-------------|
| **good** | 🟢 Verde | La métrica está dentro del rango óptimo |
| **needs-improvement** | 🟡 Amarillo | La métrica necesita mejoras |
| **poor** | 🔴 Rojo | La métrica está por debajo del estándar |

### Umbrales

```typescript
const METRIC_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
}
```

## Debugger de Desarrollo

En modo desarrollo, se muestra un panel flotante con las métricas en tiempo real:

```tsx
// Solo visible en desarrollo
<WebVitalsDebugger />
```

**Características:**
- Muestra todas las métricas en tiempo real
- Código de colores según clasificación
- Posicionado en la esquina inferior derecha
- Se puede cerrar manualmente

## Integración con Servicios de Analytics

### Google Analytics 4

Para integrar con GA4, descomentar y configurar en el endpoint:

```typescript
// src/app/api/analytics/web-vitals/route.ts
if (process.env.GA_MEASUREMENT_ID) {
  await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${process.env.GA_MEASUREMENT_ID}&api_secret=${process.env.GA_API_SECRET}`, {
    method: 'POST',
    body: JSON.stringify({
      client_id: metric.id,
      events: [{
        name: 'web_vitals',
        params: {
          metric_name: metric.name,
          metric_value: metric.value,
          metric_rating: metric.rating,
          page_path: new URL(metric.url).pathname,
        }
      }]
    })
  })
}
```

**Variables de entorno necesarias:**
```env
GA_MEASUREMENT_ID=G-XXXXXXXXXX
GA_API_SECRET=your-api-secret
```

### Sistema de Monitoreo Personalizado

Para integrar con Prometheus, Grafana u otro sistema:

```typescript
if (process.env.MONITORING_ENDPOINT) {
  await fetch(process.env.MONITORING_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MONITORING_API_KEY}`
    },
    body: JSON.stringify({
      metric: metric.name,
      value: metric.value,
      rating: metric.rating,
      timestamp: metric.timestamp,
      metadata: {
        url: metric.url,
        userAgent: metric.userAgent,
        navigationType: metric.navigationType,
      }
    })
  })
}
```

**Variables de entorno necesarias:**
```env
MONITORING_ENDPOINT=https://your-monitoring-service.com/api/metrics
MONITORING_API_KEY=your-api-key
```

## Mejores Prácticas

### 1. Optimización de LCP
- Usar `next/image` para imágenes optimizadas
- Implementar lazy loading para contenido below-the-fold
- Minimizar el tamaño de recursos críticos
- Usar CDN para assets estáticos

### 2. Optimización de FID/INP
- Minimizar JavaScript en el bundle principal
- Usar code splitting agresivo
- Implementar debouncing en interacciones frecuentes
- Evitar long tasks (> 50ms)

### 3. Optimización de CLS
- Especificar dimensiones de imágenes y videos
- Evitar insertar contenido dinámico arriba del contenido existente
- Usar `transform` en lugar de propiedades que causan reflow
- Reservar espacio para ads y embeds

### 4. Optimización de FCP
- Inline CSS crítico
- Preload recursos importantes
- Minimizar render-blocking resources
- Usar server-side rendering (SSR)

### 5. Optimización de TTFB
- Usar CDN para servir la aplicación
- Implementar caché efectivo
- Optimizar consultas a base de datos
- Usar edge functions cuando sea posible

## Monitoreo y Alertas

### Configurar Alertas

Se recomienda configurar alertas cuando las métricas caen por debajo de los umbrales:

```typescript
// Ejemplo de lógica de alertas
if (metric.rating === 'poor') {
  // Enviar alerta al equipo de desarrollo
  await sendAlert({
    severity: 'high',
    message: `${metric.name} is poor: ${metric.value}`,
    url: metric.url,
  })
}
```

### Dashboard de Métricas

Se recomienda crear un dashboard que muestre:
- Tendencias de métricas a lo largo del tiempo
- Comparación entre páginas
- Distribución de ratings (good/needs-improvement/poor)
- Percentiles (p50, p75, p95, p99)
- Correlación con métricas de negocio (conversión, bounce rate)

## Troubleshooting

### Las métricas no se están enviando

1. Verificar que `web-vitals` está instalado:
   ```bash
   npm list web-vitals
   ```

2. Verificar que el endpoint está funcionando:
   ```bash
   curl http://localhost:3020/api/analytics/web-vitals
   ```

3. Revisar la consola del navegador en desarrollo

### El debugger no aparece

1. Verificar que estás en modo desarrollo:
   ```bash
   echo $NODE_ENV  # Debe ser 'development'
   ```

2. Verificar que el componente está montado en el layout

### Métricas con valores anormales

1. Verificar la conexión de red (TTFB alto puede indicar problemas de red)
2. Revisar el tamaño del bundle (FCP/LCP altos pueden indicar bundle grande)
3. Verificar extensiones del navegador (pueden afectar las métricas)

## Referencias

- [Web Vitals - web.dev](https://web.dev/vitals/)
- [Core Web Vitals - Google](https://developers.google.com/search/docs/appearance/core-web-vitals)
- [web-vitals Library](https://github.com/GoogleChrome/web-vitals)
- [Next.js Analytics](https://nextjs.org/docs/app/building-your-application/optimizing/analytics)

## Changelog

### v1.0.0 (2025-01-XX)
- ✅ Implementación inicial de Web Vitals
- ✅ Endpoint de analytics
- ✅ Debugger de desarrollo
- ✅ Documentación completa
