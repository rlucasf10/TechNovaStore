# MainLayout - Layout Principal de la Aplicación

Componente de layout principal que integra Header, Footer y el contenido de la página.

## Características

- ✅ Header con navegación y menú móvil integrado
- ✅ Footer con información de la empresa
- ✅ Contenido principal con altura mínima de pantalla completa
- ✅ Modo minimal para páginas de autenticación
- ✅ Responsive y accesible

## Uso

### Layout Completo (por defecto)

```tsx
import { MainLayout } from '@/components/layout'

export default function HomePage() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1>Bienvenido a TechNovaStore</h1>
        {/* Contenido de la página */}
      </div>
    </MainLayout>
  )
}
```

### Layout Minimal (sin Header ni Footer)

Útil para páginas de autenticación donde no quieres mostrar la navegación:

```tsx
import { MainLayout } from '@/components/layout'

export default function LoginPage() {
  return (
    <MainLayout minimal>
      <div className="min-h-screen flex items-center justify-center">
        {/* Formulario de login */}
      </div>
    </MainLayout>
  )
}
```

## Props

```typescript
interface MainLayoutProps {
  children: React.ReactNode
  minimal?: boolean // Si es true, no muestra header ni footer
}
```

## Estructura

El MainLayout organiza la página en tres secciones principales:

```
┌─────────────────────────────────────┐
│           Header                    │ ← Navegación, búsqueda, carrito
├─────────────────────────────────────┤
│                                     │
│           Main Content              │ ← Tu contenido aquí
│           (flex-1)                  │
│                                     │
├─────────────────────────────────────┤
│           Footer                    │ ← Información, enlaces, newsletter
└─────────────────────────────────────┘
```

## Componentes Integrados

### Header

El Header incluye:
- Logo con link a home
- Barra de búsqueda global
- Navegación principal (Categorías, Ofertas, Soporte)
- Iconos de acción (Notificaciones, Carrito, Usuario)
- Menú móvil (hamburger) con sidebar integrado
- Sticky en scroll

### Footer

El Footer incluye:
- Columnas de información (Empresa, Ayuda, Legal, Redes Sociales)
- Formulario de newsletter
- Métodos de pago aceptados
- Copyright y enlaces legales

## Ejemplos de Uso

### Página de Inicio

```tsx
import { MainLayout } from '@/components/layout'
import { HeroSection } from '@/components/home/HeroSection'
import { ProductRecommender } from '@/components/home/ProductRecommender'

export default function HomePage() {
  return (
    <MainLayout>
      <HeroSection />
      <ProductRecommender />
      {/* Más secciones */}
    </MainLayout>
  )
}
```

### Página de Catálogo

```tsx
import { MainLayout } from '@/components/layout'
import { ProductCatalog } from '@/components/products/ProductCatalog'

export default function CatalogPage() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Catálogo de Productos</h1>
        <ProductCatalog />
      </div>
    </MainLayout>
  )
}
```

### Página de Autenticación (Minimal)

```tsx
import { MainLayout } from '@/components/layout'
import { AuthCard } from '@/components/auth/AuthCard'

export default function LoginPage() {
  return (
    <MainLayout minimal>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <AuthCard title="Iniciar Sesión">
          {/* Formulario de login */}
        </AuthCard>
      </div>
    </MainLayout>
  )
}
```

### Dashboard de Usuario

```tsx
import { MainLayout } from '@/components/layout'
import { UserDashboard } from '@/components/dashboard/UserDashboard'

export default function DashboardPage() {
  return (
    <MainLayout>
      <UserDashboard />
    </MainLayout>
  )
}
```

## Integración con Next.js App Router

### Layout de Grupo de Rutas

Puedes usar MainLayout en un layout de grupo de rutas:

```tsx
// app/(public)/layout.tsx
import { MainLayout } from '@/components/layout'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayout>{children}</MainLayout>
}
```

Luego, todas las páginas dentro de `(public)` tendrán el layout automáticamente:

```
app/
├── (public)/
│   ├── layout.tsx          ← MainLayout aquí
│   ├── page.tsx            ← Home
│   ├── productos/
│   │   └── page.tsx        ← Catálogo
│   └── ofertas/
│       └── page.tsx        ← Ofertas
└── (auth)/
    ├── layout.tsx          ← MainLayout minimal aquí
    ├── login/
    │   └── page.tsx
    └── registro/
        └── page.tsx
```

### Layout de Autenticación

```tsx
// app/(auth)/layout.tsx
import { MainLayout } from '@/components/layout'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayout minimal>{children}</MainLayout>
}
```

## Personalización

### Cambiar el Espaciado del Contenido

```tsx
<MainLayout>
  <div className="container mx-auto px-4 py-8">
    {/* py-8 = padding vertical de 2rem */}
    {children}
  </div>
</MainLayout>
```

### Fondo Personalizado

```tsx
<MainLayout>
  <div className="bg-gradient-to-b from-blue-50 to-white min-h-screen">
    {children}
  </div>
</MainLayout>
```

### Ancho Máximo Personalizado

```tsx
<MainLayout>
  <div className="max-w-4xl mx-auto px-4 py-8">
    {/* Ancho máximo de 4xl en lugar del container por defecto */}
    {children}
  </div>
</MainLayout>
```

## Accesibilidad

- ✅ Estructura semántica con `<header>`, `<main>`, `<footer>`
- ✅ Navegación por teclado completa
- ✅ ARIA labels en elementos interactivos
- ✅ Contraste de colores adecuado (WCAG 2.1 AA)
- ✅ Responsive para todos los tamaños de pantalla

## Responsive

El MainLayout es completamente responsive:

- **Móvil (< 768px)**: Menú hamburger, búsqueda debajo del header
- **Tablet (768px - 1024px)**: Navegación completa, búsqueda en header
- **Desktop (> 1024px)**: Layout completo con todos los elementos visibles

## Integración con Providers

El MainLayout funciona con todos los providers configurados en `app/providers.tsx`:

- ✅ React Query (para data fetching)
- ✅ Theme Provider (tema claro/oscuro)
- ✅ Cart Provider (estado del carrito)
- ✅ Chat Provider (chatbot)
- ✅ Toast Notifications (notificaciones globales)

## Mejores Prácticas

1. **Usa MainLayout en todas las páginas públicas**: Mantiene consistencia visual
2. **Usa minimal para autenticación**: Evita distracciones en login/registro
3. **Agrupa rutas con layouts**: Usa grupos de rutas en Next.js para aplicar layouts automáticamente
4. **Mantén el contenido dentro de containers**: Usa `container mx-auto` para centrar el contenido
5. **Respeta el espaciado**: Usa padding consistente (py-8, px-4) en todas las páginas

## Troubleshooting

### El Header no aparece

Verifica que no estés usando `minimal={true}` por error.

### El Footer está en medio de la página

Asegúrate de que el contenido principal tenga suficiente altura. El layout usa `flex-1` en el main para empujar el footer al fondo.

### El menú móvil no funciona

El Header ya tiene el menú móvil integrado. No necesitas agregar un Sidebar separado.

### Problemas de z-index

El Header tiene `z-50` para estar sobre el contenido. Si tienes modales o dropdowns, usa z-index mayor (z-[60], z-[70], etc.).
