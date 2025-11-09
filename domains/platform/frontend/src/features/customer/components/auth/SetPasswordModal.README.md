# SetPasswordModal

Modal para establecer contraseña para usuarios OAuth (Google, GitHub).

## Descripción

El componente `SetPasswordModal` permite a usuarios que se registraron con OAuth (Google, GitHub) establecer una contraseña local para tener múltiples métodos de autenticación. Esto aumenta la seguridad de la cuenta y permite iniciar sesión incluso si uno de los métodos no está disponible.

## Características

- ✅ Input de nueva contraseña con `PasswordStrengthIndicator`
- ✅ Input de confirmar contraseña con validación en tiempo real
- ✅ Validación de fortaleza de contraseña (8+ caracteres, mayúscula, minúscula, número, especial)
- ✅ Validación de coincidencia de contraseñas
- ✅ Integración con `POST /api/auth/set-password`
- ✅ Confirmación de éxito con notificación
- ✅ Manejo de errores
- ✅ Loading state durante el envío
- ✅ Información contextual sobre los beneficios de tener múltiples métodos
- ✅ Accesibilidad completa (WCAG 2.1 AA)

## Requisitos

- **24.6**: Permitir a usuarios OAuth establecer una contraseña local
- **24.10**: Mostrar confirmación de éxito al establecer contraseña

## Uso Básico

```tsx
import { useState } from 'react';
import { SetPasswordModal } from '@/components/auth';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Establecer Contraseña
      </button>

      <SetPasswordModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={() => {
          console.log('Contraseña establecida');
          setIsOpen(false);
        }}
      />
    </>
  );
}
```

## Props

| Prop | Tipo | Requerido | Default | Descripción |
|------|------|-----------|---------|-------------|
| `open` | `boolean` | ✅ | - | Controla si el modal está abierto o cerrado |
| `onClose` | `() => void` | ✅ | - | Callback cuando el modal se cierra |
| `onSuccess` | `() => void` | ❌ | - | Callback cuando la contraseña se establece exitosamente |

## Casos de Uso

### 1. Dashboard de Usuario - Sección de Métodos de Autenticación

El caso de uso principal es en la sección "Métodos de Inicio de Sesión" del Dashboard de Usuario, donde se muestra la lista de métodos de autenticación vinculados.

```tsx
function AuthMethodsSection() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, refetch } = useAuth();
  
  const hasPassword = user?.authMethods.some(m => m.type === 'password');

  return (
    <div>
      <h3>Métodos de Inicio de Sesión</h3>
      
      {/* Método de contraseña */}
      <div>
        <span>Contraseña</span>
        {hasPassword ? (
          <button>Cambiar Contraseña</button>
        ) : (
          <button onClick={() => setIsOpen(true)}>
            Establecer Contraseña
          </button>
        )}
      </div>

      <SetPasswordModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={() => {
          refetch(); // Actualizar datos del usuario
          setIsOpen(false);
        }}
      />
    </div>
  );
}
```

### 2. Flujo de "Olvidé mi contraseña"

Cuando un usuario con solo OAuth intenta usar "Olvidé mi contraseña", se le puede ofrecer establecer una contraseña.

```tsx
function ForgotPasswordPage() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  
  const hasPassword = user?.authMethods.some(m => m.type === 'password');
  const oauthProvider = user?.authMethods.find(m => m.type !== 'password')?.type;

  if (!hasPassword && oauthProvider) {
    return (
      <div>
        <p>Tu cuenta usa {oauthProvider} para iniciar sesión.</p>
        <p>¿Quieres establecer una contraseña?</p>
        <button onClick={() => setIsOpen(true)}>
          Establecer Contraseña
        </button>

        <SetPasswordModal
          open={isOpen}
          onClose={() => setIsOpen(false)}
          onSuccess={() => {
            // Redirigir a login o mostrar mensaje de éxito
          }}
        />
      </div>
    );
  }

  // Formulario normal de recuperación de contraseña
  return <ForgotPasswordForm />;
}
```

### 3. Onboarding de Usuario OAuth

Después de que un usuario se registra con OAuth, se le puede sugerir establecer una contraseña.

```tsx
function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [isOpen, setIsOpen] = useState(false);

  if (step === 2) {
    return (
      <div>
        <h2>Aumenta la seguridad de tu cuenta</h2>
        <p>Establece una contraseña para tener múltiples métodos de inicio de sesión.</p>
        
        <button onClick={() => setIsOpen(true)}>
          Establecer Contraseña
        </button>
        <button onClick={() => setStep(3)}>
          Omitir por ahora
        </button>

        <SetPasswordModal
          open={isOpen}
          onClose={() => setIsOpen(false)}
          onSuccess={() => {
            setStep(3);
          }}
        />
      </div>
    );
  }

  // Otros pasos del onboarding...
}
```

## Validaciones

El componente valida:

1. **Contraseña requerida**: No puede estar vacía
2. **Fortaleza de contraseña**: Debe cumplir con:
   - Mínimo 8 caracteres
   - Al menos una mayúscula
   - Al menos una minúscula
   - Al menos un número
   - Al menos un carácter especial
   - No ser una contraseña común
3. **Confirmación requerida**: No puede estar vacía
4. **Coincidencia**: Las contraseñas deben coincidir

Las validaciones se realizan:
- En tiempo real mientras el usuario escribe
- Al enviar el formulario
- En el backend (validación adicional)

## Integración con Backend

El componente se integra con el endpoint:

```
POST /api/auth/set-password
```

**Request Body:**
```json
{
  "password": "MySecureP@ssw0rd",
  "confirmPassword": "MySecureP@ssw0rd"
}
```

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Contraseña establecida exitosamente"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "La contraseña no cumple con los requisitos",
  "field": "password"
}
```

## Notificaciones

El componente muestra notificaciones usando `useNotificationStore`:

**Éxito:**
```
Título: "Contraseña establecida"
Mensaje: "Ahora puedes iniciar sesión con tu email y contraseña."
Tipo: success
```

**Error:**
```
Título: "Error"
Mensaje: "Error al establecer la contraseña. Intenta de nuevo."
Tipo: error
```

## Accesibilidad

El componente cumple con WCAG 2.1 Level AA:

- ✅ Navegación completa por teclado
- ✅ Trap de foco dentro del modal
- ✅ Cierre con tecla ESC
- ✅ Labels descriptivos para todos los inputs
- ✅ Mensajes de error asociados con `aria-describedby`
- ✅ Estados de loading anunciados
- ✅ Contraste de colores adecuado
- ✅ Roles ARIA apropiados

## Dependencias

- `@/components/ui/Modal` - Modal base
- `@/components/ui/Button` - Botones
- `@/components/ui/Input` - Inputs de contraseña
- `@/components/auth/PasswordStrengthIndicator` - Indicador de fortaleza
- `@/services/auth.service` - Servicio de autenticación
- `@/store/notification.store` - Store de notificaciones
- `@/lib/password-validation` - Validación de contraseñas
- `@/types/auth.types` - Tipos TypeScript

## Testing

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SetPasswordModal from './SetPasswordModal';

describe('SetPasswordModal', () => {
  it('should render when open', () => {
    render(<SetPasswordModal open={true} onClose={() => {}} />);
    expect(screen.getByText('Establecer Contraseña')).toBeInTheDocument();
  });

  it('should validate password strength', async () => {
    render(<SetPasswordModal open={true} onClose={() => {}} />);
    
    const passwordInput = screen.getByLabelText('Nueva Contraseña');
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    
    await waitFor(() => {
      expect(screen.getByText(/Débil/i)).toBeInTheDocument();
    });
  });

  it('should validate password match', async () => {
    render(<SetPasswordModal open={true} onClose={() => {}} />);
    
    const passwordInput = screen.getByLabelText('Nueva Contraseña');
    const confirmInput = screen.getByLabelText('Confirmar Contraseña');
    
    fireEvent.change(passwordInput, { target: { value: 'MySecureP@ssw0rd' } });
    fireEvent.change(confirmInput, { target: { value: 'Different123!' } });
    
    await waitFor(() => {
      expect(screen.getByText(/Las contraseñas no coinciden/i)).toBeInTheDocument();
    });
  });

  it('should call onSuccess after successful submission', async () => {
    const onSuccess = jest.fn();
    render(<SetPasswordModal open={true} onClose={() => {}} onSuccess={onSuccess} />);
    
    // Llenar formulario y enviar...
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
```

## Ejemplos

Ver `SetPasswordModal.examples.tsx` para ejemplos completos de uso en diferentes contextos.

## Notas de Implementación

1. **Seguridad**: El componente requiere que el usuario esté autenticado (JWT en cookies httpOnly)
2. **Validación**: Se valida tanto en frontend como en backend
3. **UX**: Se muestra información contextual sobre los beneficios de tener múltiples métodos
4. **Estado**: El formulario se limpia al cerrar el modal
5. **Loading**: Se deshabilitan los inputs y botones durante el envío
6. **Errores**: Se muestran errores específicos por campo cuando es posible

## Relacionado

- `PasswordStrengthIndicator` - Indicador de fortaleza de contraseña
- `AuthMethodsManagement` - Componente de gestión de métodos de autenticación
- `ChangePasswordModal` - Modal para cambiar contraseña existente
- `useAuth` - Hook de autenticación

## Changelog

### v1.0.0 (2025-11-02)
- ✨ Implementación inicial del componente
- ✅ Validación de fortaleza de contraseña
- ✅ Validación de coincidencia en tiempo real
- ✅ Integración con backend
- ✅ Notificaciones de éxito/error
- ✅ Accesibilidad completa
