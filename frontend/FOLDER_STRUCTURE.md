# Estructura de Carpetas del Frontend - TechNovaStore

Este documento muestra la estructura completa de carpetas del frontend después de completar la Fase 1, Tarea 4.

## Estructura Completa

```
frontend/
├── .github/                    # GitHub workflows y configuración
├── .next/                      # Build output de Next.js (generado)
├── .swc/                       # SWC compiler cache (generado)
├── .vscode/                    # Configuración de VS Code
├── coverage/                   # Reportes de cobertura de tests (generado)
├── docs/                       # Documentación adicional
├── e2e/                        # Tests end-to-end con Playwright
│   ├── fixtures/              # Fixtures para tests E2E
│   ├── pages/                 # Page Objects
│   ├── tests/                 # Tests E2E
│   └── utils/                 # Utilidades para tests
├── node_modules/              # Dependencias (generado)
├── playwright-report/         # Reportes de Playwright (generado)
├── public/                    # Assets estáticos
│   ├── favicon.ico
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon.svg
│   └── manifest.json
├── scripts/                   # Scripts de utilidad
│   └── verify-design-system.js
├── src/                       # Código fuente principal
│   ├── app/                   # Next.js App Router (rutas y páginas)
│   │   ├── (auth)/           # Grupo de rutas autenticadas
│   │   ├── (public)/         # Grupo de rutas públicas
│   │   ├── admin/            # Dashboard de administración
│   │   ├── carrito/          # Página de carrito
│   │   ├── categorias/       # Página de categorías
│   │   ├── checkout/         # Proceso de checkout
│   │   ├── contacto/         # Página de contacto
│   │   ├── dashboard/        # Dashboard de usuario
│   │   │   └── privacy/      # Privacidad y GDPR
│   │   ├── login/            # Página de login
│   │   ├── ofertas/          # Página de ofertas
│   │   ├── privacy-policy/   # Política de privacidad
│   │   ├── productos/        # Catálogo y detalle de productos
│   │   │   └── [id]/         # Detalle de producto dinámico
│   │   ├── registro/         # Página de registro
│   │   ├── layout.tsx        # Layout principal
│   │   ├── page.tsx          # Página de inicio
│   │   ├── providers.tsx     # Providers de React Query, etc.
│   │   └── globals.css       # Estilos globales
│   │
│   ├── components/           # Componentes reutilizables
│   │   ├── ui/              # Componentes base de UI ✅
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Loading.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── CookieConsent.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── layout/          # Componentes de layout ✅ NUEVO
│   │   │   ├── index.ts
│   │   │   └── .gitkeep
│   │   │   # Futuros componentes:
│   │   │   # - Header.tsx
│   │   │   # - Footer.tsx
│   │   │   # - Sidebar.tsx
│   │   │   # - MainLayout.tsx
│   │   │   # - AuthLayout.tsx
│   │   │
│   │   ├── products/        # Componentes de productos ✅
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductDetail.tsx
│   │   │   ├── ProductCatalog.tsx
│   │   │   ├── ProductFilters.tsx
│   │   │   ├── ProductGallery.tsx
│   │   │   ├── ProductSpecs.tsx
│   │   │   ├── PriceComparator.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── cart/            # Componentes de carrito ✅
│   │   │   ├── __tests__/
│   │   │   ├── AddToCartButton.tsx
│   │   │   ├── ShoppingCart.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── chat/            # ChatWidget y relacionados ✅
│   │   │   ├── __tests__/
│   │   │   ├── ChatWidget.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── ChatTypingIndicator.tsx
│   │   │   ├── ChatRecommendationCard.tsx
│   │   │   ├── ProductRecommendations.tsx
│   │   │   ├── ProductCarousel.tsx
│   │   │   ├── QuickReplies.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── checkout/        # Componentes de checkout ✅
│   │   │   ├── CheckoutSteps.tsx
│   │   │   ├── ShippingForm.tsx
│   │   │   ├── PaymentForm.tsx
│   │   │   ├── OrderSummary.tsx
│   │   │   ├── OrderConfirmation.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── dashboard/       # Componentes de dashboard de usuario ✅
│   │   │   ├── __tests__/
│   │   │   ├── UserDashboard.tsx
│   │   │   ├── OrderHistory.tsx
│   │   │   ├── OrderTracking.tsx
│   │   │   ├── TrackingTimeline.tsx
│   │   │   ├── OrderCard.tsx
│   │   │   ├── NotificationCenter.tsx
│   │   │   ├── GdprDashboard.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── admin/           # Componentes de admin ✅ NUEVO
│   │   │   ├── index.ts
│   │   │   └── .gitkeep
│   │   │   # Futuros componentes:
│   │   │   # - AdminDashboard.tsx
│   │   │   # - AdminSidebar.tsx
│   │   │   # - MonitoringCard.tsx
│   │   │   # - TicketManagement.tsx
│   │   │   # - AnalyticsCharts.tsx
│   │   │   # - AIServicesMonitoring.tsx
│   │   │   # - AutomationMonitoring.tsx
│   │   │
│   │   ├── ErrorBoundary.tsx
│   │   └── README.md        # Documentación de componentes ✅ NUEVO
│   │
│   ├── hooks/               # Custom React Hooks ✅
│   │   ├── useAuth.ts       # (futuro)
│   │   ├── useCart.ts       # (futuro)
│   │   ├── useCategories.ts
│   │   ├── useChatbot.ts
│   │   ├── useNotifications.ts
│   │   ├── useOrders.ts
│   │   ├── useProducts.ts
│   │   ├── useTrackingUpdates.ts
│   │   └── useUser.ts
│   │
│   ├── lib/                 # Utilidades y configuraciones ✅
│   │   ├── __tests__/
│   │   ├── animations.ts
│   │   ├── api.ts
│   │   ├── axios.ts
│   │   ├── form-helpers.ts
│   │   ├── form-schemas.ts
│   │   ├── react-query.ts
│   │   ├── socket.ts
│   │   ├── theme.config.ts
│   │   ├── theme.ts
│   │   └── utils.ts
│   │
│   ├── services/            # Servicios de API ✅
│   │   ├── index.ts         # ✅ NUEVO
│   │   └── README.md        # ✅ ACTUALIZADO
│   │   # Futuros servicios:
│   │   # - auth.service.ts
│   │   # - product.service.ts
│   │   # - cart.service.ts
│   │   # - order.service.ts
│   │   # - payment.service.ts
│   │   # - user.service.ts
│   │   # - chat.service.ts
│   │   # - notification.service.ts
│   │   # - admin.service.ts
│   │
│   ├── store/               # Estado global (Zustand) ✅
│   │   ├── auth.store.ts
│   │   ├── cart.store.ts
│   │   ├── chat.store.ts
│   │   ├── notification.store.ts
│   │   ├── theme.store.ts
│   │   ├── index.ts
│   │   └── README.md
│   │
│   ├── types/               # Definiciones de TypeScript ✅
│   │   ├── global.d.ts
│   │   ├── jest-dom.d.ts
│   │   ├── index.ts
│   │   └── README.md        # ✅ NUEVO
│   │
│   ├── contexts/            # React Contexts ✅
│   │   ├── __tests__/
│   │   ├── CartContext.tsx
│   │   └── ChatContext.tsx
│   │
│   ├── middleware/          # Middleware de Next.js ✅
│   │   └── errorHandler.ts
│   │
│   ├── styles/              # Estilos globales ✅
│   │   ├── DESIGN_SYSTEM.md
│   │   ├── examples.tsx
│   │   ├── variables.css
│   │   └── README.md
│   │
│   └── README.md            # Documentación general de src ✅ NUEVO
│
├── test-results/            # Resultados de tests (generado)
├── .env.local               # Variables de entorno locales
├── .env.local.example       # Ejemplo de variables de entorno
├── .eslintrc.json           # Configuración de ESLint
├── .prettierrc              # Configuración de Prettier
├── .prettierignore          # Archivos ignorados por Prettier
├── Dockerfile               # Dockerfile para producción
├── jest.config.js           # Configuración de Jest
├── jest.setup.js            # Setup de Jest
├── next.config.js           # Configuración de Next.js
├── next-env.d.ts            # Tipos de Next.js (generado)
├── package.json             # Dependencias y scripts
├── package-lock.json        # Lock de dependencias
├── playwright.config.ts     # Configuración de Playwright
├── postcss.config.js        # Configuración de PostCSS
├── tailwind.config.js       # Configuración de Tailwind CSS
├── tsconfig.json            # Configuración de TypeScript
├── tsconfig.tsbuildinfo     # Cache de TypeScript (generado)
├── FOLDER_STRUCTURE.md      # Este archivo ✅ NUEVO
└── README.md                # Documentación principal del frontend
```

## Resumen de Cambios - Tarea 4

### ✅ Carpetas Creadas

1. **`src/components/layout/`** - Componentes de layout (Header, Footer, Sidebar, etc.)
2. **`src/components/admin/`** - Componentes del dashboard de administración

### ✅ Archivos de Documentación Creados

1. **`src/README.md`** - Documentación general de la estructura de src
2. **`src/components/README.md`** - Documentación de componentes
3. **`src/types/README.md`** - Documentación de tipos TypeScript
4. **`src/services/README.md`** - Documentación actualizada de servicios
5. **`frontend/FOLDER_STRUCTURE.md`** - Este archivo (estructura visual completa)

### ✅ Archivos Index Creados

1. **`src/components/layout/index.ts`** - Exportaciones de componentes de layout
2. **`src/components/admin/index.ts`** - Exportaciones de componentes de admin
3. **`src/services/index.ts`** - Exportaciones de servicios

### ✅ Carpetas Existentes Verificadas

Todas las carpetas requeridas ya existían:
- ✅ `src/app` - Rutas principales con Next.js App Router
- ✅ `src/components/ui` - Componentes base de UI
- ✅ `src/components/products` - Componentes de productos (como `products`)
- ✅ `src/components/cart` - Componentes de carrito
- ✅ `src/components/chat` - ChatWidget y relacionados
- ✅ `src/hooks` - Custom hooks
- ✅ `src/lib` - Utilidades
- ✅ `src/services` - Servicios de API
- ✅ `src/store` - Estado global (Zustand)
- ✅ `src/types` - Definiciones TypeScript

## Convenciones de Nomenclatura

### Carpetas
- **lowercase con guiones**: `components/`, `hooks/`, `lib/`
- **kebab-case para subcarpetas**: `api-gateway/`, `user-service/`

### Archivos
- **PascalCase para componentes**: `Button.tsx`, `ProductCard.tsx`
- **camelCase para utilidades**: `utils.ts`, `form-helpers.ts`
- **kebab-case para configuración**: `next.config.js`, `tailwind.config.js`
- **UPPERCASE para documentación**: `README.md`, `DESIGN_SYSTEM.md`

### Imports
Usar path aliases configurados en `tsconfig.json`:
```typescript
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks';
import { ProductService } from '@/services';
import { Product } from '@/types';
```

## Próximos Pasos

Con la estructura de carpetas completa, las siguientes tareas de la Fase 2 pueden comenzar:

1. **Tarea 5**: Crear componentes de UI fundamentales
   - Button, Input, Card, Modal, Dropdown, Badge, Spinner, Rating

2. **Tarea 6**: Crear componentes de navegación y layout
   - Breadcrumbs, Pagination, Tabs, Skeleton Loader

3. **Fase 3**: Implementar sistema de autenticación
   - Servicios, hooks y componentes de auth

## Referencias

- [Next.js App Router](https://nextjs.org/docs/app)
- [React Component Patterns](https://reactpatterns.com/)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
