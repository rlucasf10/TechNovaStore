# Reporte de Validación de Screaming Architecture

Fecha: 22/11/2025, 0:32:59

## Resumen

- **Total de servicios analizados**: 13
- **Puntuación promedio**: 92%

### Distribución por Estado

- 🟢 **Excelente** (≥90%): 12 servicios
- 🟡 **Bueno** (70-89%): 0 servicios
- 🟠 **Necesita mejoras** (50-69%): 0 servicios
- 🔴 **Pobre** (<50%): 1 servicios

## Resultados por Dominio

### Dominio: catalog

#### 🟢 product-service (100%)

**Ruta**: `domains/catalog/product-service`

**Criterios de validación**:

- ✅ **Carpetas de casos de uso en raíz** (30/30 pts): ✓ Encontradas 8 carpetas de casos de uso: create-product, delete-product, get-product-by-id...
- ✅ **Sin carpeta src/** (20/20 pts): ✓ No tiene carpeta src/ (código en raíz)
- ✅ **Carpeta shared/ con infraestructura** (15/15 pts): ✓ Tiene carpeta shared/
- ✅ **Carpeta api/ con presentación HTTP** (15/15 pts): ✓ Tiene carpeta api/
- ✅ **Tests junto al código** (10/10 pts): ✓ 8 tests junto al código
- ✅ **Carpeta config/** (5/5 pts): ✓ Tiene carpeta config/
- ✅ **Archivo index.ts en raíz** (5/5 pts): ✓ Tiene index.ts en raíz

#### 🟢 recommender-service (100%)

**Ruta**: `domains/catalog/recommender-service`

**Criterios de validación**:

- ✅ **Carpetas de casos de uso en raíz** (30/30 pts): ✓ Encontradas 6 carpetas de casos de uso: get-session-recommendations, get-similar-products, get-trending-products...
- ✅ **Sin carpeta src/** (20/20 pts): ✓ No tiene carpeta src/ (código en raíz)
- ✅ **Carpeta shared/ con infraestructura** (15/15 pts): ✓ Tiene carpeta shared/
- ✅ **Carpeta api/ con presentación HTTP** (15/15 pts): ✓ Tiene carpeta api/
- ✅ **Tests junto al código** (10/10 pts): ✓ 6 tests junto al código
- ✅ **Carpeta config/** (5/5 pts): ✓ Tiene carpeta config/
- ✅ **Archivo index.ts en raíz** (5/5 pts): ✓ Tiene index.ts en raíz

#### 🟢 sync-engine (100%)

**Ruta**: `domains/catalog/sync-engine`

**Criterios de validación**:

- ✅ **Carpetas de casos de uso en raíz** (30/30 pts): ✓ Encontradas 12 carpetas de casos de uso: analyze-market, cleanup-old-data, compare-product-prices...
- ✅ **Sin carpeta src/** (20/20 pts): ✓ No tiene carpeta src/ (código en raíz)
- ✅ **Carpeta shared/ con infraestructura** (15/15 pts): ✓ Tiene carpeta shared/
- ✅ **Carpeta api/ con presentación HTTP** (15/15 pts): ✓ Tiene carpeta api/
- ✅ **Tests junto al código** (10/10 pts): ✓ 12 tests junto al código
- ✅ **Carpeta config/** (5/5 pts): ✓ Tiene carpeta config/
- ✅ **Archivo index.ts en raíz** (5/5 pts): ✓ Tiene index.ts en raíz

### Dominio: commerce

#### 🟢 auto-purchase-service (100%)

**Ruta**: `domains/commerce/auto-purchase-service`

**Criterios de validación**:

- ✅ **Carpetas de casos de uso en raíz** (30/30 pts): ✓ Encontradas 10 carpetas de casos de uso: calculate-cost, cancel-purchase, execute-purchase...
- ✅ **Sin carpeta src/** (20/20 pts): ✓ No tiene carpeta src/ (código en raíz)
- ✅ **Carpeta shared/ con infraestructura** (15/15 pts): ✓ Tiene carpeta shared/
- ✅ **Carpeta api/ con presentación HTTP** (15/15 pts): ✓ Tiene carpeta api/
- ✅ **Tests junto al código** (10/10 pts): ✓ 10 tests junto al código
- ✅ **Carpeta config/** (5/5 pts): ✓ Tiene carpeta config/
- ✅ **Archivo index.ts en raíz** (5/5 pts): ✓ Tiene index.ts en raíz

#### 🟢 order-service (100%)

**Ruta**: `domains/commerce/order-service`

**Criterios de validación**:

- ✅ **Carpetas de casos de uso en raíz** (30/30 pts): ✓ Encontradas 22 carpetas de casos de uso: cancel-invoice, create-order, generate-automatic-invoice...
- ✅ **Sin carpeta src/** (20/20 pts): ✓ No tiene carpeta src/ (código en raíz)
- ✅ **Carpeta shared/ con infraestructura** (15/15 pts): ✓ Tiene carpeta shared/
- ✅ **Carpeta api/ con presentación HTTP** (15/15 pts): ✓ Tiene carpeta api/
- ✅ **Tests junto al código** (10/10 pts): ✓ 22 tests junto al código
- ✅ **Carpeta config/** (5/5 pts): ✓ Tiene carpeta config/
- ✅ **Archivo index.ts en raíz** (5/5 pts): ✓ Tiene index.ts en raíz

#### 🟢 payment-service (100%)

**Ruta**: `domains/commerce/payment-service`

**Criterios de validación**:

- ✅ **Carpetas de casos de uso en raíz** (30/30 pts): ✓ Encontradas 4 carpetas de casos de uso: get-payment-status, process-payment, process-refund...
- ✅ **Sin carpeta src/** (20/20 pts): ✓ No tiene carpeta src/ (código en raíz)
- ✅ **Carpeta shared/ con infraestructura** (15/15 pts): ✓ Tiene carpeta shared/
- ✅ **Carpeta api/ con presentación HTTP** (15/15 pts): ✓ Tiene carpeta api/
- ✅ **Tests junto al código** (10/10 pts): ✓ 4 tests junto al código
- ✅ **Carpeta config/** (5/5 pts): ✓ Tiene carpeta config/
- ✅ **Archivo index.ts en raíz** (5/5 pts): ✓ Tiene index.ts en raíz

### Dominio: customer

#### 🟢 notification-service (100%)

**Ruta**: `domains/customer/notification-service`

**Criterios de validación**:

- ✅ **Carpetas de casos de uso en raíz** (30/30 pts): ✓ Encontradas 7 carpetas de casos de uso: check-delivery-delays, send-delay-alert, send-invoice-generated...
- ✅ **Sin carpeta src/** (20/20 pts): ✓ No tiene carpeta src/ (código en raíz)
- ✅ **Carpeta shared/ con infraestructura** (15/15 pts): ✓ Tiene carpeta shared/
- ✅ **Carpeta api/ con presentación HTTP** (15/15 pts): ✓ Tiene carpeta api/
- ✅ **Tests junto al código** (10/10 pts): ✓ 7 tests junto al código
- ✅ **Carpeta config/** (5/5 pts): ✓ Tiene carpeta config/
- ✅ **Archivo index.ts en raíz** (5/5 pts): ✓ Tiene index.ts en raíz

#### 🟢 user-service (100%)

**Ruta**: `domains/customer/user-service`

**Criterios de validación**:

- ✅ **Carpetas de casos de uso en raíz** (30/30 pts): ✓ Encontradas 15 carpetas de casos de uso: authenticate-user, cancel-account-deletion, change-password...
- ✅ **Sin carpeta src/** (20/20 pts): ✓ No tiene carpeta src/ (código en raíz)
- ✅ **Carpeta shared/ con infraestructura** (15/15 pts): ✓ Tiene carpeta shared/
- ✅ **Carpeta api/ con presentación HTTP** (15/15 pts): ✓ Tiene carpeta api/
- ✅ **Tests junto al código** (10/10 pts): ✓ 15 tests junto al código
- ✅ **Carpeta config/** (5/5 pts): ✓ Tiene carpeta config/
- ✅ **Archivo index.ts en raíz** (5/5 pts): ✓ Tiene index.ts en raíz

### Dominio: platform

#### 🟢 api-gateway (100%)

**Ruta**: `domains/platform/api-gateway`

**Criterios de validación**:

- ✅ **Carpetas de casos de uso en raíz** (30/30 pts): ✓ Encontradas 6 carpetas de casos de uso: authenticate-request, monitor-security, proxy-request...
- ✅ **Sin carpeta src/** (20/20 pts): ✓ No tiene carpeta src/ (código en raíz)
- ✅ **Carpeta shared/ con infraestructura** (15/15 pts): ✓ Tiene carpeta shared/
- ✅ **Carpeta api/ con presentación HTTP** (15/15 pts): ✓ Tiene carpeta api/
- ✅ **Tests junto al código** (10/10 pts): ✓ 6 tests junto al código
- ✅ **Carpeta config/** (5/5 pts): ✓ Tiene carpeta config/
- ✅ **Archivo index.ts en raíz** (5/5 pts): ✓ Tiene index.ts en raíz

#### 🔴 frontend (0%)

**Ruta**: `domains/platform/frontend`

**Criterios de validación**:

- ❌ **Carpetas de casos de uso en raíz** (0/30 pts): ✗ Solo 0 carpetas de casos de uso (se requieren al menos 2)
- ❌ **Sin carpeta src/** (0/20 pts): ✗ Tiene carpeta src/ (debe mover código a raíz)
- ❌ **Carpeta shared/ con infraestructura** (0/15 pts): ✗ No tiene carpeta shared/
- ❌ **Carpeta api/ con presentación HTTP** (0/15 pts): ✗ No tiene carpeta api/
- ❌ **Tests junto al código** (0/10 pts): ✗ No se encontraron tests
- ❌ **Carpeta config/** (0/5 pts): ✗ No tiene carpeta config/
- ❌ **Archivo index.ts en raíz** (0/5 pts): ✗ No tiene index.ts en raíz

**Recomendaciones**:

- Debe tener al menos 2 carpetas de casos de uso con nombres descriptivos del negocio
- El código debe estar en la raíz, no dentro de src/
- Debe tener shared/ con subcarpetas como models/, utils/, types/
- Debe tener api/ con controladores y rutas
- Los tests deben estar en las carpetas de casos de uso, no en test/ separada
- Debe tener config/ para configuración
- Debe tener index.ts como punto de entrada en la raíz

### Dominio: support

#### 🟢 chatbot-service (100%)

**Ruta**: `domains/support/chatbot-service`

**Criterios de validación**:

- ✅ **Carpetas de casos de uso en raíz** (30/30 pts): ✓ Encontradas 9 carpetas de casos de uso: escalate-to-human, generate-response, manage-session...
- ✅ **Sin carpeta src/** (20/20 pts): ✓ No tiene carpeta src/ (código en raíz)
- ✅ **Carpeta shared/ con infraestructura** (15/15 pts): ✓ Tiene carpeta shared/
- ✅ **Carpeta api/ con presentación HTTP** (15/15 pts): ✓ Tiene carpeta api/
- ✅ **Tests junto al código** (10/10 pts): ✓ 9 tests junto al código
- ✅ **Carpeta config/** (5/5 pts): ✓ Tiene carpeta config/
- ✅ **Archivo index.ts en raíz** (5/5 pts): ✓ Tiene index.ts en raíz

#### 🟢 shipment-tracker (100%)

**Ruta**: `domains/support/shipment-tracker`

**Criterios de validación**:

- ✅ **Carpetas de casos de uso en raíz** (30/30 pts): ✓ Encontradas 5 carpetas de casos de uso: get-estimated-delivery, get-shipment-status, get-tracking-info...
- ✅ **Sin carpeta src/** (20/20 pts): ✓ No tiene carpeta src/ (código en raíz)
- ✅ **Carpeta shared/ con infraestructura** (15/15 pts): ✓ Tiene carpeta shared/
- ✅ **Carpeta api/ con presentación HTTP** (15/15 pts): ✓ Tiene carpeta api/
- ✅ **Tests junto al código** (10/10 pts): ✓ 5 tests junto al código
- ✅ **Carpeta config/** (5/5 pts): ✓ Tiene carpeta config/
- ✅ **Archivo index.ts en raíz** (5/5 pts): ✓ Tiene index.ts en raíz

#### 🟢 ticket-service (100%)

**Ruta**: `domains/support/ticket-service`

**Criterios de validación**:

- ✅ **Carpetas de casos de uso en raíz** (30/30 pts): ✓ Encontradas 24 carpetas de casos de uso: add-message, analyze-feedback-sentiment, analyze-for-escalation...
- ✅ **Sin carpeta src/** (20/20 pts): ✓ No tiene carpeta src/ (código en raíz)
- ✅ **Carpeta shared/ con infraestructura** (15/15 pts): ✓ Tiene carpeta shared/
- ✅ **Carpeta api/ con presentación HTTP** (15/15 pts): ✓ Tiene carpeta api/
- ✅ **Tests junto al código** (10/10 pts): ✓ 24 tests junto al código
- ✅ **Carpeta config/** (5/5 pts): ✓ Tiene carpeta config/
- ✅ **Archivo index.ts en raíz** (5/5 pts): ✓ Tiene index.ts en raíz

## Cumplimiento por Criterio

| Criterio | Servicios que cumplen | Porcentaje |
|----------|----------------------|------------|
| Carpetas de casos de uso en raíz | 12/13 | 92% |
| Sin carpeta src/ | 12/13 | 92% |
| Carpeta shared/ con infraestructura | 12/13 | 92% |
| Carpeta api/ con presentación HTTP | 12/13 | 92% |
| Tests junto al código | 12/13 | 92% |
| Carpeta config/ | 12/13 | 92% |
| Archivo index.ts en raíz | 12/13 | 92% |

## Servicios que Necesitan Atención

Los siguientes servicios tienen puntuaciones bajas y deben ser refactorizados:

- **frontend** (platform): 0% - `domains/platform/frontend`

## Conclusión

✅ **Excelente**: La mayoría de los servicios siguen correctamente Screaming Architecture.

---

*Reporte generado automáticamente por validate-screaming-architecture.js*