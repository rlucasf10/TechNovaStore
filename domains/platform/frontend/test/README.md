# Tests del Frontend - TechNovaStore

Este directorio contiene todos los tests unitarios del frontend, organizados siguiendo la convención de los servicios backend del proyecto.

## Estructura

```
test/
├── setup.ts                          # Configuración global de tests
├── components/                       # Tests de componentes compartidos
│   ├── ui/                          # Tests de componentes de UI base
│   │   ├── Badge.test.tsx
│   │   ├── Breadcrumbs.test.tsx
│   │   ├── Button.test.tsx
│   │   ├── Card.test.tsx
│   │   ├── Dropdown.test.tsx
│   │   ├── Input.test.tsx
│   │   ├── Loading.test.tsx
│   │   ├── Modal.test.tsx
│   │   ├── Pagination.test.tsx
│   │   ├── Rating.test.tsx
│   │   ├── Skeleton.test.tsx
│   │   ├── Tabs.test.tsx
│   │   └── Toast.test.tsx
│   └── layout/                      # Tests de componentes de layout
│       ├── Header.test.tsx
│       ├── Footer.test.tsx
│       ├── Sidebar.test.tsx
│       ├── GlobalSearch.test.tsx
│       └── NotificationDropdown.test.tsx
├── features/                        # Tests de features por dominio
│   ├── catalog/                     # Tests del dominio de catálogo
│   │   ├── ProductCard.test.tsx
│   │   ├── ProductGrid.test.tsx
│   │   ├── ProductFilters.test.tsx
│   │   ├── ProductDetail.test.tsx
│   │   └── ProductGallery.test.tsx
│   ├── commerce/                    # Tests del dominio de comercio
│   │   ├── AddToCartButton.test.tsx
│   │   ├── CartItem.test.tsx
│   │   ├── ShoppingCart.test.tsx
│   │   ├── CheckoutSteps.test.tsx
│   │   └── OrderSummary.test.tsx
│   ├── customer/                    # Tests del dominio de cliente
│   │   ├── auth/                    # Tests de autenticación
│   │   │   ├── AdminRoute.test.tsx
│   │   │   ├── ProtectedRoute.test.tsx
│   │   │   ├── PasswordStrengthIndicator.test.tsx
│   │   │   ├── SetPasswordModal.test.tsx
│   │   │   ├── SocialLoginButtons.test.tsx
│   │   │   └── RateLimitMessage.test.tsx
│   │   └── dashboard/               # Tests de dashboard
│   │       ├── UserDashboard.test.tsx
│   │       ├── OrderHistory.test.tsx
│   │       ├── OrderTracking.test.tsx
│   │       └── NotificationCenter.test.tsx
│   ├── support/                     # Tests del dominio de soporte
│   │   ├── ChatWidget.test.tsx
│   │   ├── ChatMessage.test.tsx
│   │   └── ProductRecommendations.test.tsx
│   └── admin/                       # Tests del dominio de admin
│       └── RateLimitDashboard.test.tsx
├── hooks/                           # Tests de custom hooks
│   ├── useAuth.test.ts
│   ├── useCart.test.ts
│   ├── useProducts.test.ts
│   └── useNotifications.test.ts
└── services/                        # Tests de servicios
    ├── auth.service.test.ts
    ├── product.service.test.ts
    ├── cart.service.test.ts
    └── search.service.test.ts
```

## Convenciones

### Ubicación de Tests

- **Todos los tests** deben estar en la carpeta `test/` en la raíz del proyecto
- **NO usar** carpetas `__tests__/` dentro de `src/`
- Seguir la misma estructura de carpetas que `src/` para facilitar la navegación

### Nomenclatura

- Archivos de test: `[ComponentName].test.tsx` o `[serviceName].test.ts`
- Describe blocks: Usar el nombre del componente/función
- Test cases: Usar descripciones claras en español

### Imports

Usar los alias de path configurados en `tsconfig.json`:

```typescript
// ✅ Correcto
import { Button } from '@/ui/Button'
import { useAuth } from '@/customer/hooks/useAuth'
import { ProductCard } from '@/catalog/components/products/ProductCard'

// ❌ Incorrecto
import { Button } from '../../../src/shared/components/ui/Button'
import { useAuth } from '../../../src/features/customer/hooks/useAuth'
```

### Alias de Path Disponibles

- `@/ui` → `src/shared/components/ui`
- `@/layout` → `src/shared/components/layout`
- `@/hooks` → `src/shared/hooks`
- `@/services` → `src/shared/services`
- `@/store` → `src/shared/store`
- `@/lib` → `src/shared/lib`
- `@/types` → `src/shared/types`
- `@/catalog` → `src/features/catalog`
- `@/commerce` → `src/features/commerce`
- `@/customer` → `src/features/customer`
- `@/support` → `src/features/support`
- `@/admin` → `src/features/admin`

## Ejecutar Tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm test -- --watch

# Ejecutar tests con coverage
npm test -- --coverage

# Ejecutar un test específico
npm test -- Rating.test.tsx

# Ejecutar tests de una carpeta específica
npm test -- test/components/ui
```

## Ejecutar Tests en Docker

```bash
# Ejecutar todos los tests
docker exec technovastore-frontend npm test

# Ejecutar con coverage
docker exec technovastore-frontend npm test -- --coverage

# Ejecutar en modo watch
docker exec -it technovastore-frontend npm test -- --watch
```

## Configuración

- **jest.config.js**: Configuración principal de Jest
- **test/setup.ts**: Configuración global que se ejecuta antes de todos los tests
  - Mocks de Next.js (router, navigation, Image, Link)
  - Mocks de localStorage y sessionStorage
  - Mocks de window.matchMedia, IntersectionObserver, ResizeObserver
  - Variables de entorno para tests

## Cobertura de Tests

Los tests deben cubrir:

1. **Renderizado básico**: El componente se renderiza sin errores
2. **Props**: Todas las props funcionan correctamente
3. **Estados**: Todos los estados del componente
4. **Interacciones**: Clicks, inputs, keyboard navigation
5. **Accesibilidad**: ARIA labels, roles, keyboard support
6. **Edge cases**: Valores límite, errores, casos especiales

## Ejemplo de Test

```typescript
/**
 * Tests para el componente Button
 * Verifica variantes, tamaños, estados y accesibilidad
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/ui/Button'

describe('Button Component', () => {
  describe('Renderizado básico', () => {
    it('renderiza correctamente con children', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button')).toHaveTextContent('Click me')
    })
  })

  describe('Variantes', () => {
    it('aplica la variante primary por defecto', () => {
      render(<Button>Button</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-primary')
    })

    it('aplica la variante secondary correctamente', () => {
      render(<Button variant="secondary">Button</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-secondary')
    })
  })

  describe('Interacciones', () => {
    it('ejecuta onClick cuando se hace clic', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Button</Button>)
      
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('no ejecuta onClick cuando está disabled', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick} disabled>Button</Button>)
      
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Accesibilidad', () => {
    it('tiene el rol button', () => {
      render(<Button>Button</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('está deshabilitado cuando disabled es true', () => {
      render(<Button disabled>Button</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })
})
```

## Mocks Comunes

### Mock de useAuth

```typescript
jest.mock('@/customer/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: { id: '1', email: 'test@example.com', role: 'user' },
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
  })),
}))
```

### Mock de useRouter

```typescript
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/test-path',
}))
```

### Mock de servicios

```typescript
jest.mock('@/services/product.service', () => ({
  ProductService: {
    getProducts: jest.fn(() => Promise.resolve({ data: [] })),
    getProduct: jest.fn(() => Promise.resolve({ data: {} })),
  },
}))
```

## Recursos

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

## Notas

- Los tests E2E están en la carpeta `e2e/` y usan Playwright
- Los tests unitarios deben ser rápidos y no depender de servicios externos
- Usar mocks para dependencias externas (APIs, servicios, etc.)
- Mantener los tests simples y enfocados en una sola funcionalidad
