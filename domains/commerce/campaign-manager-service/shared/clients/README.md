# Clientes Externos - Campaign Manager Service

Este directorio contiene los clientes para comunicación con servicios externos.

## Clientes Implementados

### ProductServiceClient

Cliente para comunicación con el Product Service. Proporciona métodos para:

- `getProduct(productId)` - Obtener un producto por ID
- `getProducts(filters)` - Obtener múltiples productos con filtros
- `getProductsByCategory(category)` - Obtener productos de una categoría
- `updateProduct(productId, data)` - Actualizar un producto
- `updateProductsBatch(updates)` - Actualizar múltiples productos en lote
- `healthCheck()` - Verificar disponibilidad del servicio

**Características:**
- ✅ Retry automático con backoff exponencial
- ✅ Manejo de errores 4xx (sin retry excepto 429)
- ✅ Configuración de timeouts
- ✅ Procesamiento en lotes para operaciones masivas

**Configuración de Retry:**
- `maxRetries`: Número máximo de reintentos (default: 3)
- `baseDelay`: Delay base en ms (default: 1000)
- `maxDelay`: Delay máximo en ms (default: 10000)

**Ejemplo de uso:**
```typescript
import { productServiceClient } from './ProductServiceClient'

// Obtener un producto
const product = await productServiceClient.getProduct('123')

// Actualizar múltiples productos
await productServiceClient.updateProductsBatch([
  { productId: '1', data: { in_campaign: true, campaign_price: 80 } },
  { productId: '2', data: { in_campaign: true, campaign_price: 90 } }
])
```

### NotificationServiceClient

Cliente para enviar notificaciones al equipo sobre eventos de campañas.

**Métodos:**
- `sendCampaignActivated(campaign, productsAffected, averageDiscount)` - Notificar activación
- `sendCampaignDeactivated(campaign, report)` - Notificar desactivación con reporte
- `sendCampaignError(campaign, error, operation)` - Notificar errores críticos
- `healthCheck()` - Verificar disponibilidad del servicio

**Características:**
- ✅ No lanza errores si la notificación falla (servicio auxiliar)
- ✅ Logs detallados de operaciones
- ✅ Formato estructurado de notificaciones

**Ejemplo de uso:**
```typescript
import { notificationServiceClient } from './NotificationServiceClient'

// Notificar activación de campaña
await notificationServiceClient.sendCampaignActivated(
  campaign,
  1234, // productos afectados
  35    // descuento promedio %
)

// Notificar error
await notificationServiceClient.sendCampaignError(
  campaign,
  error,
  'activation'
)
```

## Tests

### Property-Based Tests

El archivo `ProductServiceClient.test.ts` incluye property-based tests usando `fast-check`:

**Property 30: Exponential Backoff Retry**
- Valida que el retry funciona con backoff exponencial
- Verifica que los delays aumentan exponencialmente (baseDelay * 2^attempt)
- Confirma que respeta el maxDelay configurado
- Valida que no reintenta en errores 4xx (excepto 429)

### Ejecutar Tests

⚠️ **IMPORTANTE**: El servicio Campaign Manager aún NO tiene contenedor Docker. Los tests se ejecutarán en la Fase 8 cuando se configure Docker.

**Cuando el contenedor esté disponible:**

```bash
# Ejecutar todos los tests
docker exec technovastore-campaign-manager npm test

# Ejecutar solo tests de clientes
docker exec technovastore-campaign-manager npm test -- shared/clients

# Ejecutar con coverage
docker exec technovastore-campaign-manager npm test -- --coverage
```

**Verificación actual (sin contenedor):**

Los archivos TypeScript compilan correctamente sin errores:
```bash
# Verificar compilación TypeScript
npx tsc --noEmit -p domains/commerce/campaign-manager-service
```

## Estado Actual

✅ **Completado:**
- ProductServiceClient implementado con retry y backoff exponencial
- NotificationServiceClient implementado
- Property-based tests escritos para Property 30
- Código compila sin errores TypeScript

⏳ **Pendiente:**
- Ejecutar tests cuando el contenedor Docker esté disponible (Fase 8)
- Verificar integración real con Product Service
- Verificar integración real con Notification Service

## Requisitos Validados

- ✅ **Requirement 6.1**: Comunicación HTTP REST con Product Service
- ✅ **Requirement 6.2**: Actualización de productos con campos de campaña
- ✅ **Requirement 6.3**: Remoción de campos de campaña
- ✅ **Requirement 6.4**: Filtrado de productos por categoría
- ✅ **Requirement 6.5**: Retry con backoff exponencial
- ✅ **Requirement 5.6**: Notificaciones de activación/desactivación

## Próximos Pasos

1. Continuar con la Fase 3: Implementar utilidades compartidas (Task 7)
2. En Fase 8: Configurar Docker y ejecutar tests
3. Verificar integración end-to-end con servicios reales
