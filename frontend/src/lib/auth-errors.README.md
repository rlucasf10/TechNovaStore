# Sistema de Manejo de Errores de Autenticación

Sistema completo y centralizado para el manejo de errores de autenticación en TechNovaStore.

## 📋 Resumen

Este sistema proporciona:

- ✅ **Diccionario completo** de mensajes de error en español
- ✅ **Componentes reutilizables** para mostrar errores
- ✅ **Hooks personalizados** para manejo de errores
- ✅ **Mapeo automático** de errores de API a mensajes amigables
- ✅ **Accesibilidad completa** (WCAG 2.1 AA)
- ✅ **TypeScript** con tipos seguros
- ✅ **Testing** incluido

## 🗂️ Archivos Creados

### Librería de Errores
- `frontend/src/lib/auth-errors.ts` - Diccionario y utilidades de errores
- `frontend/src/lib/__tests__/auth-errors.test.ts` - Tests unitarios

### Componentes UI
- `frontend/src/components/ui/ErrorMessage.tsx` - Componentes de error
- `frontend/src/components/ui/ErrorMessage.README.md` - Documentación
- `frontend/src/components/ui/ErrorMessage.examples.tsx` - Ejemplos de uso

### Hooks
- `frontend/src/hooks/useAuthErrors.ts` - Hook de manejo de errores

### Ejemplos
- `frontend/src/components/auth/LoginFormWithErrors.example.tsx` - Ejemplo completo

## 🚀 Uso Rápido

### 1. Formulario Básico con Errores

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/lib/auth-schemas';
import { useAuthErrors } from '@/hooks/useAuthErrors';
import { Input, Button, AlertBox } from '@/components/ui';
import { authService } from '@/services/auth.service';

function LoginForm() {
  const { errors, handleApiError, clearErrors } = useAuthErrors();
  const { register, handleSubmit, formState: { errors: formErrors } } = useForm({
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
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Error general */}
      {errors.general && (
        <AlertBox message={errors.general} variant="error" />
      )}

      {/* Campos con errores */}
      <Input 
        {...register('email')}
        error={errors.fields.email || formErrors.email?.message}
      />
      
      <Input 
        {...register('password')}
        variant="password"
        error={errors.fields.password || formErrors.password?.message}
      />

      <Button type="submit">Iniciar Sesión</Button>
    </form>
  );
}
```

### 2. Mostrar Errores Simples

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
```

### 3. Alertas Destacadas

```tsx
import { AlertBox } from '@/components/ui';

<AlertBox 
  title="Error de autenticación"
  message="Tus credenciales son incorrectas"
  variant="error"
  dismissible
  onDismiss={() => setShowAlert(false)}
/>
```

## 📚 Componentes

### ErrorMessage

Componente básico para mensajes de error inline.

**Props:**
- `message` (string, requerido) - Mensaje a mostrar
- `variant` ('error' | 'warning' | 'info') - Tipo de mensaje
- `size` ('sm' | 'md' | 'lg') - Tamaño
- `showIcon` (boolean) - Mostrar icono
- `action` (objeto) - Acción opcional

### FormFieldError

Componente especializado para errores de campos de formulario.

**Props:**
- `error` (string) - Mensaje de error
- `fieldId` (string, requerido) - ID del campo

### AlertBox

Componente para alertas destacadas.

**Props:**
- `title` (string) - Título
- `message` (string, requerido) - Mensaje
- `variant` ('error' | 'warning' | 'info' | 'success') - Tipo
- `dismissible` (boolean) - Permitir cerrar
- `action` (objeto) - Acción opcional

## 🎣 Hooks

### useAuthErrors

Hook principal para manejo de errores.

**Retorna:**
- `errors` - Estado de errores (general y por campo)
- `setGeneralError` - Establecer error general
- `setFieldError` - Establecer error de campo
- `handleApiError` - Procesar error de API
- `clearErrors` - Limpiar todos los errores
- `clearFieldError` - Limpiar error de campo
- `hasErrors` - Verificar si hay errores
- `hasFieldError` - Verificar error de campo

### useFormErrors

Hook especializado para formularios (extiende useAuthErrors).

**Adicional:**
- `getFieldError` - Obtener error de campo
- `setFieldErrors` - Establecer múltiples errores

## 🔤 Códigos de Error

### Errores de Validación
- `invalid-email` - Email no registrado
- `invalid-credentials` - Credenciales incorrectas
- `email-already-exists` - Email ya registrado

### Errores de Contraseña
- `weak-password` - Contraseña débil
- `passwords-dont-match` - Contraseñas no coinciden

### Errores de Token
- `invalid-token` - Token inválido
- `token-expired` - Token expirado

### Errores de Sistema
- `network-error` - Error de conexión
- `server-error` - Error del servidor
- `rate-limit-exceeded` - Demasiados intentos

### Errores de OAuth
- `oauth-cancelled` - OAuth cancelado
- `oauth-failed` - OAuth fallido
- `method-already-linked` - Método ya vinculado
- `cannot-unlink-only-method` - No se puede desvincular único método

### Errores de Autorización
- `unauthorized` - Sin permisos

## 🎨 Variantes Visuales

### Error (Rojo)
```tsx
<ErrorMessage message="Error" variant="error" />
<AlertBox message="Error" variant="error" />
```

### Advertencia (Amarillo)
```tsx
<ErrorMessage message="Advertencia" variant="warning" />
<AlertBox message="Advertencia" variant="warning" />
```

### Información (Azul)
```tsx
<ErrorMessage message="Info" variant="info" />
<AlertBox message="Info" variant="info" />
```

### Éxito (Verde)
```tsx
<AlertBox message="Éxito" variant="success" />
```

## ♿ Accesibilidad

Todos los componentes incluyen:

- ✅ `role="alert"` para lectores de pantalla
- ✅ `aria-live="polite"` para anunciar cambios
- ✅ `aria-describedby` para asociar errores con campos
- ✅ Iconos con `aria-hidden="true"`
- ✅ Contraste de color WCAG 2.1 AA
- ✅ Navegación por teclado completa

## 🧪 Testing

```bash
# Ejecutar tests
npm test auth-errors.test.ts
```

Ejemplo de test:

```tsx
import { render, screen } from '@testing-library/react';
import { ErrorMessage } from '@/components/ui';

test('muestra mensaje de error', () => {
  render(<ErrorMessage message="Error de prueba" />);
  expect(screen.getByText('Error de prueba')).toBeInTheDocument();
});
```

## 📖 Ejemplos Completos

Ver archivos de ejemplo:
- `ErrorMessage.examples.tsx` - Todos los componentes
- `LoginFormWithErrors.example.tsx` - Integración completa

## 🔧 Integración con Backend

El sistema mapea automáticamente respuestas de API:

```typescript
// Backend responde con:
{
  "code": "invalid-credentials",
  "message": "Invalid email or password",
  "field": "email"
}

// Frontend muestra:
"Email o contraseña incorrectos"
```

### Mapeo de Códigos HTTP

- `400` → `invalid-credentials` (login) o `email-already-exists` (registro)
- `401` → `invalid-credentials`
- `403` → `unauthorized`
- `404` → `invalid-email`
- `409` → `email-already-exists`
- `410` → `token-expired`
- `422` → `weak-password`
- `429` → `rate-limit-exceeded`
- `500+` → `server-error`

## 🌐 Internacionalización

Todos los mensajes están en español. Para agregar otros idiomas:

1. Crear `auth-errors.en.ts` con mensajes en inglés
2. Usar i18n para seleccionar el diccionario correcto
3. Actualizar `getAuthErrorMessage` para usar el idioma activo

## 📝 Mensajes Adicionales

### Mensajes de Éxito
```typescript
import { authSuccessMessages } from '@/lib/auth-errors';

authSuccessMessages.login // "¡Bienvenido de nuevo!"
authSuccessMessages.register // "¡Cuenta creada exitosamente!"
```

### Mensajes de Advertencia
```typescript
import { authWarningMessages } from '@/lib/auth-errors';

authWarningMessages.emailNotVerified
authWarningMessages.weakPassword
```

### Mensajes Informativos
```typescript
import { authInfoMessages } from '@/lib/auth-errors';

authInfoMessages.passwordRequirements
authInfoMessages.tokenExpiration
```

## 🎯 Mejores Prácticas

1. **Siempre limpiar errores** antes de un nuevo submit
2. **Usar errores de campo** para validación específica
3. **Usar errores generales** para errores de API
4. **Agregar acciones** cuando sea apropiado (ej: "¿Olvidaste tu contraseña?")
5. **Hacer dismissible** las alertas cuando sea posible
6. **Mantener mensajes cortos** y accionables

## 🔗 Referencias

- [Requisito 23.9](../../.kiro/specs/frontend-redesign-spectacular/requirements.md#requisito-23)
- [Tarea 9.5.4](../../.kiro/specs/frontend-redesign-spectacular/tasks.md#fase-3)
- [Diseño de Autenticación](../../.kiro/specs/frontend-redesign-spectacular/design.md#0-sistema-de-autenticación)

## ✅ Checklist de Implementación

- [x] Diccionario de mensajes de error
- [x] Componente ErrorMessage
- [x] Componente FormFieldError
- [x] Componente AlertBox
- [x] Hook useAuthErrors
- [x] Hook useFormErrors
- [x] Utilidades de mapeo de errores
- [x] Exportación en index.ts
- [x] Documentación completa
- [x] Ejemplos de uso
- [x] Tests unitarios
- [x] Accesibilidad WCAG 2.1 AA
- [x] TypeScript sin errores
