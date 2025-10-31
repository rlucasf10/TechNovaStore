# AdminRoute Component

Componente para proteger rutas que requieren rol de administrador.

## Características

- ✅ Verifica autenticación del usuario
- ✅ Verifica rol de administrador
- ✅ Redirige a login si no está autenticado
- ✅ Redirige a unauthorized si no es admin
- ✅ Muestra spinner durante verificación
- ✅ Evita flash de contenido protegido
- ✅ Incluye URL de retorno en redirección

## Uso Básico

```tsx
import { AdminRoute } from '@/components/auth/AdminRoute';

export default function AdminDashboardPage() {
  return (
    <AdminRoute>
      <div>
        <h1>Panel de Administración</h1>
        <p>Solo los administradores pueden ver esto</p>
      </div>
    </AdminRoute>
  );
}
```

## Props

| Prop | Tipo | Por Defecto | Descripción |
|------|------|-------------|-------------|
| `children` | `React.ReactNode` | - | Contenido a proteger (requerido) |
| `loginRedirect` | `string` | `'/login'` | URL a la que redirigir si no está autenticado |
| `unauthorizedRedirect` | `string` | `'/unauthorized'` | URL a la que redirigir si no es admin |
| `includeReturnUrl` | `boolean` | `true` | Si debe incluir la URL actual como parámetro 'from' |

## Ejemplos

### Redirección Personalizada

```tsx
<AdminRoute 
  loginRedirect="/login?from=/admin"
  unauthorizedRedirect="/dashboard"
>
  <AdminPanel />
</AdminRoute>
```

### Sin URL de Retorno

```tsx
<AdminRoute includeReturnUrl={false}>
  <AdminSettings />
</AdminRoute>
```

### En Layout de Admin

```tsx
// app/admin/layout.tsx
import { AdminRoute } from '@/components/auth/AdminRoute';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminRoute>
      <div className="admin-layout">
        <AdminSidebar />
        <main>{children}</main>
      </div>
    </AdminRoute>
  );
}
```

## Flujo de Verificación

1. **Cargando**: Muestra `LoadingPage` mientras verifica autenticación
2. **No Autenticado**: Redirige a `/login?from=/admin/dashboard`
3. **Autenticado pero no Admin**: Redirige a `/unauthorized`
4. **Autenticado y Admin**: Muestra el contenido protegido

## Diferencias con ProtectedRoute

| Característica | ProtectedRoute | AdminRoute |
|----------------|----------------|------------|
| Verifica autenticación | ✅ | ✅ |
| Verifica rol de admin | ❌ | ✅ |
| Redirige a login | ✅ | ✅ |
| Redirige a unauthorized | ❌ | ✅ |
| Uso | Rutas de usuario | Rutas de admin |

## Integración con useAuth

El componente utiliza el hook `useAuth` para obtener el estado de autenticación:

```tsx
const { isAuthenticated, isLoading, status, user } = useAuth();
```

Verifica que:
- `isAuthenticated === true`
- `user.role === 'admin'`

## Página de Unauthorized

Asegúrate de crear una página `/unauthorized` para usuarios sin permisos:

```tsx
// app/unauthorized/page.tsx
export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">Acceso Denegado</h1>
      <p className="text-gray-600 mb-8">
        No tienes permisos para acceder a esta página.
      </p>
      <Link href="/dashboard" className="btn-primary">
        Volver al Dashboard
      </Link>
    </div>
  );
}
```

## Notas de Seguridad

⚠️ **Importante**: Este componente solo protege el frontend. Siempre debes verificar el rol de admin en el backend también.

```typescript
// Backend: Middleware de verificación de admin
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  next();
}
```

## Testing

```tsx
import { render, screen } from '@testing-library/react';
import { AdminRoute } from './AdminRoute';

// Mock del hook useAuth
jest.mock('@/hooks/useAuth');

describe('AdminRoute', () => {
  it('muestra spinner mientras carga', () => {
    useAuth.mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      user: null,
    });
    
    render(
      <AdminRoute>
        <div>Admin Content</div>
      </AdminRoute>
    );
    
    expect(screen.getByTestId('loading-page')).toBeInTheDocument();
  });
  
  it('redirige a login si no está autenticado', () => {
    const mockPush = jest.fn();
    useRouter.mockReturnValue({ push: mockPush });
    useAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      user: null,
    });
    
    render(
      <AdminRoute>
        <div>Admin Content</div>
      </AdminRoute>
    );
    
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/login'));
  });
  
  it('redirige a unauthorized si no es admin', () => {
    const mockPush = jest.fn();
    useRouter.mockReturnValue({ push: mockPush });
    useAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { id: '1', role: 'user' },
    });
    
    render(
      <AdminRoute>
        <div>Admin Content</div>
      </AdminRoute>
    );
    
    expect(mockPush).toHaveBeenCalledWith('/unauthorized');
  });
  
  it('muestra contenido si es admin', () => {
    useAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { id: '1', role: 'admin' },
    });
    
    render(
      <AdminRoute>
        <div>Admin Content</div>
      </AdminRoute>
    );
    
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });
});
```

## Ver También

- [ProtectedRoute](./ProtectedRoute.README.md) - Para rutas que solo requieren autenticación
- [useAuth](../../hooks/useAuth.README.md) - Hook de autenticación
- [AuthLayout](./AuthLayout.tsx) - Layout para páginas de autenticación
