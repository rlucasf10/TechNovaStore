# Hook useRateLimit

Sistema completo de rate limiting para el frontend de TechNovaStore.

## Descripción

El hook `useRateLimit` proporciona una solución completa para manejar límites de intentos en acciones sensibles como login, recuperación de contraseña, registro, etc. Incluye persistencia en localStorage, countdown timers automáticos y integración con componentes visuales.

## Características

- ✅ **Verificación de límites en tiempo real**
- ✅ **Countdown timer automático**
- ✅ **Persistencia en localStorage**
- ✅ **Configuraciones predefinidas**
- ✅ **Callbacks para eventos**
- ✅ **Integración con componentes visuales**
- ✅ **Hooks especializados**

## Configuraciones Predefinidas

```typescript
export const RATE_LIMIT_CONFIGS = {
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutos
    blockDurationMs: 15 * 60 * 1000, // 15 minutos
  },
  forgotPassword: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hora
    blockDurationMs: 60 * 60 * 1000, // 1 hora
  },
  register: {
    maxAttempts: 3,
    windowMs: 10 * 60 * 1000, // 10 minutos
    blockDurationMs: 10 * 60 * 1000, // 10 minutos
  },
  changePassword: {
    maxAttempts: 5,
    windowMs: 30 * 60 * 1000, // 30 minutos
    blockDurationMs: 30 * 60 * 1000, // 30 minutos
  },
};
```

## Uso Básico

### Hook General

```typescript
import { useRateLimit, RATE_LIMIT_CONFIGS } from '@/hooks/useRateLimit';

function LoginForm() {
  const rateLimit = useRateLimit('login', {
    config: RATE_LIMIT_CONFIGS.login,
    onExpire: () => {
      console.log('Rate limit expired');
    },
    onLimitReached: (remainingTime) => {
      console.log(`Blocked for ${remainingTime} seconds`);
    },
  });

  const handleSubmit = async (data) => {
    // Verificar antes de proceder
    const { allowed } = rateLimit.checkLimit();
    if (!allowed) {
      return; // Usuario bloqueado
    }

    try {
      await authService.login(data);
      rateLimit.reset(); // Resetear en caso de éxito
    } catch (error) {
      rateLimit.recordAttempt(); // Registrar intento fallido
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Mostrar mensaje de rate limiting */}
      {rateLimit.isBlocked && (
        <RateLimitMessage
          remainingTime={rateLimit.remainingTime}
          action="login"
        />
      )}
      
      <button 
        type="submit" 
        disabled={rateLimit.isBlocked}
      >
        Iniciar Sesión
      </button>
    </form>
  );
}
```

### Hooks Especializados

```typescript
import { useLoginRateLimit, useForgotPasswordRateLimit } from '@/hooks/useRateLimit';

// Para login
const loginRateLimit = useLoginRateLimit({
  onExpire: () => setShowRateLimit(false),
});

// Para recuperación de contraseña
const forgotPasswordRateLimit = useForgotPasswordRateLimit({
  onLimitReached: (time) => setRateLimitTime(time),
});
```

## API del Hook

### Parámetros

```typescript
interface UseRateLimitOptions {
  config: RateLimitConfig;
  onExpire?: () => void;
  onAttempt?: (attempts: number) => void;
  onLimitReached?: (remainingTime: number) => void;
}
```

### Retorno

```typescript
interface UseRateLimitReturn {
  isBlocked: boolean;
  remainingTime: number;
  attempts: number;
  checkLimit: () => { allowed: boolean; remainingTime?: number };
  recordAttempt: () => void;
  reset: () => void;
  getState: () => RateLimitState;
}
```

## Componentes Relacionados

### RateLimitMessage

Componente visual para mostrar el estado de bloqueo con countdown timer.

```typescript
import { RateLimitMessage } from '@/components/auth';

<RateLimitMessage
  remainingTime={rateLimit.remainingTime}
  action="login"
  onExpire={() => {
    // Opcional: callback cuando expira
  }}
/>
```

### RateLimitStatus

Componente para mostrar el estado de múltiples acciones (útil en dashboard).

```typescript
import { RateLimitStatus } from '@/components/auth';

<RateLimitStatus
  actions={['login', 'forgotPassword']}
  allowReset={false} // true solo para admins
/>
```

### RateLimitDashboard

Dashboard completo para administradores.

```typescript
import { RateLimitDashboard } from '@/components/admin';

<RateLimitDashboard />
```

## Integración con AuthService

El sistema está integrado con el `authService` existente:

```typescript
// En authService.ts
class RateLimiter {
  checkLimit(action: string): { allowed: boolean; remainingTime?: number }
  recordAttempt(action: string): void
  reset(action: string): void
}

// Uso en métodos del servicio
async login(credentials: LoginCredentials): Promise<User> {
  const limitCheck = rateLimiter.checkLimit('login');
  if (!limitCheck.allowed) {
    throw {
      code: 'rate-limit-exceeded',
      message: `Demasiados intentos. Intenta en ${limitCheck.remainingTime} segundos.`,
    } as AuthError;
  }

  try {
    const response = await authAxios.post(AUTH_ENDPOINTS.login, credentials);
    rateLimiter.reset('login'); // Éxito
    return response.data.data.user;
  } catch (error) {
    rateLimiter.recordAttempt('login'); // Fallo
    throw handleAuthError(error);
  }
}
```

## Persistencia

Los datos se almacenan en `localStorage` con las siguientes claves:

- `rate_limit_login`
- `rate_limit_forgotPassword`
- `rate_limit_register`
- `rate_limit_changePassword`

### Estructura de Datos

```typescript
interface RateLimitState {
  attempts: number;
  lastAttempt: number;
  blockedUntil?: number;
}
```

## Seguridad

### Medidas Implementadas

1. **Límites Progresivos**: Diferentes límites según la acción
2. **Ventanas de Tiempo**: Los intentos se resetean después de un período
3. **Bloqueo Temporal**: Bloqueo automático al exceder límites
4. **Persistencia Local**: Los límites persisten entre sesiones
5. **Validación Doble**: Verificación en frontend y backend

### Configuraciones de Seguridad

| Acción | Max Intentos | Ventana | Bloqueo |
|--------|-------------|---------|---------|
| Login | 5 | 15 min | 15 min |
| Forgot Password | 3 | 1 hora | 1 hora |
| Register | 3 | 10 min | 10 min |
| Change Password | 5 | 30 min | 30 min |

## Casos de Uso

### 1. Página de Login

```typescript
const rateLimit = useLoginRateLimit({
  onLimitReached: () => {
    // Mostrar mensaje de seguridad
    setShowSecurityMessage(true);
  },
});

const handleLogin = async (credentials) => {
  const { allowed } = rateLimit.checkLimit();
  if (!allowed) return;

  try {
    await authService.login(credentials);
    rateLimit.reset();
    router.push('/dashboard');
  } catch (error) {
    rateLimit.recordAttempt();
    setError(error.message);
  }
};
```

### 2. Recuperación de Contraseña

```typescript
const rateLimit = useForgotPasswordRateLimit();

const handleForgotPassword = async (email) => {
  const { allowed } = rateLimit.checkLimit();
  if (!allowed) return;

  try {
    await authService.forgotPassword({ email });
    setSuccess(true);
  } catch (error) {
    rateLimit.recordAttempt();
    setError('Error al enviar email');
  }
};
```

### 3. Dashboard de Usuario

```typescript
function UserSecuritySettings() {
  return (
    <div>
      <h3>Estado de Seguridad</h3>
      <RateLimitStatus
        actions={['login', 'forgotPassword']}
        allowReset={false}
      />
    </div>
  );
}
```

### 4. Dashboard de Admin

```typescript
function AdminSecurityDashboard() {
  return (
    <div>
      <h2>Monitoreo de Seguridad</h2>
      <RateLimitDashboard />
    </div>
  );
}
```

## Testing

### Pruebas Unitarias

```typescript
import { renderHook, act } from '@testing-library/react';
import { useRateLimit, RATE_LIMIT_CONFIGS } from '@/hooks/useRateLimit';

describe('useRateLimit', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should allow attempts within limit', () => {
    const { result } = renderHook(() =>
      useRateLimit('test', { config: RATE_LIMIT_CONFIGS.login })
    );

    const { allowed } = result.current.checkLimit();
    expect(allowed).toBe(true);
    expect(result.current.isBlocked).toBe(false);
  });

  it('should block after max attempts', () => {
    const { result } = renderHook(() =>
      useRateLimit('test', { config: RATE_LIMIT_CONFIGS.login })
    );

    // Registrar 5 intentos (límite)
    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current.recordAttempt();
      }
    });

    expect(result.current.isBlocked).toBe(true);
    expect(result.current.remainingTime).toBeGreaterThan(0);
  });

  it('should reset attempts', () => {
    const { result } = renderHook(() =>
      useRateLimit('test', { config: RATE_LIMIT_CONFIGS.login })
    );

    act(() => {
      result.current.recordAttempt();
      result.current.reset();
    });

    expect(result.current.attempts).toBe(0);
    expect(result.current.isBlocked).toBe(false);
  });
});
```

## Troubleshooting

### Problemas Comunes

1. **Rate limit no se resetea**
   - Verificar que se llame `rateLimit.reset()` en caso de éxito
   - Revisar configuración de `windowMs`

2. **Countdown no funciona**
   - Verificar que el componente no se desmonte
   - Revisar que `remainingTime` sea mayor a 0

3. **Persistencia no funciona**
   - Verificar que localStorage esté disponible
   - Revisar permisos del navegador

### Debug

```typescript
// Habilitar logs de debug
const rateLimit = useRateLimit('login', {
  config: RATE_LIMIT_CONFIGS.login,
  onAttempt: (attempts) => console.log('Attempts:', attempts),
  onLimitReached: (time) => console.log('Blocked for:', time),
  onExpire: () => console.log('Rate limit expired'),
});

// Ver estado actual
console.log('Rate limit state:', rateLimit.getState());
```

## Requisitos Cumplidos

✅ **23.10**: Implementar rate limiting en frontend
- ✅ Contador de intentos fallidos de login
- ✅ Mensaje después de 5 intentos: "Demasiados intentos. Intenta en 15 minutos"
- ✅ Cooldown visual con countdown timer
- ✅ Limitar solicitudes de recuperación de contraseña

## Archivos Relacionados

- `frontend/src/hooks/useRateLimit.ts` - Hook principal
- `frontend/src/components/auth/RateLimitMessage.tsx` - Componente visual
- `frontend/src/components/auth/RateLimitStatus.tsx` - Estado de múltiples acciones
- `frontend/src/components/admin/RateLimitDashboard.tsx` - Dashboard de admin
- `frontend/src/services/auth.service.ts` - Integración con backend
- `frontend/src/app/login/page.tsx` - Implementación en login
- `frontend/src/app/recuperar-contrasena/page.tsx` - Implementación en recuperación