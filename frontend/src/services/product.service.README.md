# Product Service

Servicio para gestión de productos en TechNovaStore.

## Descripción

El `ProductService` proporciona una capa de abstracción para interactuar con el Product_Service del backend. Incluye métodos para obtener productos, buscar, filtrar y gestionar el catálogo de productos.

## Uso

### Importación

```typescript
import { productService } from '@/services';
// O usando hooks de React Query
import { useProducts, useProduct } from '@/hooks/useProducts';
```

### Métodos Disponibles

#### `getProducts(filters?: ProductFilters)`

Obtiene una lista paginada de productos con filtros opcionales.

```typescript
const products = await productService.getProducts({
  category: 'laptops',
  minPrice: 500,
  maxPrice: 2000,
  sortBy: 'price_asc',
  page: 1,
  limit: 20
});
```

**Filtros disponibles:**
- `page`: Número de página (default: 1)
- `limit`: Productos por página (default: 20)
- `category`: Categoría o array de categorías
- `brand`: Marca o array de marcas
- `search`: Término de búsqueda
- `minPrice`: Precio mínimo
- `maxPrice`: Precio máximo
- `inStock`: Solo productos en stock
- `specs`: Especificaciones técnicas (objeto clave-valor)
- `sortBy`: Ordenamiento ('price_asc', 'price_desc', 'name', 'rating', 'newest', 'popularity')

#### `getProduct(id: string)`

Obtiene un producto específico por ID.

```typescript
const product = await productService.getProduct('prod_123');
```

#### `searchProducts(params: SearchProductsParams)`

Busca productos por término de búsqueda.

```typescript
const results = await productService.searchProducts({
  query: 'laptop gaming',
  limit: 10,
  category: 'laptops'
});
```

#### `getFeaturedProducts(limit?: number)`

Obtiene productos destacados.

```typescript
const featured = await productService.getFeaturedProducts(10);
```

#### `getRelatedProducts(productId: string, limit?: number)`

Obtiene productos relacionados a un producto específico.

```typescript
const related = await productService.getRelatedProducts('prod_123', 4);
```

#### `getProductsByCategory(categorySlug: string, filters?)`

Obtiene productos de una categoría específica.

```typescript
const laptops = await productService.getProductsByCategory('laptops', {
  minPrice: 500,
  sortBy: 'price_asc'
});
```

## Uso con React Query Hooks

Se recomienda usar los hooks de React Query para gestión automática de caché y estado:

```typescript
import { useProducts, useProduct } from '@/hooks/useProducts';

function ProductList() {
  const { data, isLoading, error } = useProducts({
    category: 'laptops',
    sortBy: 'price_asc'
  });

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      {data.data.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function ProductDetail({ id }: { id: string }) {
  const { data: product, isLoading } = useProduct(id);

  if (isLoading) return <Skeleton />;

  return <ProductDetailView product={product} />;
}
```

## Tipos TypeScript

### ProductFilters

```typescript
interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string | string[];
  brand?: string | string[];
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  specs?: Record<string, string | string[]>;
  sortBy?: 'price_asc' | 'price_desc' | 'name' | 'rating' | 'newest' | 'popularity';
}
```

### SearchProductsParams

```typescript
interface SearchProductsParams {
  query: string;
  limit?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}
```

## Integración con Backend

El servicio se comunica con los siguientes endpoints del Product_Service:

- `GET /products` - Lista de productos con filtros
- `GET /products/:id` - Detalle de producto
- `GET /products/search` - Búsqueda de productos
- `GET /products/featured` - Productos destacados
- `GET /products/:id/related` - Productos relacionados

## Caché y Optimización

Los hooks de React Query incluyen configuración de caché:

- **Productos**: 5 minutos de staleTime
- **Búsqueda**: 2 minutos de staleTime
- **Destacados**: 10 minutos de staleTime

Esto reduce las llamadas al backend y mejora el rendimiento.

## Ejemplos Avanzados

### Filtrado por especificaciones técnicas

```typescript
const { data } = useProducts({
  category: 'laptops',
  specs: {
    ram: ['16GB', '32GB'],
    processor: 'Intel Core i7',
    storage: '512GB SSD'
  }
});
```

### Búsqueda con filtros de precio

```typescript
const { data } = useProductSearch({
  query: 'gaming laptop',
  minPrice: 1000,
  maxPrice: 2000,
  category: 'laptops'
});
```

### Paginación

```typescript
const [page, setPage] = useState(1);

const { data } = useProducts({
  category: 'laptops',
  page,
  limit: 20
});

// Navegar a siguiente página
const nextPage = () => setPage(prev => prev + 1);
```

## Manejo de Errores

Los servicios lanzan errores que pueden ser capturados:

```typescript
try {
  const product = await productService.getProduct('invalid_id');
} catch (error) {
  if (error.response?.status === 404) {
    console.error('Producto no encontrado');
  }
}
```

Con React Query:

```typescript
const { data, error, isError } = useProduct(id);

if (isError) {
  return <ErrorMessage error={error} />;
}
```

## Requisitos

- Requisito 22.1: Integración con microservicios
- Integración con Product_Service del backend
- Axios configurado con interceptors
- React Query para gestión de estado del servidor

## Ver También

- [Category Service](./category.service.README.md)
- [React Query Hooks](../hooks/useProducts.ts)
- [Tipos TypeScript](../types/index.ts)
