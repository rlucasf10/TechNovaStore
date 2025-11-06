# Configuración de OAuth 2.0

Este módulo maneja la configuración de proveedores OAuth (Google, GitHub) para TechNovaStore, incluyendo generación de state y PKCE para seguridad.

## Características

- ✅ Configuración de Google OAuth 2.0
- ✅ Configuración de GitHub OAuth
- ✅ Generación de state para protección CSRF
- ✅ Implementación de PKCE (Proof Key for Code Exchange)
- ✅ Validación de configuración
- ✅ Construcción automática de URLs de autorización

## Configuración de Proveedores

### Google OAuth 2.0

1. **Ir a Google Cloud Console**: https://console.cloud.google.com/
2. **Crear o seleccionar proyecto**
3. **Habilitar Google+ API**:
   - Ir a "APIs y servicios" → "Biblioteca"
   - Buscar "Google+ API"
   - Hacer clic en "Habilitar"
4. **Crear credenciales**:
   - Ir a "Credenciales" → "Crear credenciales" → "ID de cliente de OAuth 2.0"
   - Tipo de aplicación: "Aplicación web"
   - Nombre: "TechNovaStore"
5. **Configurar URIs de redirección**:
   - Desarrollo: `http://localhost:3011/auth/callback/google`
   - Producción: `https://tudominio.com/auth/callback/google`
6. **Copiar Client ID**:
   - Copiar el Client ID generado
   - Agregarlo a `.env.local`:
     ```
     NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
     ```

### GitHub OAuth

1. **Ir a GitHub Settings**: https://github.com/settings/developers
2. **Crear OAuth App**:
   - Click en "OAuth Apps" → "New OAuth App"
3. **Configurar aplicación**:
   - Application name: `TechNovaStore`
   - Homepage URL: `http://localhost:3011` (desarrollo)
   - Authorization callback URL: `http://localhost:3011/auth/callback/github` (desarrollo)
4. **Copiar Client ID**:
   - Copiar el Client ID generado
   - Agregarlo a `.env.local`:
     ```
     NEXT_PUBLIC_GITHUB_CLIENT_ID=tu-github-client-id
     ```
5. **Generar Client Secret**:
   - Generar un Client Secret
   - **IMPORTANTE**: El secret debe configurarse en el backend, NO en el frontend

## Uso

### Iniciar flujo de OAuth

```typescript
import { authService } from '@/services/auth.service';

// Iniciar login con Google
await authService.oauthLogin('google');

// Iniciar login con GitHub con redirección personalizada
await authService.oauthLogin('github', '/dashboard');
```

### Procesar callback de OAuth

```typescript
import { authService } from '@/services/auth.service';

// En la página de callback (/auth/callback/google o /auth/callback/github)
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');
const provider = 'google'; // o 'github'

if (code && state) {
  try {
    const user = await authService.oauthCallback({
      provider,
      code,
      state,
    });
    // Usuario autenticado exitosamente
    router.push('/dashboard');
  } catch (error) {
    // Manejar error
    console.error('OAuth error:', error);
    router.push('/login?error=oauth_failed');
  }
}
```

### Validar configuración

```typescript
import {
  isOAuthProviderConfigured,
  getConfiguredProviders,
  validateOAuthConfiguration,
} from '@/lib/oauth.config';

// Verificar si Google está configurado
if (isOAuthProviderConfigured('google')) {
  console.log('Google OAuth está configurado');
}

// Obtener lista de proveedores configurados
const providers = getConfiguredProviders();
console.log('Proveedores configurados:', providers);

// Validar toda la configuración
const validation = validateOAuthConfiguration();
if (!validation.valid) {
  console.warn('Proveedores faltantes:', validation.missing);
}
```

## Seguridad

### State (CSRF Protection)

El state es un token aleatorio que se genera antes de redirigir al proveedor OAuth y se valida en el callback. Esto previene ataques CSRF.

**Flujo:**
1. Se genera un state único con timestamp
2. Se guarda en `sessionStorage`
3. Se incluye en la URL de autorización
4. El proveedor lo retorna en el callback
5. Se valida que coincida con el guardado
6. Se verifica que no haya expirado (máximo 10 minutos)

### PKCE (Proof Key for Code Exchange)

PKCE es una extensión de OAuth 2.0 que previene ataques de intercepción de código de autorización.

**Flujo:**
1. Se genera un `code_verifier` aleatorio (128 caracteres)
2. Se calcula el `code_challenge` usando SHA-256
3. El `code_verifier` se guarda en `sessionStorage`
4. El `code_challenge` se envía en la URL de autorización
5. En el callback, se envía el `code_verifier` al backend
6. El backend verifica que el `code_challenge` corresponda al `code_verifier`

**Beneficios:**
- Previene ataques de intercepción de código
- No requiere Client Secret en el frontend
- Recomendado para aplicaciones públicas (SPAs, móviles)

## Estructura de Datos

### OAuthProviderConfig

```typescript
interface OAuthProviderConfig {
  name: OAuthProvider;
  clientId: string;
  redirectUri: string;
  scope: string[];
  authUrl: string;
  tokenUrl?: string;
}
```

### OAuthState

```typescript
interface OAuthState {
  provider: OAuthProvider;
  redirectTo?: string;
  timestamp: number;
}
```

### PKCEChallenge

```typescript
interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}
```

## Scopes

### Google

- `openid`: Identificador único del usuario
- `email`: Dirección de email del usuario
- `profile`: Información básica del perfil (nombre, foto)

### GitHub

- `user:email`: Acceso a direcciones de email del usuario
- `read:user`: Acceso a información pública del perfil

## Troubleshooting

### Error: "OAuth provider not configured"

**Causa**: El Client ID no está configurado en `.env.local`

**Solución**:
1. Verificar que `.env.local` existe en la raíz de `frontend/`
2. Agregar la variable correspondiente:
   ```
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu-client-id
   NEXT_PUBLIC_GITHUB_CLIENT_ID=tu-client-id
   ```
3. Reiniciar el servidor de desarrollo

### Error: "redirect_uri_mismatch"

**Causa**: La URI de redirección no coincide con la configurada en el proveedor

**Solución**:
1. Verificar que `NEXT_PUBLIC_APP_URL` esté configurado correctamente
2. Verificar que la URI de redirección en el proveedor sea exactamente:
   - Google: `http://localhost:3011/auth/callback/google`
   - GitHub: `http://localhost:3011/auth/callback/github`
3. Asegurarse de que no haya espacios o caracteres extra

### Error: "OAuth state mismatch"

**Causa**: El state no coincide o ha expirado

**Solución**:
1. Verificar que las cookies y sessionStorage estén habilitados
2. No abrir el callback en una nueva ventana/pestaña
3. Completar el flujo en menos de 10 minutos
4. Limpiar sessionStorage y reintentar

### Error: "crypto.subtle not available"

**Causa**: El navegador no soporta Web Crypto API (HTTPS requerido)

**Solución**:
1. En desarrollo, usar `localhost` (permitido sin HTTPS)
2. En producción, asegurarse de usar HTTPS
3. El sistema tiene fallback a método 'plain' si crypto no está disponible

## Referencias

- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
