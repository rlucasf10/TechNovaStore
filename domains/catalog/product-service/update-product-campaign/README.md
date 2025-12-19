# Update Product Campaign - Casos de Uso

Este módulo contiene los casos de uso para gestionar los campos de campaña en productos, permitiendo al Campaign Manager Service aplicar y remover descuentos.

## Casos de Uso

### UpdateProductCampaign
Actualiza los campos de campaña de un producto cuando se aplica un descuento.

**Campos actualizados:**
- `in_campaign`: boolean - Indica si el producto está en campaña
- `campaign_id`: string - ID de la campaña activa
- `campaign_price`: number - Precio con descuento
- `original_price`: number - Precio original antes del descuento
- `discount_percentage`: number - Porcentaje de descuento aplicado

### ClearProductCampaign
Limpia los campos de campaña de un producto cuando finaliza una campaña.

**Campos limpiados:**
- `in_campaign`: false
- `campaign_id`: undefined
- `campaign_price`: undefined
- `original_price`: undefined
- `discount_percentage`: undefined

## Property-Based Tests

Los tests de propiedades están implementados en `UpdateProductCampaign.test.ts` y validan:

### Property 27: Product Service Integration
*Para cualquier* descuento aplicado, el producto debe actualizarse en el Product Service con los campos de campaña correctos.

**Validates:** Requirements 6.2

### Property 28: Product Service Cleanup Integration
*Para cualquier* descuento removido, el producto debe actualizarse en el Product Service removiendo los campos de campaña.

**Validates:** Requirements 6.3

## Ejecución de Tests

**IMPORTANTE:** Antes de ejecutar los tests, debes instalar las dependencias:

```bash
# Instalar dependencias dentro del contenedor
docker exec technovastore-product-service npm install

# Ejecutar tests
docker exec technovastore-product-service npm test -- update-product-campaign/UpdateProductCampaign.test.ts
```

## Endpoints API

### PATCH /api/products/:id/campaign
Actualiza los campos de campaña de un producto.

**Request Body:**
```json
{
  "in_campaign": true,
  "campaign_id": "uuid-de-la-campaña",
  "campaign_price": 799.99,
  "original_price": 999.99,
  "discount_percentage": 20
}
```

### DELETE /api/products/:id/campaign
Limpia los campos de campaña de un producto.

**Response:**
```json
{
  "success": true,
  "data": { /* producto actualizado */ },
  "message": "Campaign fields cleared successfully"
}
```

## Integración con Campaign Manager Service

Estos endpoints están diseñados para ser consumidos exclusivamente por el Campaign Manager Service. En producción, deberían estar protegidos por el API Gateway para que solo el Campaign Manager pueda acceder a ellos.
