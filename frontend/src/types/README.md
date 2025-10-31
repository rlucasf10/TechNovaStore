# Types - Definiciones de TypeScript

Esta carpeta contiene todas las definiciones de tipos e interfaces compartidas en la aplicación.

## Estructura

```
types/
├── index.ts           # Tipos principales exportados
├── global.d.ts        # Tipos globales y extensiones
├── jest-dom.d.ts      # Tipos para testing
└── README.md          # Este archivo
```

## Tipos Principales

### Modelos de Datos

#### `Product`
Representa un producto en el catálogo.

```typescript
interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  brand: string;
  specifications: Record<string, any>;
  images: string[];
  providers: Provider[];
  our_price: number;
  markup_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

#### `User`
Representa un usuario del sistema.

```typescript
interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: Address;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

#### `Order`
Representa un pedido.

```typescript
interface Order {
  id: number;
  user_id: number;
  order_number: string;
  status: OrderStatus;
  total_amount: number;
  shipping_address: Address;
  billing_address: Address;
  payment_method: string;
  payment_status: PaymentStatus;
  provider_order_id?: string;
  tracking_number?: string;
  estimated_delivery?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}
```

### Tipos de Autenticación

#### `LoginCredentials`
```typescript
interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}
```

#### `RegisterData`
```typescript
interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}
```

#### `AuthMethod`
```typescript
interface AuthMethod {
  type: 'password' | 'google' | 'github';
  providerId?: string;
  linkedAt: Date;
  lastUsed?: Date;
}
```

#### `UserAuthMethods`
```typescript
interface UserAuthMethods {
  userId: string;
  email: string;
  authMethods: AuthMethod[];
}
```

### Tipos de Chat

#### `ChatMessage`
```typescript
interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type: 'text' | 'product_recommendation' | 'quick_reply';
  metadata?: {
    products?: Product[];
    quick_replies?: string[];
    intent?: string;
    confidence?: number;
  };
}
```

#### `ChatSession`
```typescript
interface ChatSession {
  id: string;
  user_id?: number;
  messages: ChatMessage[];
  context: ChatContext;
  created_at: Date;
  updated_at: Date;
}
```

### Tipos de API

#### `ApiResponse<T>`
Respuesta estándar de la API.

```typescript
interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}
```

#### `PaginatedResponse<T>`
Respuesta paginada de la API.

```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
```

#### `ApiError`
Error de la API.

```typescript
interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, any>;
}
```

### Enums y Tipos de Unión

#### `OrderStatus`
```typescript
type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';
```

#### `PaymentStatus`
```typescript
type PaymentStatus = 
  | 'pending'
  | 'completed'
  | 'failed'
  | 'refunded';
```

#### `OAuthProvider`
```typescript
type OAuthProvider = 'google' | 'github';
```

### Tipos de Filtros

#### `ProductFilters`
```typescript
interface ProductFilters {
  category?: string[];
  brand?: string[];
  priceRange?: [number, number];
  specs?: Record<string, string[]>;
  inStock?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'name' | 'rating' | 'newest';
  page?: number;
  limit?: number;
}
```

#### `OrderFilters`
```typescript
interface OrderFilters {
  status?: OrderStatus | 'all';
  dateRange?: [Date, Date];
  searchQuery?: string;
  page?: number;
  limit?: number;
}
```

## Convenciones

### Nomenclatura

1. **Interfaces**: PascalCase
   ```typescript
   interface ProductCard { }
   ```

2. **Types**: PascalCase
   ```typescript
   type OrderStatus = 'pending' | 'confirmed';
   ```

3. **Enums**: PascalCase para el enum, UPPER_SNAKE_CASE para valores
   ```typescript
   enum UserRole {
     ADMIN = 'ADMIN',
     USER = 'USER',
   }
   ```

### Organización

1. **Agrupar por dominio**: Tipos relacionados deben estar juntos
2. **Exportar desde index.ts**: Todos los tipos deben exportarse desde el index
3. **Documentar tipos complejos**: Usar JSDoc para tipos no obvios

### Documentación con JSDoc

```typescript
/**
 * Representa un producto en el catálogo de TechNovaStore
 * 
 * @property {string} id - Identificador único del producto
 * @property {string} sku - SKU del producto
 * @property {Provider[]} providers - Lista de proveedores disponibles
 */
interface Product {
  id: string;
  sku: string;
  providers: Provider[];
}
```

### Tipos Genéricos

Usar genéricos para tipos reutilizables:

```typescript
// ✅ Correcto
interface ApiResponse<T> {
  data: T;
  success: boolean;
}

// ❌ Evitar
interface ProductApiResponse {
  data: Product;
  success: boolean;
}
interface UserApiResponse {
  data: User;
  success: boolean;
}
```

### Tipos vs Interfaces

**Usar Interfaces cuando:**
- Defines la forma de un objeto
- Necesitas extender o implementar
- Defines props de componentes

```typescript
interface User {
  id: string;
  name: string;
}

interface AdminUser extends User {
  role: 'admin';
}
```

**Usar Types cuando:**
- Defines uniones o intersecciones
- Defines aliases de tipos primitivos
- Defines tipos de funciones

```typescript
type Status = 'active' | 'inactive';
type ID = string | number;
type Callback = (data: any) => void;
```

## Extensión de Tipos de Librerías

### Next.js

```typescript
// global.d.ts
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';

declare module 'next' {
  export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
    getLayout?: (page: React.ReactElement) => React.ReactNode;
  };
}
```

### React Query

```typescript
// global.d.ts
import '@tanstack/react-query';

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError;
  }
}
```

## Testing

### Tipos de Test

```typescript
// types/test-utils.ts
import type { RenderOptions } from '@testing-library/react';

export interface CustomRenderOptions extends RenderOptions {
  initialState?: Partial<AppState>;
}
```

### Mocks

```typescript
// types/mocks.ts
export const mockProduct: Product = {
  id: '1',
  sku: 'TEST-001',
  name: 'Test Product',
  // ...
};
```

## Validación con Zod

Los tipos de TypeScript deben tener esquemas de Zod correspondientes:

```typescript
// types/schemas.ts
import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  // ...
});

export type Product = z.infer<typeof ProductSchema>;
```

## Recursos

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [Zod Documentation](https://zod.dev/)
