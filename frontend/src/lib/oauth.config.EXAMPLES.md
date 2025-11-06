# Ejemplos de Uso - OAuth Configuration

Este documento contiene ejemplos prácticos de cómo usar la configuración de OAuth en diferentes escenarios.

## Ejemplo 1: Botón de Login con Google

```tsx
// components/auth/SocialLoginButtons.tsx
'use client';

import { useState } from 'react';
import { authService } from '@/services/auth.service';
import { isOAuthProviderConfigured } from '@/lib/oauth.config';
import { Button } from '@/components/ui/Button';

export function SocialLoginButtons() {
  const [isLoading, setIsLoading] = useState<'google' | 'github' | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading('google');
      await authService.oauthLogin('google', '/dashboard');
      // La redirección ocurre automáticamente
    } catch (error) {
      console.error('Error al iniciar login con Google:', error);
      setIsLoading(null);
      // Mostrar mensaje de error al usuario
    }
  };

  const handleGitHubLogin = async () => {
    try {
      setIsLoading('github');
      await authService.oauthLogin('github', '/dashboard');
      // La redirección ocurre automáticamente
    } catch (error) {
      console.error('Error al iniciar login con GitHub:', error);
      setIsLoading(null);
      // Mostrar mensaje de error al usuario
    }
  };

  // Verificar si los proveedores están configurados
  const googleConfigured = isOAuthProviderConfigured('google');
  const githubConfigured = isOAuthProviderConfigured('github');

  return (
    <div className="space-y-3">
      {googleConfigured && (
        <Button
          variant="outline"
          onClick={handleGoogleLogin}
          disabled={isLoading !== null}
          className="w-full"
        >
          {isLoading === 'google' ? (
            <span>Cargando...</span>
          ) : (
            <>
              <GoogleIcon className="mr-2 h-5 w-5" />
              Continuar con Google
            </>
          )}
        </Button>
      )}

      {githubConfigured && (
        <Button
          variant="outline"
          onClick={handleGitHubLogin}
          disabled={isLoading !== null}
          className="w-full"
        >
          {isLoading === 'github' ? (
            <span>Cargando...</span>
          ) : (
            <>
              <GitHubIcon className="mr-2 h-5 w-5" />
              Continuar con GitHub
            </>
          )}
        </Button>
      )}

      {!googleConfigured && !githubConfigured && (
        <p className="text-sm text-gray-500 text-center">
          OAuth no configurado. Ver documentación.
        </p>
      )}
    </div>
  );
}
```

## Ejemplo 2: Página de Callback de OAuth

```tsx
// app/auth/callback/google/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { Spinner } from '@/components/ui/Spinner';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Obtener parámetros de la URL
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');

      // Verificar si el usuario canceló
      if (errorParam === 'access_denied') {
        router.push('/login?error=oauth_cancelled');
        return;
      }

      // Verificar que tengamos los parámetros necesarios
      if (!code || !state) {
        router.push('/login?error=oauth_failed');
        return;
      }

      try {
        // Procesar el callback
        const user = await authService.oauthCallback({
          provider: 'google',
          code,
          state,
        });

        console.log('Usuario autenticado:', user);

        // Redirigir al dashboard
        router.push('/dashboard');
      } catch (error: any) {
        console.error('Error en callback de OAuth:', error);
        
        // Manejar diferentes tipos de errores
        if (error.code === 'oauth-failed') {
          setError('Error al autenticar con Google');
        } else if (error.code === 'email-already-exists') {
          setError('Este email ya está registrado. Inicia sesión para vincular Google.');
          setTimeout(() => router.push('/login'), 3000);
        } else {
          setError('Ocurrió un error inesperado');
        }
      }
    };

    handleCallback();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <h2 className="text-xl font-semibold mb-2">Error de Autenticación</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" className="mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          Completando inicio de sesión con Google...
        </h2>
        <p className="text-gray-600">Por favor espera un momento</p>
      </div>
    </div>
  );
}
```

## Ejemplo 3: Página de Login con OAuth

```tsx
// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mostrar mensaje de error de OAuth si existe
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'oauth_cancelled') {
      setError('Autenticación cancelada');
    } else if (errorParam === 'oauth_failed') {
      setError('Error al autenticar con el proveedor');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await authService.login({ email, password });
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          Iniciar Sesión
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            type="password"
            label="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500">o</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        <SocialLoginButtons />

        <div className="mt-6 text-center text-sm">
          <a href="/recuperar-contrasena" className="text-blue-600 hover:underline">
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        <div className="mt-4 text-center text-sm">
          <span className="text-gray-600">¿No tienes cuenta? </span>
          <a href="/registro" className="text-blue-600 hover:underline">
            Regístrate
          </a>
        </div>
      </div>
    </div>
  );
}
```

## Ejemplo 4: Vincular Método OAuth desde Dashboard

```tsx
// components/dashboard/AuthMethodsManagement.tsx
'use client';

import { useState, useEffect } from 'react';
import { authService } from '@/services/auth.service';
import { isOAuthProviderConfigured } from '@/lib/oauth.config';
import { Button } from '@/components/ui/Button';
import { AuthMethod } from '@/types/auth.types';

export function AuthMethodsManagement() {
  const [authMethods, setAuthMethods] = useState<AuthMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuthMethods();
  }, []);

  const loadAuthMethods = async () => {
    try {
      const response = await authService.getAuthMethods();
      setAuthMethods(response.authMethods);
    } catch (error) {
      console.error('Error al cargar métodos de autenticación:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkGoogle = async () => {
    try {
      // Iniciar flujo OAuth para vincular
      await authService.oauthLogin('google', '/dashboard/profile?linked=google');
    } catch (error) {
      console.error('Error al vincular Google:', error);
    }
  };

  const handleLinkGitHub = async () => {
    try {
      await authService.oauthLogin('github', '/dashboard/profile?linked=github');
    } catch (error) {
      console.error('Error al vincular GitHub:', error);
    }
  };

  const handleUnlink = async (type: 'google' | 'github') => {
    if (authMethods.length === 1) {
      alert('No puedes desvincular tu único método de autenticación');
      return;
    }

    if (!confirm(`¿Estás seguro de desvincular ${type}?`)) {
      return;
    }

    try {
      await authService.unlinkAuthMethod({ type });
      await loadAuthMethods();
    } catch (error) {
      console.error('Error al desvincular método:', error);
    }
  };

  const hasMethod = (type: string) => {
    return authMethods.some((method) => method.type === type);
  };

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Métodos de Inicio de Sesión</h3>

      {/* Contraseña */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div>
          <div className="font-medium">
            {hasMethod('password') ? '✓' : '○'} Contraseña
          </div>
          <div className="text-sm text-gray-500">
            {hasMethod('password')
              ? 'Contraseña configurada'
              : 'Sin contraseña configurada'}
          </div>
        </div>
        <Button variant="outline" size="sm">
          {hasMethod('password') ? 'Cambiar' : 'Establecer'}
        </Button>
      </div>

      {/* Google */}
      {isOAuthProviderConfigured('google') && (
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <div className="font-medium">
              {hasMethod('google') ? '✓' : '○'} Google
            </div>
            <div className="text-sm text-gray-500">
              {hasMethod('google')
                ? `Vinculado el ${new Date(
                    authMethods.find((m) => m.type === 'google')?.linkedAt || ''
                  ).toLocaleDateString()}`
                : 'No vinculado'}
            </div>
          </div>
          {hasMethod('google') ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUnlink('google')}
            >
              Desvincular
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleLinkGoogle}>
              Vincular
            </Button>
          )}
        </div>
      )}

      {/* GitHub */}
      {isOAuthProviderConfigured('github') && (
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <div className="font-medium">
              {hasMethod('github') ? '✓' : '○'} GitHub
            </div>
            <div className="text-sm text-gray-500">
              {hasMethod('github')
                ? `Vinculado el ${new Date(
                    authMethods.find((m) => m.type === 'github')?.linkedAt || ''
                  ).toLocaleDateString()}`
                : 'No vinculado'}
            </div>
          </div>
          {hasMethod('github') ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUnlink('github')}
            >
              Desvincular
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleLinkGitHub}>
              Vincular
            </Button>
          )}
        </div>
      )}

      <div className="text-sm text-gray-500">
        💡 Tener múltiples métodos de autenticación aumenta la seguridad de tu cuenta
      </div>
    </div>
  );
}
```

## Ejemplo 5: Validación de Configuración en Desarrollo

```tsx
// components/dev/OAuthConfigWarning.tsx
'use client';

import { useEffect, useState } from 'react';
import { validateOAuthConfiguration } from '@/lib/oauth.config';

export function OAuthConfigWarning() {
  const [missing, setMissing] = useState<string[]>([]);

  useEffect(() => {
    // Solo mostrar en desarrollo
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const validation = validateOAuthConfiguration();
    if (!validation.valid) {
      setMissing(validation.missing);
    }
  }, []);

  if (missing.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-md p-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-2xl">⚠️</span>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            OAuth no configurado
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>Los siguientes proveedores no están configurados:</p>
            <ul className="list-disc list-inside mt-1">
              {missing.map((provider) => (
                <li key={provider}>{provider}</li>
              ))}
            </ul>
            <p className="mt-2">
              Ver{' '}
              <code className="bg-yellow-100 px-1 rounded">
                src/lib/oauth.config.README.md
              </code>{' '}
              para instrucciones.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Ejemplo 6: Hook Personalizado para OAuth

```tsx
// hooks/useOAuth.ts
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { OAuthProvider } from '@/types/auth.types';
import { isOAuthProviderConfigured } from '@/lib/oauth.config';

export function useOAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const login = async (provider: OAuthProvider, redirectTo?: string) => {
    if (!isOAuthProviderConfigured(provider)) {
      setError(`${provider} no está configurado`);
      return;
    }

    try {
      setIsLoading(provider);
      setError(null);
      await authService.oauthLogin(provider, redirectTo);
      // La redirección ocurre automáticamente
    } catch (err: any) {
      setError(err.message || 'Error al iniciar OAuth');
      setIsLoading(null);
    }
  };

  const handleCallback = async (
    provider: OAuthProvider,
    code: string,
    state: string
  ) => {
    try {
      setIsLoading(provider);
      setError(null);

      const user = await authService.oauthCallback({
        provider,
        code,
        state,
      });

      return user;
    } catch (err: any) {
      setError(err.message || 'Error en callback de OAuth');
      throw err;
    } finally {
      setIsLoading(null);
    }
  };

  return {
    login,
    handleCallback,
    isLoading,
    error,
  };
}

// Uso:
// const { login, isLoading, error } = useOAuth();
// await login('google', '/dashboard');
```

## Notas Importantes

1. **Seguridad**: Nunca expongas Client Secrets en el frontend. Solo los Client IDs deben estar en variables de entorno públicas (`NEXT_PUBLIC_*`).

2. **HTTPS**: En producción, asegúrate de usar HTTPS. OAuth requiere conexiones seguras.

3. **Redirect URIs**: Las URIs de redirección deben coincidir exactamente con las configuradas en los proveedores.

4. **State Validation**: Siempre valida el state en el callback para prevenir ataques CSRF.

5. **Error Handling**: Maneja todos los posibles errores (usuario canceló, token inválido, etc.).

6. **Loading States**: Muestra indicadores de carga durante el proceso de OAuth para mejor UX.

7. **Configuración**: Verifica que los proveedores estén configurados antes de mostrar los botones de OAuth.
