# Backend Specification - Search API

Especificación del endpoint de búsqueda requerido por el frontend.

## Endpoint

```
GET /api/products/search
```

## Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `q` | string | Sí | Término de búsqueda (mínimo 2 caracteres) |
| `limit` | number | No | Número máximo de resultados (default: 10) |
| `type` | string | No | Filtrar por tipo: 'products', 'categories', 'brands' |

## Response Format

```typescript
interface SearchResponse {
  products: SearchResult[];
  categories: SearchResult[];
  brands: SearchResult[];
  total: number;
}

interface SearchResult {
  type: 'product' | 'category' | 'brand';
  id: string;
  name: string;
  slug?: string;
  image?: string;
  price?: number;
  category?: string;
  productCount?: number;
}
```

## Ejemplo de Request

```bash
GET /api/products/search?q=laptop&limit=10
```

## Ejemplo de Response

```json
{
  "products": [
    {
      "type": "product",
      "id": "prod_123",
      "name": "Laptop Dell XPS 15",
      "slug": "laptop-dell-xps-15",
      "image": "https://cdn.technovastore.com/products/dell-xps-15.jpg",
      "price": 1299.99,
      "category": "Laptops"
    },
    {
      "type": "product",
      "id": "prod_124",
      "name": "Laptop HP Pavilion 14",
      "slug": "laptop-hp-pavilion-14",
      "image": "https://cdn.technovastore.com/products/hp-pavilion-14.jpg",
      "price": 799.99,
      "category": "Laptops"
    },
    {
      "type": "product",
      "id": "prod_125",
      "name": "Laptop Lenovo ThinkPad X1",
      "slug": "laptop-lenovo-thinkpad-x1",
      "image": "https://cdn.technovastore.com/products/lenovo-thinkpad-x1.jpg",
      "price": 1499.99,
      "category": "Laptops"
    }
  ],
  "categories": [
    {
      "type": "category",
      "id": "cat_456",
      "name": "Laptops",
      "slug": "laptops",
      "productCount": 234
    },
    {
      "type": "category",
      "id": "cat_457",
      "name": "Accesorios para Laptop",
      "slug": "accesorios-laptop",
      "productCount": 156
    },
    {
      "type": "category",
      "id": "cat_458",
      "name": "Componentes de Laptop",
      "slug": "componentes-laptop",
      "productCount": 89
    }
  ],
  "brands": [
    {
      "type": "brand",
      "id": "brand_789",
      "name": "Dell",
      "productCount": 156
    },
    {
      "type": "brand",
      "id": "brand_790",
      "name": "HP",
      "productCount": 142
    },
    {
      "type": "brand",
      "id": "brand_791",
      "name": "Lenovo",
      "productCount": 128
    },
    {
      "type": "brand",
      "id": "brand_792",
      "name": "Apple",
      "productCount": 45
    }
  ],
  "total": 950
}
```

## Reglas de Negocio

### Límites de Resultados

El frontend solicita un máximo de 10 resultados distribuidos así:

- **Productos**: Máximo 3
- **Categorías**: Máximo 3
- **Marcas**: Máximo 4

El backend debe retornar los resultados más relevantes según el algoritmo de búsqueda.

### Algoritmo de Búsqueda Sugerido

1. **Búsqueda por coincidencia exacta** en nombre (mayor prioridad)
2. **Búsqueda por coincidencia parcial** en nombre
3. **Búsqueda en descripción** (menor prioridad)
4. **Búsqueda en especificaciones técnicas** (para productos)

### Ordenamiento

Los resultados deben ordenarse por relevancia:

1. Coincidencia exacta en el nombre
2. Coincidencia al inicio del nombre
3. Coincidencia en cualquier parte del nombre
4. Popularidad del producto (ventas, vistas)
5. Disponibilidad en stock

### Performance

- **Latencia objetivo**: < 500ms
- **Caché**: Implementar caché de búsquedas frecuentes (Redis)
- **Índices**: Crear índices en campos de búsqueda (name, description)
- **Full-text search**: Considerar usar Elasticsearch para búsquedas complejas

## Casos de Error

### Query muy corta

```bash
GET /api/products/search?q=a
```

```json
{
  "error": "Query too short",
  "message": "Search query must be at least 2 characters",
  "statusCode": 400
}
```

### Sin resultados

```bash
GET /api/products/search?q=xyzabc123
```

```json
{
  "products": [],
  "categories": [],
  "brands": [],
  "total": 0
}
```

### Error del servidor

```json
{
  "error": "Internal Server Error",
  "message": "An error occurred while searching",
  "statusCode": 500
}
```

## Optimizaciones Recomendadas

### 1. Caché con Redis

```javascript
// Pseudocódigo
const cacheKey = `search:${query}:${limit}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const results = await performSearch(query, limit);
await redis.setex(cacheKey, 300, JSON.stringify(results)); // 5 minutos

return results;
```

### 2. Índices de Base de Datos

```sql
-- MongoDB
db.products.createIndex({ name: "text", description: "text" });

-- PostgreSQL
CREATE INDEX idx_products_name_trgm ON products USING gin (name gin_trgm_ops);
CREATE INDEX idx_products_description_trgm ON products USING gin (description gin_trgm_ops);
```

### 3. Elasticsearch (Opcional)

Para búsquedas más avanzadas, considerar integrar Elasticsearch:

```javascript
const results = await elasticsearchClient.search({
  index: 'products',
  body: {
    query: {
      multi_match: {
        query: searchQuery,
        fields: ['name^3', 'description', 'brand^2', 'category^2'],
        fuzziness: 'AUTO'
      }
    },
    size: limit
  }
});
```

## Testing

### Casos de Prueba

1. **Búsqueda básica**: `q=laptop` → Debe retornar productos, categorías y marcas relacionadas
2. **Búsqueda específica**: `q=dell xps 15` → Debe priorizar el producto exacto
3. **Búsqueda de marca**: `q=apple` → Debe retornar productos Apple y la marca
4. **Búsqueda de categoría**: `q=laptops` → Debe retornar la categoría y productos
5. **Sin resultados**: `q=xyzabc123` → Debe retornar arrays vacíos
6. **Query corta**: `q=a` → Debe retornar error 400
7. **Caracteres especiales**: `q=laptop's` → Debe manejar correctamente

### Performance Testing

```bash
# Probar latencia
for i in {1..100}; do
  curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3000/api/products/search?q=laptop"
done | awk '{sum+=$1; count++} END {print "Average:", sum/count, "ms"}'
```

## Integración con NLPEngine

**IMPORTANTE**: Este endpoint NO debe usar el NLPEngine (Ollama/Phi-3) para mantener latencia baja.

El NLPEngine se usa solo en el ChatWidget para búsqueda conversacional donde la latencia de 2-5 segundos es aceptable.

Para búsqueda rápida (autocompletado), usar:
- Búsqueda directa en base de datos
- Índices optimizados
- Caché agresivo

## Monitoreo

Métricas a monitorear:

- **Latencia promedio**: Debe ser < 500ms
- **Tasa de éxito**: % de búsquedas que retornan resultados
- **Búsquedas más frecuentes**: Para optimizar caché
- **Búsquedas sin resultados**: Para mejorar catálogo

## Seguridad

- **Rate limiting**: Máximo 60 búsquedas por minuto por IP
- **Sanitización**: Limpiar query de caracteres peligrosos
- **SQL Injection**: Usar prepared statements o ORM
- **XSS**: Escapar resultados en el frontend (ya implementado)
