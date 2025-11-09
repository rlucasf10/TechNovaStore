/**
 * Configuración de OAuth 2.0
 * Maneja la configuración de proveedores OAuth (Google, GitHub)
 * Incluye generación de state y PKCE para seguridad
 */

import { OAuthProvider, OAuthState } from '@/customer';

// ============================================================================
// Tipos de Configuración OAuth
// ============================================================================

export interface OAuthProviderConfig {
  name: OAuthProvider;
  clientId: string;
  redirectUri: string;
  scope: string[];
  authUrl: string;
  tokenUrl?: string; // URL para intercambiar código por token (usado en backend)
}

export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}

// ============================================================================
// Configuración de Proveedores OAuth
// ============================================================================

/**
 * Obtener la URL base de la aplicación
 */
function getAppUrl(): string {
  if (typeof window !== 'undefined') {
    // En el cliente, usar la URL actual
    return window.location.origin;
  }
  // En el servidor, usar la variable de entorno
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3011';
}

/**
 * Configuración de Google OAuth 2.0
 * 
 * Para obtener credenciales:
 * 1. Ir a Google Cloud Console: https://console.cloud.google.com/
 * 2. Crear un proyecto o seleccionar uno existente
 * 3. Habilitar Google+ API
 * 4. Ir a "Credenciales" → "Crear credenciales" → "ID de cliente de OAuth 2.0"
 * 5. Tipo de aplicación: "Aplicación web"
 * 6. Agregar URI de redirección autorizada: http://localhost:3011/auth/callback/google
 * 7. Copiar el Client ID y guardarlo en .env.local
 */
export const GOOGLE_OAUTH_CONFIG: OAuthProviderConfig = {
  name: 'google',
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  redirectUri: `${getAppUrl()}/auth/callback/google`,
  scope: [
    'openid',
    'email',
    'profile',
  ],
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
};

/**
 * Configuración de GitHub OAuth
 * 
 * Para obtener credenciales:
 * 1. Ir a GitHub Settings: https://github.com/settings/developers
 * 2. Click en "OAuth Apps" → "New OAuth App"
 * 3. Application name: TechNovaStore
 * 4. Homepage URL: http://localhost:3011
 * 5. Authorization callback URL: http://localhost:3011/auth/callback/github
 * 6. Copiar el Client ID y guardarlo en .env.local
 * 7. Generar un Client Secret y guardarlo en el backend (NO en frontend)
 */
export const GITHUB_OAUTH_CONFIG: OAuthProviderConfig = {
  name: 'github',
  clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '',
  redirectUri: `${getAppUrl()}/auth/callback/github`,
  scope: [
    'user:email',
    'read:user',
  ],
  authUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',
};

/**
 * Mapa de configuraciones de proveedores
 */
export const OAUTH_PROVIDERS: Record<OAuthProvider, OAuthProviderConfig> = {
  google: GOOGLE_OAUTH_CONFIG,
  github: GITHUB_OAUTH_CONFIG,
};

// ============================================================================
// Utilidades de State (CSRF Protection)
// ============================================================================

/**
 * Generar un state aleatorio para prevenir ataques CSRF
 * El state se guarda en sessionStorage y se valida en el callback
 */
export function generateOAuthState(
  provider: OAuthProvider,
  redirectTo?: string
): string {
  const state: OAuthState = {
    provider,
    redirectTo,
    timestamp: Date.now(),
  };

  // Convertir a string y codificar en base64
  const stateString = btoa(JSON.stringify(state));

  // Guardar en sessionStorage para validación posterior
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('oauth_state', stateString);
  }

  return stateString;
}

/**
 * Validar el state recibido en el callback
 * Retorna el state decodificado si es válido, null si es inválido
 */
export function validateOAuthState(receivedState: string): OAuthState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Obtener el state guardado
    const storedState = sessionStorage.getItem('oauth_state');
    if (!storedState) {
      console.error('No stored OAuth state found');
      return null;
    }

    // Verificar que coincidan
    if (storedState !== receivedState) {
      console.error('OAuth state mismatch');
      return null;
    }

    // Decodificar el state
    const stateData: OAuthState = JSON.parse(atob(receivedState));

    // Verificar que no haya expirado (máximo 10 minutos)
    const maxAge = 10 * 60 * 1000; // 10 minutos
    if (Date.now() - stateData.timestamp > maxAge) {
      console.error('OAuth state expired');
      return null;
    }

    // Limpiar el state guardado
    sessionStorage.removeItem('oauth_state');

    return stateData;
  } catch (error) {
    console.error('Error validating OAuth state:', error);
    return null;
  }
}

// ============================================================================
// Utilidades de PKCE (Proof Key for Code Exchange)
// ============================================================================

/**
 * Generar una cadena aleatoria segura
 * Usa crypto.getRandomValues para mayor seguridad
 */
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomValues = new Uint8Array(length);
  
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(randomValues);
  } else {
    // Fallback para entornos sin crypto (no recomendado para producción)
    for (let i = 0; i < length; i++) {
      randomValues[i] = Math.floor(Math.random() * 256);
    }
  }

  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }

  return result;
}

/**
 * Generar el code challenge a partir del code verifier
 * Usa SHA-256 para mayor seguridad
 */
async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    // Fallback: retornar el verifier sin hash (método 'plain')
    // NOTA: Esto es menos seguro y solo debe usarse en desarrollo
    console.warn('crypto.subtle not available, using plain code challenge');
    return codeVerifier;
  }

  try {
    // Codificar el verifier como bytes
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);

    // Calcular el hash SHA-256
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);

    // Convertir a base64url
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const base64 = btoa(String.fromCharCode(...hashArray));

    // Convertir base64 a base64url (RFC 7636)
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  } catch (error) {
    console.error('Error generating code challenge:', error);
    // Fallback a método 'plain'
    return codeVerifier;
  }
}

/**
 * Generar un par PKCE (code verifier + code challenge)
 * El code verifier se guarda en sessionStorage
 * El code challenge se envía en la URL de autorización
 */
export async function generatePKCEChallenge(): Promise<PKCEChallenge> {
  // Generar code verifier (43-128 caracteres)
  const codeVerifier = generateRandomString(128);

  // Generar code challenge
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Guardar code verifier en sessionStorage
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('oauth_code_verifier', codeVerifier);
  }

  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256',
  };
}

/**
 * Obtener el code verifier guardado
 * Se usa en el callback para intercambiar el código por el token
 */
export function getStoredCodeVerifier(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const codeVerifier = sessionStorage.getItem('oauth_code_verifier');
  
  // Limpiar después de obtener
  if (codeVerifier) {
    sessionStorage.removeItem('oauth_code_verifier');
  }

  return codeVerifier;
}

// ============================================================================
// Construcción de URL de Autorización
// ============================================================================

export interface OAuthAuthorizationParams {
  provider: OAuthProvider;
  redirectTo?: string;
  usePKCE?: boolean;
}

/**
 * Construir la URL de autorización completa para iniciar el flujo OAuth
 * Incluye todos los parámetros necesarios: client_id, redirect_uri, scope, state, PKCE
 */
export async function buildAuthorizationUrl(
  params: OAuthAuthorizationParams
): Promise<string> {
  const { provider, redirectTo, usePKCE = true } = params;

  // Obtener configuración del proveedor
  const config = OAUTH_PROVIDERS[provider];
  if (!config.clientId) {
    throw new Error(`OAuth provider ${provider} not configured. Please set NEXT_PUBLIC_${provider.toUpperCase()}_CLIENT_ID in .env.local`);
  }

  // Generar state para CSRF protection
  const state = generateOAuthState(provider, redirectTo);

  // Construir parámetros base
  const urlParams = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scope.join(' '),
    state,
  });

  // Agregar PKCE si está habilitado
  if (usePKCE) {
    try {
      const pkce = await generatePKCEChallenge();
      urlParams.append('code_challenge', pkce.codeChallenge);
      urlParams.append('code_challenge_method', pkce.codeChallengeMethod);
    } catch (error) {
      console.error('Error generating PKCE challenge:', error);
      // Continuar sin PKCE si falla
    }
  }

  // Parámetros adicionales específicos por proveedor
  if (provider === 'google') {
    urlParams.append('access_type', 'offline'); // Para obtener refresh token
    // NO agregar 'prompt' para permitir login automático si el usuario ya autorizó la app
    // Google decidirá automáticamente:
    // - Primera vez: Muestra pantalla de consentimiento
    // - Siguientes veces: Login automático si tiene sesión activa
    // Si quieres forzar selección de cuenta, usa: urlParams.append('prompt', 'select_account');
  }

  // Construir URL completa
  return `${config.authUrl}?${urlParams.toString()}`;
}

// ============================================================================
// Validación de Configuración
// ============================================================================

/**
 * Verificar si un proveedor OAuth está configurado correctamente
 */
export function isOAuthProviderConfigured(provider: OAuthProvider): boolean {
  const config = OAUTH_PROVIDERS[provider];
  return Boolean(config.clientId);
}

/**
 * Obtener lista de proveedores OAuth configurados
 */
export function getConfiguredProviders(): OAuthProvider[] {
  return Object.keys(OAUTH_PROVIDERS).filter((provider) =>
    isOAuthProviderConfigured(provider as OAuthProvider)
  ) as OAuthProvider[];
}

/**
 * Validar que todos los proveedores necesarios estén configurados
 * Útil para mostrar advertencias en desarrollo
 */
export function validateOAuthConfiguration(): {
  valid: boolean;
  missing: OAuthProvider[];
} {
  const allProviders: OAuthProvider[] = ['google', 'github'];
  const missing = allProviders.filter(
    (provider) => !isOAuthProviderConfigured(provider)
  );

  return {
    valid: missing.length === 0,
    missing,
  };
}

// ============================================================================
// Exportaciones
// ============================================================================

export default {
  OAUTH_PROVIDERS,
  GOOGLE_OAUTH_CONFIG,
  GITHUB_OAUTH_CONFIG,
  generateOAuthState,
  validateOAuthState,
  generatePKCEChallenge,
  getStoredCodeVerifier,
  buildAuthorizationUrl,
  isOAuthProviderConfigured,
  getConfiguredProviders,
  validateOAuthConfiguration,
};
