# Category Service

Servicio para gestión de categorías de productos en TechNovaStore.

## Descripción

El `CategoryService` proporciona una capa de abstracción para interactuar con el sistema de categorías del Product_Service. Incluye métodos para obtener categorías, árbol de categorías, subcategorías y búsqueda.

## Uso

### Importación

```typescript
import { categoryService } from '@/services';
// O usando hooks de React Query
import { useCategories, useCategory, useCategoryTree } from '@/hooks/useCategories';
```

### Métodos Disponibles

#### `getCategories()`

Obtiene todas las categorías.

```typescript
const categories = await categoryService.getCategories();
```

#### `getCategory(slug: string)`

Obtiene una categoría por slug.

```typescript
const category = await categoryService.getCategory('laptops');
```

#### `getCategoryById(id: string)`

Obtiene una categoría por ID.

```typescript
const category = await categoryService.getCategoryById('cat_123');
```

#### `getCategoryTree()`

Obtiene el árbol completo de categorías con subcategorías anidadas.

```typescript
const tree = await categoryService.getCategoryTree();

// Resultado:
// [
//   {
//     id: '1',
//     name: 'Computadoras',
//     slug: 'computadoras',
//     children: [
//       {
//         id: '2',
//         name: 'Laptops',
//         slug: 'laptops',
//         children: []
//       },
//       {
//         id: '3',
//         name: 'Desktops',
//         slug: 'desktops',
//         children: []
//       }
//     ]
//   }
// ]
```

#### `getRootCategories()`

Obtiene solo las categorías principales (sin padre).

```typescript
const rootCategories = await categoryService.getRootCategories();
```

#### `getSubcategories(parentId: string)`

Obtiene las subcategorías de una categoría específica.

```typescript
const subcategories = await categoryService.getSubcategories('cat_123');
```

#### `getFeaturedCategories(limit?: number)`

Obtiene categorías destacadas.

```typescript
const featured = await categoryService.getFeaturedCategories(6);
```

#### `searchCategories(query: string)`

Busca categorías por nombre.

```typescript
const results = await categoryService.searchCategories('laptop');
```

## Uso con React Query Hooks

Se recomienda usar los hooks de React Query para gestión automática de caché y estado:

```typescript
import { 
  useCategories, 
  useCategory, 
  useCategoryTree,
  useFeaturedCategories 
} from '@/hooks/useCategories';

function CategoryNav() {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) return <Spinner />;

  return (
    <nav>
      {categories.map(category => (
        <CategoryLink key={category.id} category={category} />
      ))}
    </nav>
  );
}

function CategoryPage({ slug }: { slug: string }) {
  const { data: category, isLoading } = useCategory(slug);
  const { data: subcategories } = useSubcategories(category?.id);

  if (isLoading) return <Skeleton />;

  return (
    <div>
      <h1>{category.name}</h1>
      <p>{category.description}</p>
      
      {subcategories && subcategories.length > 0 && (
        <SubcategoryList subcategories={subcategories} />
      )}
    </div>
  );
}

function CategoryTreeNav() {
  const { data: tree, isLoading } = useCategoryTree();

  if (isLoading) return <Spinner />;

  return <TreeView data={tree} />;
}
```

## Tipos TypeScript

### Category

```typescript
interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string;
  description: string;
  image: string;
  is_active: boolean;
}
```

### CategoryTree

```typescript
interface CategoryTree extends Category {
  children?: CategoryTree[];
}
```

## Integración con Backend

El servicio se comunica con los siguientes endpoints del Product_Service:

- `GET /categories` - Lista de todas las categorías
- `GET /categories/:slug` - Detalle de categoría por slug
- `GET /categories/id/:id` - Detalle de categoría por ID
- `GET /categories/tree` - Árbol de categorías
- `GET /categories/root` - Categorías principales
- `GET /categories/:id/subcategories` - Subcategorías
- `GET /categories/featured` - Categorías destacadas
- `GET /categories/search` - Búsqueda de categorías

## Caché y Optimización

Los hooks de React Query incluyen configuración de caché:

- **Categorías**: 30 minutos de staleTime
- **Árbol de categorías**: 30 minutos de staleTime
- **Búsqueda**: 5 minutos de staleTime

Las categorías cambian con poca frecuencia, por lo que se usa un staleTime más largo.

## Ejemplos Avanzados

### Navegación jerárquica

```typescript
function CategoryBreadcrumb({ categoryId }: { categoryId: string }) {
  const { data: category } = useCategoryById(categoryId);
  const { data: parent } = useCategoryById(category?.parent_id || '');

  return (
    <nav>
      {parent && (
        <>
          <Link href={`/categorias/${parent.slug}`}>{parent.name}</Link>
          <span> / </span>
        </>
      )}
      <span>{category?.name}</span>
    </nav>
  );
}
```

### Menú desplegable con subcategorías

```typescript
function CategoryDropdown({ categoryId }: { categoryId: string }) {
  const { data: category } = useCategoryById(categoryId);
  const { data: subcategories } = useSubcategories(categoryId);

  return (
    <div className="dropdown">
      <button>{category?.name}</button>
      {subcategories && subcategories.length > 0 && (
        <ul className="dropdown-menu">
          {subcategories.map(sub => (
            <li key={sub.id}>
              <Link href={`/categorias/${sub.slug}`}>
                {sub.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Sidebar de categorías con árbol

```typescript
function CategorySidebar() {
  const { data: tree } = useCategoryTree();

  const renderTree = (nodes: CategoryTree[]) => (
    <ul>
      {nodes.map(node => (
        <li key={node.id}>
          <Link href={`/categorias/${node.slug}`}>
            {node.name}
          </Link>
          {node.children && node.children.length > 0 && (
            renderTree(node.children)
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside className="category-sidebar">
      <h3>Categorías</h3>
      {tree && renderTree(tree)}
    </aside>
  );
}
```

### Categorías destacadas en Home

```typescript
function FeaturedCategories() {
  const { data: categories } = useFeaturedCategories(6);

  return (
    <section className="featured-categories">
      <h2>Categorías Destacadas</h2>
      <div className="grid grid-cols-3 gap-4">
        {categories?.map(category => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </section>
  );
}
```

## Manejo de Errores

Los servicios lanzan errores que pueden ser capturados:

```typescript
try {
  const category = await categoryService.getCategory('invalid-slug');
} catch (error) {
  if (error.response?.status === 404) {
    console.error('Categoría no encontrada');
  }
}
```

Con React Query:

```typescript
const { data, error, isError } = useCategory(slug);

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

- [Product Service](./product.service.README.md)
- [React Query Hooks](../hooks/useCategories.ts)
- [Tipos TypeScript](../types/index.ts)
