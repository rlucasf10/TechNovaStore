# Componentes del Frontend

Esta carpeta contiene todos los componentes reutilizables de la aplicación TechNovaStore.

## Estructura de Carpetas

### `/ui`
Componentes base de interfaz de usuario (UI primitives):
- Button
- Input
- Card
- Modal
- Dropdown
- Badge
- Spinner/Loader
- Rating
- Breadcrumbs
- Pagination
- Tabs
- Skeleton Loader

### `/layout`
Componentes de layout y estructura de páginas:
- Header (navegación principal)
- Footer
- Sidebar Navigation (móvil y desktop)
- MainLayout (layout principal de la app)
- AuthLayout (layout para páginas de autenticación)

### `/products`
Componentes relacionados con productos:
- ProductCard
- ProductDetail
- ProductCatalog
- ProductFilters
- ProductGallery
- ProductSpecs
- PriceComparator
- SearchBar

### `/cart`
Componentes del carrito de compras:
- ShoppingCart
- CartItem
- AddToCartButton
- CartSummary

### `/chat`
Componentes del ChatWidget con IA:
- ChatWidget
- ChatMessage
- ChatInput
- ChatTypingIndicator
- ProductRecommendations
- ChatRecommendationCard

### `/checkout`
Componentes del proceso de checkout:
- CheckoutSteps
- ShippingForm
- PaymentForm
- OrderSummary
- OrderConfirmation

### `/dashboard`
Componentes del dashboard de usuario:
- UserDashboard
- OrderHistory
- OrderTracking
- TrackingTimeline
- NotificationCenter
- GdprDashboard

### `/admin`
Componentes del dashboard de administración:
- AdminDashboard
- AdminSidebar
- MonitoringCard
- TicketManagement
- AnalyticsCharts
- AIServicesMonitoring
- AutomationMonitoring

## Convenciones

### Nomenclatura
- Usar PascalCase para nombres de componentes
- Usar camelCase para nombres de archivos de utilidades
- Cada componente debe tener su propio archivo

### Estructura de Archivos
```
ComponentName/
├── ComponentName.tsx       # Componente principal
├── ComponentName.test.tsx  # Tests unitarios
├── ComponentName.stories.tsx # Storybook (opcional)
├── index.ts               # Re-exportación
└── types.ts               # Tipos específicos del componente
```

### Importaciones
Preferir importaciones desde el index.ts de cada carpeta:
```typescript
// ✅ Correcto
import { Button, Input } from '@/components/ui';

// ❌ Evitar
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
```

### Props
- Definir interfaces para las props de cada componente
- Usar TypeScript estricto
- Documentar props complejas con JSDoc

### Estilos
- Usar Tailwind CSS para estilos
- Evitar CSS modules a menos que sea necesario
- Mantener consistencia con el sistema de diseño

## Testing
- Cada componente debe tener tests unitarios
- Usar React Testing Library
- Enfocarse en comportamiento del usuario, no en implementación
