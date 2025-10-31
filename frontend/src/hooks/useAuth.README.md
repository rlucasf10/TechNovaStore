# Hook useAuth

Hook personalizado para gestionar el estado de autenticación con React Query.

## Características

- ✅ Gestión de estado de autenticación con React Query
- ✅ Caché inteligente de usuario autenticado
- ✅ Sincronización automática con Zustand store
- ✅ Métodos para login, logout, register y checkAuth
- ✅ Manejo de estados: loading, authenticated, unauthenticated
- ✅ Refresh token automático
- ✅ Manejo de errores consistente
- ✅ Hooks auxiliares para protección de rutas

## Uso Básico

```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const {
    user,
    status,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
  } = useAuth();

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <div>No autenticado</div>;
  }

  return (
    <div>
      <h1>Bienvenido, {user.firstName}!</h1>
      <button onClick={logout}>Cerrar Sesión</button>
    </div>
  );
}
```

## API del Hook

### Estado

```typescript
interface UseAuthReturn {
  // Estado del usuario
  user: User | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  isLoading: boolean;
  isAuthenticated: boolean;
  isUnauthenticated: boolean;
  error: AuthError | null;
  
  // Métodos
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<User>;
  checkAuth: () => Promise<User | null>;
  refetch: () => Promise<void>;
  
  // Estados de mutaciones
  isLoggingIn: boolean;
  isLoggingOut: boolean;
  isRegistering: boolean;
}
```

### Métodos

#### `login(credentials)`

Inicia sesión con email y contraseña.

```tsx
const { login, isLoggingIn } = useAuth();

const handleLogin = async () => {
  try {
    await login({
      email: 'usuario@example.com',
      password: 'password123',
      rememberMe: true,
    });
    // Redirige automáticamente a /dashboard
  } catch (error) {
    console.error('Error de login:', error);
  }
};
```

#### `logout()`

Cierra la sesión del usuario.

```tsx
const { logout, isLoggingOut } = useAuth();

const handleLogout = async () => {
  await logout();
  // Redirige automáticamente a /login
};
```

#### `register(data)`

Registra un nuevo usuario.

```tsx
const { register, isRegistering } = useAuth();

const handleRegister = async () => {
  try {
    await register({
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      acceptTerms: true,
    });
    // Redirige automáticamente a /dashboard
  } catch (error) {
    console.error('Error de registro:', error);
  }
};
```

#### `checkAuth()`

Verifica el estado de autenticación actual.

```tsx
const { checkAuth } = useAuth();

const verifyAuth = async () => {
  const user = await checkAuth();
  if (user) {
    console.log('Usuario autenticado:', user);
  } else {
    console.log('No autenticado');
  }
};
```

#### `refetch()`

Refresca los datos del usuario actual.

```tsx
const { refetch } = useAuth();

const refreshUserData = async () => {
  await refetch();
};
```

## Hooks Auxiliares

### `useRequireAuth()`

Protege rutas que requieren autenticación. Redirige a `/login` si el usuario no está autenticado.

```tsx
import { useRequireAuth } from '@/hooks/useAuth';

function ProtectedPage() {
  const { user } = useRequireAuth();
  
  // Si llegamos aquí, el usuario está autenticado
  return <div>Contenido protegido para {user.firstName}</div>;
}
```

### `useRequireAdmin()`

Protege rutas que requieren rol de administrador. Redirige a `/unauthorized` si el usuario no es admin.

```tsx
import { useRequireAdmin } from '@/hooks/useAuth';

function AdminPage() {
  const { user } = useRequireAdmin();
  
  // Si llegamos aquí, el usuario es admin
  return <div>Panel de administración</div>;
}
```

## Ejemplos Completos

### Página de Login

```tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const { login, isLoggingIn, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login({ email, password });
      // Redirige automáticamente a /dashboard
    } catch (err) {
      // El error se maneja automáticamente en el estado
      console.error('Error de login:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Iniciar Sesión</h1>
      
      {error && (
        <div className="error">
          {error.message}
        </div>
      )}
      
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña"
        required
      />
      
      <Button
        type="submit"
        disabled={isLoggingIn}
      >
        {isLoggingIn ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </Button>
    </form>
  );
}
```

### Componente de Usuario en Header

```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export function UserMenu() {
  const { user, isAuthenticated, logout, isLoggingOut } = useAuth();

  if (!isAuthenticated) {
    return (
      <div>
        <Link href="/login">
          <Button variant="ghost">Iniciar Sesión</Button>
        </Link>
        <Link href="/registro">
          <Button variant="primary">Registrarse</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <span>Hola, {user.firstName}</span>
      <Link href="/dashboard">
        <Button variant="ghost">Mi Cuenta</Button>
      </Link>
      <Button
        variant="ghost"
        onClick={logout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? 'Cerrando...' : 'Cerrar Sesión'}
      </Button>
    </div>
  );
}
```

### Página Protegida

```tsx
'use client';

import { useRequireAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user, isLoading } = useRequireAuth();

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <div>
      <h1>Dashboard de {user.firstName}</h1>
      <p>Email: {user.email}</p>
      <p>Rol: {user.role}</p>
    </div>
  );
}
```

### Página de Admin

```tsx
'use client';

import { useRequireAdmin } from '@/hooks/useAuth';

export default function AdminDashboardPage() {
  const { user, isLoading } = useRequireAdmin();

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <div>
      <h1>Panel de Administración</h1>
      <p>Bienvenido, Admin {user.firstName}</p>
    </div>
  );
}
```

## Integración con React Query

El hook utiliza React Query para gestionar el estado del servidor:

- **Query Key**: `['auth', 'user']`
- **Stale Time**: 5 minutos
- **Cache Time**: 30 minutos
- **Refetch on Window Focus**: Sí
- **Retry**: No (para evitar múltiples intentos fallidos)

## Integración con Zustand

El hook sincroniza automáticamente el estado con el store de Zustand:

```typescript
// El estado se sincroniza automáticamente
const { user, isAuthenticated } = useAuthStore();
```

## Manejo de Errores

El hook maneja automáticamente los errores de autenticación:

```typescript
const { error } = useAuth();

if (error) {
  switch (error.code) {
    case 'invalid-credentials':
      // Mostrar mensaje de credenciales inválidas
      break;
    case 'rate-limit-exceeded':
      // Mostrar mensaje de demasiados intentos
      break;
    case 'network-error':
      // Mostrar mensaje de error de red
      break;
    default:
      // Mostrar mensaje genérico
  }
}
```

## Refresh Token Automático

El hook maneja automáticamente el refresh token:

- Si una petición retorna 401, intenta refrescar el token
- Si el refresh falla, redirige a `/login`
- El token se almacena en cookies httpOnly (seguro)

## Notas de Seguridad

- ✅ Los tokens JWT se almacenan en cookies httpOnly
- ✅ El refresh token es automático y transparente
- ✅ Rate limiting implementado en cliente
- ✅ Validación de contraseñas en cliente y servidor
- ✅ Protección CSRF con state en OAuth

## Requisitos

- React 18+
- Next.js 14+
- React Query (TanStack Query) v5+
- Zustand 4+

## Ver También

- [AuthService](../services/auth.service.README.md) - Servicio de autenticación
- [Auth Types](../types/auth.types.ts) - Tipos TypeScript
- [Auth Store](../store/auth.store.ts) - Store de Zustand
