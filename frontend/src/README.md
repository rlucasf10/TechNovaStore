# Estructura del Frontend - TechNovaStore

Este documento describe la arquitectura y organización del código del frontend.

## Estructura de Carpetas

```
src/
├── app/                    # Next.js App Router (rutas y páginas)
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes base de UI
│   ├── layout/           # Componentes de layout
│   ├── products/         # Componentes de productos
│   ├── cart/             # Componentes de carrito
│   ├── chat/             # ChatWidget y relacionados
│   ├── checkout/         # Componentes de checkout
│   ├── dashboard/        # Componentes de dashboard de usuario
│   └── admin/            # Componentes de dashboard de admin
├── hooks/                # Custom React Hooks
├── lib/                  # Utilidades y configuraciones
├── services/             # Servicios de API
├── store/                # Estado global (Zustand)
├── types/                # Definiciones de TypeScript
├── contexts/             # React Contexts
├── middleware/           # Middleware de Next.js
└── styles/               # Estilos globales y variables CSS
```

## Descripción de Carpetas

### `/app` - Next.js App Router
Contiene las rutas y páginas de la aplicación usando el App Router de Next.js 14+.

**Características:**
- Server Components por defecto
- Layouts anidados
- Loading y error states
- Metadata para SEO

**Estructura:**
```
app/
├── (auth)/              # Grupo de rutas autenticadas
├── (public)/            # Grupo de rutas públicas
├── admin/               # Dashboard de administración
├── dashboard/           # Dashboard de usuario
├── productos/           # Catálogo y detalle de productos
├── carrito/             # Carrito de compras
├── checkout/            # Proceso de checkout
├── layout.tsx           # Layout principal
└── page.tsx             # Página de inicio
```

### `/components` - Componentes Reutilizables
Componentes de React organizados por funcionalidad. Ver [components/README.md](./components/README.md) para más detalles.

### `/hooks` - Custom React Hooks
Hooks personalizados para lógica reutilizable.

**Ejemplos:**
- `useAuth` - Autenticación y gestión de usuario
- `useCart` - Gestión del carrito de compras
- `useProducts` - Consulta de productos
- `useOrders` - Gestión de pedidos
- `useChatbot` - Integración con el chatbot
- `useNotifications` - Sistema de notificaciones

**Convenciones:**
- Prefijo `use` para todos los hooks
- Un hook por archivo
- Documentar con JSDoc
- Incluir tests unitarios

### `/lib` - Utilidades y Configuraciones
Funciones de utilidad, configuraciones y helpers.

**Contenido:**
- `api.ts` - Cliente HTTP configurado
- `axios.ts` - Configuración de Axios
- `socket.ts` - Cliente Socket.IO
- `react-query.ts` - Configuración de React Query
- `utils.ts` - Funciones de utilidad generales
- `form-schemas.ts` - Esquemas de validación con Zod
- `theme.ts` - Configuración del tema

### `/services` - Servicios de API
Capa de abstracción para comunicación con el backend.

**Estructura:**
```typescript
// Ejemplo: ProductService
class ProductService {
  async getProducts(filters?: ProductFilters): Promise<Product[]> {}
  async getProduct(id: string): Promise<Product> {}
  async searchProducts(query: string): Promise<Product[]> {}
}
```

**Servicios principales:**
- `AuthService` - Autenticación
- `ProductService` - Productos
- `OrderService` - Pedidos
- `CartService` - Carrito
- `ChatService` - Chatbot
- `UserService` - Usuarios
- `PaymentService` - Pagos
- `NotificationService` - Notificaciones

### `/store` - Estado Global (Zustand)
Stores de Zustand para estado global de la aplicación.

**Stores:**
- `auth.store.ts` - Estado de autenticación
- `cart.store.ts` - Estado del carrito
- `chat.store.ts` - Estado del chat
- `notification.store.ts` - Estado de notificaciones
- `theme.store.ts` - Tema (claro/oscuro)

**Patrón:**
```typescript
import { create } from 'zustand';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (credentials) => { /* ... */ },
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

### `/types` - Definiciones de TypeScript
Tipos e interfaces compartidas en toda la aplicación.

**Contenido:**
- `index.ts` - Tipos principales exportados
- `global.d.ts` - Tipos globales
- Interfaces de modelos (User, Product, Order, etc.)
- Tipos de API responses
- Enums compartidos

**Convenciones:**
- Usar interfaces para objetos
- Usar types para uniones y aliases
- Exportar todo desde index.ts
- Documentar tipos complejos

### `/contexts` - React Contexts
Contexts de React para estado compartido (alternativa a Zustand para casos específicos).

**Uso:**
- Preferir Zustand para estado global
- Usar Context solo cuando sea necesario (ej: tema, i18n)

### `/middleware` - Middleware de Next.js
Middleware para interceptar requests.

**Uso:**
- Autenticación
- Redirecciones
- Headers personalizados
- Rate limiting

### `/styles` - Estilos Globales
Estilos CSS globales y variables del sistema de diseño.

**Contenido:**
- `variables.css` - Variables CSS (colores, espaciado, tipografía)
- `globals.css` - Estilos globales
- `DESIGN_SYSTEM.md` - Documentación del sistema de diseño

## Patrones y Convenciones

### Importaciones
Usar path aliases configurados en `tsconfig.json`:
```typescript
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks';
import { ProductService } from '@/services';
import { Product } from '@/types';
```

### Componentes
- **Server Components** por defecto (Next.js 14+)
- **Client Components** solo cuando sea necesario (`'use client'`)
- Separar lógica de presentación
- Props tipadas con TypeScript
- Documentar con JSDoc

### Estado
- **React Query** para estado del servidor (datos de API)
- **Zustand** para estado global del cliente
- **useState** para estado local del componente
- **Context** solo cuando sea absolutamente necesario

### Estilos
- **Tailwind CSS** como framework principal
- Variables CSS para temas
- Evitar CSS-in-JS
- Mantener consistencia con el sistema de diseño

### Testing
- **Jest** para tests unitarios
- **React Testing Library** para tests de componentes
- **Playwright** para tests E2E
- Cobertura mínima: 80%

## Flujo de Datos

```
Usuario → Componente → Hook → Service → API Backend
                ↓
              Store (Zustand)
                ↓
         React Query Cache
                ↓
           Componente
```

## Performance

### Optimizaciones Implementadas
- Code splitting automático (Next.js)
- Lazy loading de componentes pesados
- Image optimization (Next.js Image)
- React Query para caché de datos
- Memoización con useMemo/useCallback
- Virtualización para listas largas

### Métricas Objetivo
- FCP < 1.8s
- LCP < 2.5s
- TTI < 3.8s
- CLS < 0.1
- FID < 100ms

## Seguridad

### Medidas Implementadas
- httpOnly cookies para tokens
- Validación de inputs con Zod
- Sanitización de HTML
- CSP headers
- HTTPS obligatorio en producción

## Accesibilidad

### Estándares
- WCAG 2.1 Level AA
- Navegación por teclado completa
- Etiquetas ARIA apropiadas
- Contraste mínimo 4.5:1
- HTML semántico

## Recursos Adicionales

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de React Query](https://tanstack.com/query/latest)
- [Documentación de Zustand](https://docs.pmnd.rs/zustand)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)
- [Guía de Testing](../TESTING_GUIDE.md)
