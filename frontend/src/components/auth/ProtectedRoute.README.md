# ProtectedRoute Component

Componente para proteger rutas que requieren autenticación. Verifica si el usuario está autenticado y redirige a login si no lo está.

## Características

- ✅ Verificación automática de autenticación
- ✅ Redirección a login si no está autenticado
- ✅ Spinner de carga mientras verifica
- ✅ Soporte para URL de retorno (parámetro `from`)
- ✅ Previene flash de contenido protegido
- ✅ Integración con useAuth hook

## Uso Básico

```tsx
import { ProtectedRoute } from '@/components/auth';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>
        <h1>Dashboard</h1>
        <p>Este contenido solo es visible para usuarios autenticados</p>
      </div>
    </ProtectedRoute>
  );
}
```

## Uso con Next.js App Router

### Opción 1: Proteger una página individual

```tsx
// app/dashboard/page.tsx
import { ProtectedRoute } from '@/components/auth';
import DashboardContent from '@/components/dashboard/DashboardContent';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
```

### Opción 2: Proteger un layout completo

```tsx
// app/dashboard/layout.tsx
import { ProtectedRoute } from '@/components/auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="dashboard-layout">
        {children}
      </div>
    </ProtectedRoute>
  );
}
```

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | - | Contenido a proteger (requerido) |
| `redirectTo` | `string` | `'/login'` | URL a la que redirigir si no está autenticado |
| `includeReturnUrl` | `boolean` | `true` | Si debe incluir la URL actual como parámetro `from` |

## Ejemplos

### Redirección personalizada

```tsx
<ProtectedRoute redirectTo="/auth/signin">
  <AdminPanel />
</ProtectedRoute>
```

### Sin URL de retorno

```tsx
<ProtectedRoute includeReturnUrl={false}>
  <SettingsPage />
</ProtectedRoute>
```

### Con redirección completa

```tsx
<ProtectedRoute redirectTo="/login?error=unauthorized">
  <SecretPage />
</ProtectedRoute>
```

## Flujo de Autenticación

1. **Usuario accede a ruta protegida**
   - ProtectedRoute verifica el estado de autenticación

2. **Si está autenticado**
   - Muestra el contenido protegido inmediatamente

3. **Si no está autenticado**
   - Muestra spinner de carga
   - Redirige a `/login?from=/ruta-actual`
   - Después del login, el usuario es redirigido de vuelta

4. **Mientras verifica**
   - Muestra LoadingPage (spinner centrado)
   - Previene flash de contenido

## Integración con useAuth

ProtectedRoute utiliza el hook `useAuth` internamente:

```tsx
const { isAuthenticated, isLoading, status } = useAuth();
```

Estados manejados:
- `loading`: Verificando autenticación
- `authenticated`: Usuario autenticado
- `unauthenticated`: Usuario no autenticado

## Diferencia con useRequireAuth

| Característica | ProtectedRoute | useRequireAuth |
|----------------|----------------|----------------|
| Tipo | Componente | Hook |
| Uso | Envolver contenido | Dentro de componente |
| Spinner | Incluido | Manual |
| Redirección | Automática | Automática |
| Flexibilidad | Media | Alta |

### Cuándo usar cada uno

**ProtectedRoute** (recomendado):
- Proteger páginas completas
- Layouts de secciones protegidas
- Cuando quieres un spinner automático

**useRequireAuth**:
- Cuando necesitas lógica personalizada
- Cuando quieres controlar el loading state
- Cuando necesitas acceso al objeto user

## Ejemplo Completo

```tsx
// app/dashboard/page.tsx
'use client';

import { ProtectedRoute } from '@/components/auth';
import { useAuth } from '@/hooks/useAuth';

function DashboardContent() {
  const { user } = useAuth();
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">
        Bienvenido, {user?.firstName}
      </h1>
      <p className="text-gray-600 mt-2">
        Este es tu panel de control personal
      </p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
```

## Notas Importantes

### Server Components vs Client Components

ProtectedRoute es un **Client Component** (usa `'use client'`) porque:
- Necesita acceso a hooks de React (useAuth, useRouter)
- Maneja estado de autenticación en el cliente
- Realiza redirecciones del lado del cliente

### Prevención de Flash de Contenido

ProtectedRoute previene el "flash" de contenido protegido:

```tsx
// ❌ Sin ProtectedRoute - el usuario ve contenido antes de redirigir
export default function SecretPage() {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    redirect('/login'); // Flash visible antes de redirigir
  }
  
  return <SecretContent />;
}

// ✅ Con ProtectedRoute - spinner hasta que se confirme autenticación
export default function SecretPage() {
  return (
    <ProtectedRoute>
      <SecretContent />
    </ProtectedRoute>
  );
}
```

### Performance

ProtectedRoute está optimizado para:
- Verificación rápida de autenticación (caché de React Query)
- Redirección inmediata si no está autenticado
- Mínimo re-renderizado

## Requisitos

- Requisito 20.5: Proteger rutas sensibles requiriendo autenticación
- Integración con sistema de autenticación JWT
- Soporte para redirección post-login

## Ver También

- [useAuth Hook](../../hooks/useAuth.README.md)
- [AuthLayout Component](./AuthLayout.tsx)
- [Sistema de Autenticación](../../services/auth.service.README.md)
