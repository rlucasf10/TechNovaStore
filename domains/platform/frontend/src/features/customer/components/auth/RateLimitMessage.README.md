# RateLimitMessage Component

Componente que muestra un mensaje de rate limiting con countdown timer visual cuando el usuario excede el límite de intentos de login o solicitudes de recuperación de contraseña.

## Características

- ✅ Countdown timer en tiempo real con formato MM:SS
- ✅ Barra de progreso visual animada
- ✅ Mensajes claros y específicos según el tipo de acción
- ✅ Animación de entrada suave
- ✅ Icono de advertencia con animación de pulso
- ✅ Mensaje de ayuda explicativo
- ✅ Accesibilidad completa (ARIA labels, roles)
- ✅ Responsive design

## Uso

```tsx
import { RateLimitMessage } from '@/components/auth';

function LoginPage() {
  const [rateLimitTime, setRateLimitTime] = useState<number | null>(null);

  return (
    <div>
      {rateLimitTime && (
        <RateLimitMessage
          remainingTime={rateLimitTime}
          action="login"
          onExpire={() => setRateLimitTime(null)}
        />
      )}
    </div>
  );
}
```

## Props

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `remainingTime` | `number` | ✅ | Tiempo restante en segundos |
| `action` | `'login' \| 'forgotPassword'` | ✅ | Tipo de acción limitada |
| `onExpire` | `() => void` | ❌ | Callback cuando el tiempo expira |
| `className` | `string` | ❌ | Clase CSS adicional |

## Tipos de Acción

### Login (`action="login"`)

- **Límite**: 5 intentos fallidos
- **Ventana**: 15 minutos
- **Bloqueo**: 15 minutos
- **Mensaje**: "Demasiados intentos de inicio de sesión. Por seguridad, tu cuenta ha sido bloqueada temporalmente."

### Forgot Password (`action="forgotPassword"`)

- **Límite**: 3 solicitudes
- **Ventana**: 1 hora
- **Bloqueo**: 1 hora
- **Mensaje**: "Has excedido el límite de solicitudes de recuperación de contraseña. Por favor, espera antes de intentar nuevamente."

## Integración con AuthService

El componente se integra automáticamente con el sistema de rate limiting del `authService`:

```typescript
// En auth.service.ts
const RATE_LIMIT_CONFIG = {
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutos
    blockDurationMs: 15 * 60 * 1000,
  },
  forgotPassword: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hora
    blockDurationMs: 60 * 60 * 1000,
  },
};
```

## Ejemplo Completo

```tsx
'use client';

import { useState } from 'react';
import { RateLimitMessage } from '@/components/auth';
import { authService } from '@/services/auth.service';
import type { AuthError } from '@/types/auth.types';

export default function LoginPage() {
  const [rateLimitTime, setRateLimitTime] = useState<number | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleLogin = async (credentials) => {
    try {
      setAuthError(null);
      setRateLimitTime(null);
      
      await authService.login(credentials);
    } catch (error) {
      const authError = error as AuthError;
      
      if (authError.code === 'rate-limit-exceeded') {
        // Extraer tiempo restante del mensaje
        const match = authError.message.match(/(\d+)\s+segundos?/);
        if (match) {
          setRateLimitTime(parseInt(match[1], 10));
        } else {
          setRateLimitTime(15 * 60); // 15 minutos por defecto
        }
      } else {
        setAuthError(authError.message);
      }
    }
  };

  return (
    <div>
      {/* Mostrar rate limit message si está bloqueado */}
      {rateLimitTime && (
        <RateLimitMessage
          remainingTime={rateLimitTime}
          action="login"
          onExpire={() => setRateLimitTime(null)}
        />
      )}

      {/* Mostrar error solo si no hay rate limit */}
      {authError && !rateLimitTime && (
        <div className="error-message">{authError}</div>
      )}

      {/* Formulario deshabilitado si hay rate limit */}
      <form onSubmit={handleLogin}>
        <button type="submit" disabled={!!rateLimitTime}>
          Iniciar sesión
        </button>
      </form>
    </div>
  );
}
```

## Accesibilidad

El componente implementa las siguientes características de accesibilidad:

- **ARIA roles**: `role="alert"` para el contenedor principal
- **ARIA live regions**: `aria-live="polite"` para actualizaciones dinámicas
- **ARIA labels**: Labels descriptivos para el countdown y la barra de progreso
- **ARIA progressbar**: Atributos `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- **Iconos decorativos**: `aria-hidden="true"` en iconos SVG
- **Texto alternativo**: Labels descriptivos para lectores de pantalla

## Diseño Visual

### Colores

- **Fondo**: Gradiente de amber-50 a orange-50
- **Borde**: amber-300 (2px)
- **Icono**: amber-600 con fondo amber-100
- **Texto**: amber-900 (título), amber-800 (descripción)
- **Countdown**: amber-600 (texto grande y bold)
- **Barra de progreso**: Gradiente de amber-500 a orange-500

### Animaciones

- **Entrada**: `fade-in-down` (0.5s ease-out)
- **Icono**: `pulse` (animación continua)
- **Barra de progreso**: Transición suave (1s linear)

### Responsive

- **Móvil**: Padding reducido, texto más pequeño
- **Desktop**: Padding completo, texto estándar

## Requisitos

- **Requisito 23.10**: Implementar rate limiting en frontend
  - ✅ Contador de intentos fallidos de login
  - ✅ Mensaje después de 5 intentos
  - ✅ Cooldown visual con countdown timer
  - ✅ Limitar solicitudes de recuperación de contraseña

## Testing

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { RateLimitMessage } from './RateLimitMessage';

describe('RateLimitMessage', () => {
  it('muestra el tiempo restante correctamente', () => {
    render(
      <RateLimitMessage
        remainingTime={900} // 15 minutos
        action="login"
      />
    );
    
    expect(screen.getByText('15:00')).toBeInTheDocument();
  });

  it('llama a onExpire cuando el tiempo llega a 0', async () => {
    const onExpire = jest.fn();
    
    render(
      <RateLimitMessage
        remainingTime={1}
        action="login"
        onExpire={onExpire}
      />
    );
    
    await waitFor(() => {
      expect(onExpire).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('muestra mensaje específico para login', () => {
    render(
      <RateLimitMessage
        remainingTime={900}
        action="login"
      />
    );
    
    expect(screen.getByText(/cuenta bloqueada temporalmente/i)).toBeInTheDocument();
  });

  it('muestra mensaje específico para forgot password', () => {
    render(
      <RateLimitMessage
        remainingTime={3600}
        action="forgotPassword"
      />
    );
    
    expect(screen.getByText(/límite de solicitudes alcanzado/i)).toBeInTheDocument();
  });
});
```

## Notas de Implementación

1. **Persistencia**: El rate limiting se almacena en `localStorage` para persistir entre recargas de página
2. **Sincronización**: El countdown se actualiza cada segundo usando `setInterval`
3. **Limpieza**: El intervalo se limpia automáticamente cuando el componente se desmonta o el tiempo expira
4. **Seguridad**: El rate limiting es solo en cliente; el backend debe implementar su propia validación
5. **UX**: El formulario se deshabilita automáticamente cuando hay rate limiting activo

## Mejoras Futuras

- [ ] Agregar sonido de notificación cuando el tiempo expira
- [ ] Permitir configurar límites personalizados por props
- [ ] Agregar opción de "Contactar soporte" para casos urgentes
- [ ] Implementar sincronización con rate limiting del backend
- [ ] Agregar analytics para rastrear bloqueos frecuentes
