# Integración con Campaign Manager Service

Este documento describe las modificaciones realizadas en el Product Service para soportar la integración con el Campaign Manager Service.

## Cambios Realizados

### 1. Modificación del Schema de Product (Tarea 27.1)

Se agregaron los siguientes campos al modelo `IProduct` y al schema de MongoDB:

```typescript
// Campos de campaña
in_campaign?: boolean;        // Indica si el producto está en campaña
campaign_id?: string;         // ID de la campaña activa
campaign_price?: number;      // Precio con descuento
original_price?: number;      // Precio original antes del descuento
discount_percentage?: number; // Porcentaje de descuento aplicado
```

**Índices agregados:**
- `{ in_campaign: 1, campaign_id: 1 }` - Para consultas de productos en campaña
- `{ campaign_id: 1, is_active: 1 }` - Para consultas de productos por campaña

**Archivo modificado:** `domains/catalog/product-service/shared/types/Product.ts`

### 2. Endpoint PATCH /api/products/:id/campaign (Tarea 27.2)

Nuevo endpoint para actualizar los campos de campaña de un producto.

**Caso de uso:** `UpdateProductCampaign`
**Ubicación:** `domains/catalog/product-service/update-product-campaign/`

**Request:**
```http
PATCH /api/products/:id/campaign
Content-Type: application/json

{
  "in_campaign": true,
  "campaign_id": "uuid-de-la-campaña",
  "campaign_price": 799.99,
  "original_price": 999.99,
  "discount_percentage": 20
}
```

**Validaciones:**
- `campaign_price` debe ser >= 0
- `original_price` debe ser >= 0
- `discount_percentage` debe estar entre 0 y 100

**Archivos creados/modificados:**
- `update-product-campaign/UpdateProductCampaign.ts` (nuevo)
- `api/controllers/ProductController.ts` (modificado)
- `api/validators/productValidator.ts` (modificado)
- `api/routes/productRoutes.ts` (modificado)

### 3. Endpoint DELETE /api/products/:id/campaign (Tarea 27.3)

Nuevo endpoint para limpiar los campos de campaña de un producto.

**Caso de uso:** `ClearProductCampaign`
**Ubicación:** `domains/catalog/product-service/clear-product-campaign/`

**Request:**
```http
DELETE /api/products/:id/campaign
```

**Response:**
```json
{
  "success": true,
  "data": { /* producto actualizado */ },
  "message": "Campaign fields cleared successfully"
}
```

**Archivos creados/modificados:**
- `clear-product-campaign/ClearProductCampaign.ts` (nuevo)
- `api/controllers/ProductController.ts` (modificado)
- `api/routes/productRoutes.ts` (modificado)

### 4. Property-Based Tests (Tareas 27.4 y 27.5)

Se implementaron tests de propiedades usando `fast-check` para validar:

#### Property 27: Product Service Integration
*Para cualquier* descuento aplicado, el producto debe actualizarse en el Product Service con los campos de campaña correctos.

**Validates:** Requirements 6.2

#### Property 28: Product Service Cleanup Integration
*Para cualquier* descuento removido, el producto debe actualizarse en el Product Service removiendo los campos de campaña.

**Validates:** Requirements 6.3

**Archivo creado:** `update-product-campaign/UpdateProductCampaign.test.ts`

**Configuración:** 100 iteraciones por propiedad

## Instalación de Dependencias

Antes de ejecutar los tests, instalar `fast-check`:

```bash
docker exec technovastore-product-service npm install
```

## Ejecución de Tests

```bash
# Ejecutar todos los tests del Product Service
docker exec technovastore-product-service npm test

# Ejecutar solo los tests de integración con Campaign Manager
docker exec technovastore-product-service npm test -- update-product-campaign/UpdateProductCampaign.test.ts
```

## Seguridad

**IMPORTANTE:** Los endpoints de campaña (`/api/products/:id/campaign`) están diseñados para ser consumidos exclusivamente por el Campaign Manager Service.

En producción, estos endpoints deben estar protegidos por el API Gateway para que solo el Campaign Manager Service pueda acceder a ellos. Se recomienda:

1. Configurar el API Gateway para validar que las peticiones vengan del Campaign Manager Service
2. Usar autenticación service-to-service (por ejemplo, JWT con claims específicos)
3. Implementar rate limiting específico para estos endpoints

## Compatibilidad

Estos cambios son **retrocompatibles**. Los productos existentes sin campaña seguirán funcionando normalmente:

- Los campos de campaña son opcionales (`?`)
- Los valores por defecto son apropiados (`in_campaign: false`)
- Los endpoints existentes no se ven afectados

## Próximos Pasos

1. ✅ Modificar schema de Product
2. ✅ Crear endpoint PATCH /api/products/:id/campaign
3. ✅ Crear endpoint DELETE /api/products/:id/campaign
4. ✅ Implementar property tests
5. ⏳ Instalar dependencias en el contenedor
6. ⏳ Ejecutar tests para validar la implementación
7. ⏳ Integrar con Campaign Manager Service (Fase 8 del plan)

## Referencias

- **Spec:** `.kiro/specs/campaign-manager-service/`
- **Requirements:** 3.4, 4.3, 6.2, 6.3
- **Design Properties:** 27, 28
