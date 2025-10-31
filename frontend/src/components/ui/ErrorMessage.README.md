# ErrorMessage Component

Sistema completo de manejo de errores de autenticación para TechNovaStore.

## Componentes

### ErrorMessage

Componente básico para mostrar mensajes de error, advertencia o información.

```tsx
import { ErrorMessage } from '@/components/ui';

// Error simple
<ErrorMessage message="El email es requerido" />

// Error con acción
<ErrorMessage 
  message="Este email ya está registrado" 
  action={{ 
    label: 'Iniciar sesión', 
    onClick: () => router.push('/login') 
  }}
/>

// Advertencia
<ErrorMessage 
  message="Tu sesión expirará pronto" 
  variant="warning"
/>

// Información
<ErrorMessage 
  message="Revisa tu email para confirmar tu cuenta" 
  variant="info"
/>
```

### FormFieldError

Componente especializado para errores de campos de formulario.

```tsx
import { FormFieldError } from '@/components/ui';

<Input 
  id="email" 
  label="Email"
  error={errors.email?.message}
/>
<FormFieldError 
  error={errors.email?.message} 
  fieldId="email" 
/>
```

### AlertBox

Componente para alertas destacadas que requieren más atención.

```tsx
import { AlertBox } from '@/components/ui';

<AlertBox 
  title="Error de autenticación"
  message="Tus credenciales son incorrectas. Verifica tu email y contraseña."
  variant="error"
  dismissible
  onDismiss={() => setShowAlert(false)}
/>

<AlertBox 
  title="Cuenta creada"
  message="Tu cuenta ha sido creada exitosamente. Revisa tu email para verificarla."
  variant="success"
  action={{
    label: 'Ir al dashboard',
    onClick: () => router.push('/dashboard')
  }}
/>
```

## Props

### ErrorMessage Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `message` | `string` | - | Mensaje de error a mostrar (requerido) |
| `variant` | `'error' \| 'warning' \| 'info'` | `'error'` | Tipo de mensaje |
| `size` | `'sm' \| 'md' \| 'lg'` | `'sm'` | Tamaño del mensaje |
| `showIcon` | `boolean` | `true` | Mostrar icono de alerta |
| `icon` | `ReactNode` | - | Icono personalizado |
| `className` | `string` | - | Clase CSS adicional |
| `id` | `string` | - | ID del elemento (para aria-describedby) |
| `action` | `{ label: string; onClick: () => void }` | - | Acción opcional |

### FormFieldError Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `error` | `string` | - | Mensaje de error |
| `fieldId` | `string` | - | ID del campo (requerido) |
| `className` | `string` | - | Clase CSS adicional |

### AlertBox Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `title` | `string` | - | Título del alert |
| `message` | `string` | - | Mensaje del alert (requerido) |
| `variant` | `'error' \| 'warning' \| 'info' \| 'success'` | `'error'` | Tipo de alert |
| `showIcon` | `boolean` | `true` | Mostrar icono |
| `dismissible` | `boolean` | `false` | Permitir cerrar el alert |
| `onDismiss` | `() => void` | - | Callback al cerrar |
| `className` | `string` | - | Clase CSS adicional |
| `action` | `{ label: string; onClick: () => void }` | - | Acción opcional |

## Hooks

### useAuthErrors

Hook para manejo centralizado de errores de autenticación.

```tsx
import { useAuthErrors } from '@/hooks/useAuthErrors';

function LoginForm() {
  const { errors, handleApiError, clearErrors } = useAuthErrors();

  const handleSubmit = async (data) => {
    clearErrors();
    try {
      await authService.login(data);
    } catch (error) {
      handleApiError(error, '/api/auth/login');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Error general */}
      {errors.general && (
        <AlertBox message={errors.general} variant="error" />
      )}

      {/* Error de campo */}
      <Input 
        name="email"
        error={errors.fields.email}
      />
      
      <Input 
        name="password"
        error={errors.fields.password}
      />
    </form>
  );
}
```

### useFormErrors

Hook especializado para formularios con react-hook-form.

```tsx
import { useFormErrors } from '@/hooks/useAuthErrors';
import { useForm } from 'react-hook-form';

function RegisterForm() {
  const { 
    errors: apiErrors, 
    getFieldError, 
    handleApiError 
  } = useFormErrors();
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await authService.register(data);
    } catch (error) {
      handleApiError(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input 
        {...register('email')}
        error={getFieldError('email') || errors.email?.message}
      />
    </form>
  );
}
```

## Diccionario de Errores

El sistema incluye un diccionario completo de mensajes de error en español:

```tsx
import { 
  authErrorMessages, 
  getAuthErrorMessage,
  authSuccessMessages,
  authWarningMessages 
} from '@/lib/auth-errors';

// Obtener mensaje de error
const message = getAuthErrorMessage('invalid-credentials');
// "Email o contraseña incorrectos"

// Mensaje de éxito
const successMsg = authSuccessMessages.login;
// "¡Bienvenido de nuevo!"

// Mensaje de advertencia
const warningMsg = authWarningMessages.emailNotVerified;
// "Tu email no está verificado. Revisa tu bandeja de entrada"
```

## Códigos de Error Soportados

- `invalid-email`: Email no registrado
- `invalid-credentials`: Credenciales incorrectas
- `email-already-exists`: Email ya registrado
- `weak-password`: Contraseña débil
- `passwords-dont-match`: Contraseñas no coinciden
- `invalid-token`: Token inválido
- `token-expired`: Token expirado
- `network-error`: Error de conexión
- `server-error`: Error del servidor
- `rate-limit-exceeded`: Demasiados intentos
- `oauth-cancelled`: OAuth cancelado
- `oauth-failed`: OAuth fallido
- `method-already-linked`: Método ya vinculado
- `cannot-unlink-only-method`: No se puede desvincular único método
- `unauthorized`: Sin permisos

## Ejemplo Completo

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/lib/auth-schemas';
import { useAuthErrors } from '@/hooks/useAuthErrors';
import { Input, Button, AlertBox } from '@/components/ui';
import { authService } from '@/services/auth.service';

export function LoginForm() {
  const { 
    errors: apiErrors, 
    handleApiError, 
    clearErrors 
  } = useAuthErrors();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    clearErrors();
    try {
      await authService.login(data);
      router.push('/dashboard');
    } catch (error) {
      handleApiError(error, '/api/auth/login');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Error general */}
      {apiErrors.general && (
        <AlertBox 
          message={apiErrors.general} 
          variant="error"
          dismissible
          onDismiss={clearErrors}
        />
      )}

      {/* Campo de email */}
      <Input
        {...register('email')}
        label="Email"
        type="email"
        error={apiErrors.fields.email || errors.email?.message}
        showValidation
      />

      {/* Campo de contraseña */}
      <Input
        {...register('password')}
        label="Contraseña"
        variant="password"
        error={apiErrors.fields.password || errors.password?.message}
      />

      {/* Botón de submit */}
      <Button 
        type="submit" 
        variant="primary" 
        fullWidth
        loading={isSubmitting}
      >
        Iniciar Sesión
      </Button>
    </form>
  );
}
```

## Accesibilidad

Todos los componentes de error incluyen:

- ✅ `role="alert"` para lectores de pantalla
- ✅ `aria-live="polite"` para anunciar cambios
- ✅ `aria-describedby` para asociar errores con campos
- ✅ Iconos con `aria-hidden="true"`
- ✅ Contraste de color WCAG 2.1 AA
- ✅ Navegación por teclado completa

## Estilos

Los componentes usan las variables CSS del sistema de diseño:

```css
/* Colores de error */
--error: #ef4444;
--warning: #f59e0b;
--info: #3b82f6;
--success: #10b981;
```

## Testing

```tsx
import { render, screen } from '@testing-library/react';
import { ErrorMessage } from '@/components/ui';

test('muestra mensaje de error', () => {
  render(<ErrorMessage message="Error de prueba" />);
  expect(screen.getByText('Error de prueba')).toBeInTheDocument();
});

test('muestra icono de error', () => {
  render(<ErrorMessage message="Error" showIcon />);
  expect(screen.getByRole('alert')).toBeInTheDocument();
});
```
