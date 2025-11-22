# Product Service

Servicio de gestión de productos para TechNovaStore.

## Arquitectura: Screaming Architecture

Este servicio sigue el patrón Screaming Architecture, donde la estructura del proyecto refleja los casos de uso del negocio.

## Estructura

```
product-service/
├── create-product/           # Crear productos
│   ├── CreateProduct.ts
│   └── CreateProduct.test.ts
├── update-product/           # Actualizar productos
│   ├── UpdateProduct.ts
│   └── UpdateProduct.test.ts
├── delete-product/           # Eliminar productos
│   ├── DeleteProduct.ts
│   └── DeleteProduct.test.ts
├── get-product-by-id/        # Obtener producto por ID
│   ├── GetProductById.ts
│   └── GetProductById.test.ts
├── get-product-by-sku/       # Obtener producto por SKU
│   ├── GetProductBySku.ts
│   └── GetProductBySku.test.ts
├── list-products/            # Listar productos
│   ├── ListProducts.ts
│   └── ListProducts.test.ts
├── search-products/          # Buscar productos
│   ├── SearchProducts.ts
│   └── SearchProducts.test.ts
├── get-related-products/     # Obtener productos relacionados
│   ├── GetRelatedProducts.ts
│   └── GetRelatedProducts.test.ts
├── shared/                   # Infraestructura compartida
│   ├── models/               # Modelos de datos
│   │   └── Product.ts
│   ├── repositories/         # Repositorios
│   │   └── ProductRepository.ts
│   ├── validators/           # Validadores
│   │   └── ProductValidator.ts
│   └── utils/                # Utilidades
│       └── logger.ts
├── api/                      # Capa de presentación HTTP
│   ├── ProductController.ts
│   └── routes.ts
├── config/                   # Configuración
│   └── index.ts
└── index.ts                  # Entry point
```

## Casos de Uso

### 1. Create Product
Crea un nuevo producto en el catálogo con toda su información (nombre, descripción, precio, stock, imágenes, especificaciones técnicas).

### 2. Update Product
Actualiza la información de un producto existente. Permite actualizaciones parciales.

### 3. Delete Product
Elimina un producto del catálogo (soft delete para mantener historial).

### 4. Get Product By ID
Obtiene la información completa de un producto por su ID de MongoDB.

### 5. Get Product By SKU
Obtiene la información completa de un producto por su SKU único.

### 6. List Products
Lista productos con paginación y filtros opcionales (categoría, marca, rango de precio).

### 7. Search Products
Búsqueda de texto completo en productos (nombre, descripción, especificaciones).

### 8. Get Related Products
Obtiene productos relacionados basados en categoría, marca o características similares.

## API Endpoints

- `POST /api/products` - Crear un producto
- `PUT /api/products/:id` - Actualizar un producto
- `DELETE /api/products/:id` - Eliminar un producto
- `GET /api/products/:id` - Obtener producto por ID
- `GET /api/products/sku/:sku` - Obtener producto por SKU
- `GET /api/products` - Listar productos (con paginación y filtros)
- `GET /api/products/search` - Buscar productos
- `GET /api/products/:id/related` - Obtener productos relacionados

## Modelo de Datos

```typescript
interface Product {
  _id: ObjectId;
  sku: string;                    // SKU único
  name: string;                   // Nombre del producto
  description: string;            // Descripción detallada
  category: string;               // Categoría principal
  subcategory?: string;           // Subcategoría
  brand: string;                  // Marca
  price: number;                  // Precio actual
  originalPrice?: number;         // Precio original (para descuentos)
  stock: number;                  // Stock disponible
  images: string[];               // URLs de imágenes
  specifications: Record<string, any>; // Especificaciones técnicas
  tags: string[];                 // Tags para búsqueda
  isActive: boolean;              // Producto activo/inactivo
  createdAt: Date;
  updatedAt: Date;
}
```

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

- `PORT` - Puerto del servicio (default: 3001)
- `NODE_ENV` - Entorno de ejecución
- `MONGODB_URL` - URL de conexión a MongoDB
- `LOG_LEVEL` - Nivel de logging

## Tests

Cada caso de uso tiene tests completos que cubren:
- Casos exitosos
- Manejo de errores
- Validación de entrada
- Reglas de negocio
- Casos edge

## Validaciones

- SKU único en el sistema
- Precio mayor a 0
- Stock no negativo
- Imágenes con URLs válidas
- Categoría y marca requeridas
- Nombre y descripción no vacíos

## Integración con Otros Servicios

- **Sync Engine**: Recibe actualizaciones de productos desde proveedores externos
- **Recommender Service**: Proporciona datos de productos para recomendaciones
- **Order Service**: Consulta disponibilidad y precios de productos
- **Chatbot Service**: Proporciona información de productos para consultas

## Monitoreo

- `/health` - Health check del servicio
- Métricas de rendimiento en logs
- Tracking de operaciones CRUD

## Docker

```bash
# Construir imagen
docker build -t technovastore-product-service .

# Ejecutar contenedor
docker run -p 3001:3001 \
  -e MONGODB_URL=mongodb://host.docker.internal:27017/technovastore \
  technovastore-product-service
```
