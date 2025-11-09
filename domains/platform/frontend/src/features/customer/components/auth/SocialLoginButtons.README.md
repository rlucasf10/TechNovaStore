# SocialLoginButtons Component

Componente de botones para autenticación con proveedores OAuth (Google, GitHub).

## Características

- ✅ Botones con logos oficiales de Google y GitHub
- ✅ Loading state durante el proceso de autenticación
- ✅ Manejo de errores con callbacks
- ✅ Integración completa con OAuth 2.0 + PKCE
- ✅ Deshabilitar botones durante carga
- ✅ Accesibilidad (ARIA labels)
- ✅ Diseño responsive

## Uso Básico

```tsx
import { SocialLoginButtons } from '@/components/auth';

function LoginPage() {
  return (
    <div>
      <h1>Iniciar Sesión</h1>
      
      {/* Formulario de email/password */}
      <form>
        {/* ... */}
      </form>
      
      {/* Divider */}
      <div className="my-6 text-center text-gray-500">o</div>
      
      {/* Botones de OAuth */}
      <SocialLoginButtons />
    </div>
  );
}
```

## Props

### `onOAuthStart?: (provider: OAuthProvider) => void`

Callback que se ejecuta cuando se inicia el proceso de autenticación OAuth.

```tsx
<SocialLoginButtons
  onOAuthStart={(provider) => {
    console.log(`Iniciando autenticación con ${provider}`);
  }}
/>
```

### `onError?: (error: Error) => void`

Callback que se ejecuta cuando ocurre un error durante el inicio del flujo OAuth.

```tsx
<SocialLoginButtons
  onError={(error) => {
    console.error('Error de OAuth:', error);
    toast.error('Error al iniciar autenticación');
  }}
/>
```

### `redirectTo?: string`

URL a la que redirigir después de una autenticación exitosa.

```tsx
<SocialLoginButtons
  redirectTo="/dashboard"
/>
```

### `disabled?: boolean`

Deshabilitar todos los botones.

```tsx
<SocialLoginButtons
  disabled={isSubmitting}
/>
```

### `className?: string`

Clase CSS adicional para el contenedor.

```tsx
<SocialLoginButtons
  className="mt-4"
/>
```

## Ejemplos de Uso

### Página de Login

```tsx
'use client';

import { useState } from 'react';
import { SocialLoginButtons } from '@/components/auth';
import { AuthDivider } from '@/components/auth';
import { useNotification } from '@/hooks/useNotification';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { showError } = useNotification();

  const handleOAuthStart = (provider: string) => {
    setIsLoading(true);
    console.log(`Iniciando OAuth con ${provider}`);
  };

  const handleOAuthError = (error: Error) => {
    setIsLoading(false);
    showError('Error al iniciar autenticación');
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Iniciar Sesión</h1>
      
      {/* Formulario de email/password */}
      <form className="space-y-4">
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Contraseña" />
        <button type="submit">Iniciar Sesión</button>
      </form>
      
      {/* Divider */}
      <AuthDivider text="o" />
      
      {/* Botones de OAuth */}
      <SocialLoginButtons
        onOAuthStart={handleOAuthStart}
        onError={handleOAuthError}
        disabled={isLoading}
      />
    </div>
  );
}
```

### Página de Registro

```tsx
'use client';

import { SocialLoginButtons } from '@/components/auth';
import { AuthDivider } from '@/components/auth';

export default function RegisterPage() {
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Crear Cuenta</h1>
      
      {/* Botones de OAuth primero (más rápido) */}
      <SocialLoginButtons redirectTo="/dashboard" />
      
      {/* Divider */}
      <AuthDivider text="o registrarse con email" />
      
      {/* Formulario de registro */}
      <form className="space-y-4">
        <input type="text" placeholder="Nombre" />
        <input type="text" placeholder="Apellido" />
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Contraseña" />
        <button type="submit">Crear Cuenta</button>
      </form>
    </div>
  );
}
```

### Con Manejo de Errores Completo

```tsx
'use client';

import { useState } from 'react';
import { SocialLoginButtons } from '@/components/auth';
import { ErrorMessage } from '@/components/ui';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  const handleOAuthError = (error: Error) => {
    setError(error.message);
  };

  return (
    <div>
      {error && (
        <ErrorMessage
          message={error}
          onClose={() => setError(null)}
        />
      )}
      
      <SocialLoginButtons
        onError={handleOAuthError}
      />
    </div>
  );
}
```

## Flujo de OAuth

1. **Usuario hace clic en botón**: Se muestra loading state
2. **Se genera state y PKCE**: Para seguridad (CSRF + code injection)
3. **Redirección al proveedor**: Google o GitHub
4. **Usuario autoriza**: En la página del proveedor
5. **Callback a la app**: `/auth/callback/{provider}?code=xxx&state=yyy`
6. **Validación y login**: El callback valida y completa el login

## Configuración Requerida

### Variables de Entorno

Crear archivo `.env.local`:

```env
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu-client-id-de-google.apps.googleusercontent.com

# GitHub OAuth
NEXT_PUBLIC_GITHUB_CLIENT_ID=tu-client-id-de-github

# URL de la aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3011
```

### Configuración de Google OAuth

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear un proyecto o seleccionar uno existente
3. Habilitar Google+ API
4. Ir a "Credenciales" → "Crear credenciales" → "ID de cliente de OAuth 2.0"
5. Tipo de aplicación: "Aplicación web"
6. Agregar URI de redirección: `http://localhost:3011/auth/callback/google`
7. Copiar el Client ID

### Configuración de GitHub OAuth

1. Ir a [GitHub Settings](https://github.com/settings/developers)
2. Click en "OAuth Apps" → "New OAuth App"
3. Application name: TechNovaStore
4. Homepage URL: `http://localhost:3011`
5. Authorization callback URL: `http://localhost:3011/auth/callback/github`
6. Copiar el Client ID

## Seguridad

El componente implementa las siguientes medidas de seguridad:

### CSRF Protection (State Parameter)

- Se genera un state aleatorio único por cada intento
- Se guarda en sessionStorage
- Se valida en el callback
- Expira después de 10 minutos

### PKCE (Proof Key for Code Exchange)

- Se genera un code verifier aleatorio (128 caracteres)
- Se calcula el code challenge con SHA-256
- Se envía el challenge en la autorización
- Se envía el verifier en el intercambio de token
- Previene ataques de intercepción de código

### Validaciones

- Verificación de que el proveedor esté configurado
- Timeout de 60 segundos para requests
- Manejo de errores de red
- Validación de respuestas del backend

## Estilos

El componente usa las clases de Tailwind CSS y se adapta al tema de la aplicación:

- Botones con variante `secondary` (fondo blanco, borde)
- Tamaño `lg` para mejor accesibilidad
- Iconos de 20x20px (w-5 h-5)
- Espaciado de 12px (space-y-3) entre botones
- Full width por defecto

## Accesibilidad

- ✅ ARIA labels descriptivos
- ✅ Estados de loading visibles
- ✅ Navegación por teclado
- ✅ Contraste de colores adecuado
- ✅ Iconos con `aria-hidden="true"`

## Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { SocialLoginButtons } from './SocialLoginButtons';

describe('SocialLoginButtons', () => {
  it('renderiza botones de Google y GitHub', () => {
    render(<SocialLoginButtons />);
    
    expect(screen.getByText('Continuar con Google')).toBeInTheDocument();
    expect(screen.getByText('Continuar con GitHub')).toBeInTheDocument();
  });

  it('muestra loading state al hacer clic', async () => {
    const onOAuthStart = jest.fn();
    render(<SocialLoginButtons onOAuthStart={onOAuthStart} />);
    
    const googleButton = screen.getByText('Continuar con Google');
    fireEvent.click(googleButton);
    
    expect(onOAuthStart).toHaveBeenCalledWith('google');
  });

  it('deshabilita botones cuando disabled=true', () => {
    render(<SocialLoginButtons disabled />);
    
    const googleButton = screen.getByText('Continuar con Google');
    expect(googleButton).toBeDisabled();
  });
});
```

## Troubleshooting

### Error: "OAuth provider not configured"

**Causa**: Falta la variable de entorno del proveedor.

**Solución**: Agregar `NEXT_PUBLIC_GOOGLE_CLIENT_ID` o `NEXT_PUBLIC_GITHUB_CLIENT_ID` en `.env.local`.

### Error: "Invalid redirect URI"

**Causa**: La URI de callback no coincide con la configurada en el proveedor.

**Solución**: Verificar que la URI en Google/GitHub Console sea exactamente: `http://localhost:3011/auth/callback/{provider}`

### Los botones no redirigen

**Causa**: Puede ser un error en la configuración de OAuth o en el servicio de autenticación.

**Solución**: 
1. Verificar la consola del navegador para errores
2. Verificar que `authService.oauthLogin()` esté funcionando
3. Verificar que las variables de entorno estén cargadas

## Relacionado

- [AuthService](../../services/auth.service.ts) - Servicio de autenticación
- [OAuth Config](../../lib/oauth.config.ts) - Configuración de OAuth
- [Auth Types](../../types/auth.types.ts) - Tipos de autenticación
- [Button Component](../ui/Button.tsx) - Componente de botón base
- [Loading Component](../ui/Loading.tsx) - Componente de loading
