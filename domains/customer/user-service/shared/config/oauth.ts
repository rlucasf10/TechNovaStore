/**
 * Configuración de OAuth 2.0 para el backend
 * Maneja la configuración de proveedores OAuth (Google, GitHub)
 * Incluye Client IDs y Client Secrets (privados)
 */

export type OAuthProvider = 'google' | 'github';

export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  userInfoUrl: string;
  redirectUri: string;
}

/**
 * Configuración de Google OAuth 2.0
 */
export const GOOGLE_OAUTH_CONFIG: OAuthProviderConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
  redirectUri: `${process.env.FRONTEND_URL || 'http://localhost:3011'}/auth/callback/google`,
};

/**
 * Configuración de GitHub OAuth
 */
export const GITHUB_OAUTH_CONFIG: OAuthProviderConfig = {
  clientId: process.env.GITHUB_CLIENT_ID || '',
  clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  userInfoUrl: 'https://api.github.com/user',
  redirectUri: `${process.env.FRONTEND_URL || 'http://localhost:3011'}/auth/callback/github`,
};

/**
 * Mapa de configuraciones de proveedores
 */
export const OAUTH_PROVIDERS: Record<OAuthProvider, OAuthProviderConfig> = {
  google: GOOGLE_OAUTH_CONFIG,
  github: GITHUB_OAUTH_CONFIG,
};

/**
 * Verificar si un proveedor OAuth está configurado correctamente
 */
export function isOAuthProviderConfigured(provider: OAuthProvider): boolean {
  const config = OAUTH_PROVIDERS[provider];
  return Boolean(config.clientId && config.clientSecret);
}

/**
 * Obtener configuración de un proveedor
 */
export function getOAuthConfig(provider: OAuthProvider): OAuthProviderConfig {
  const config = OAUTH_PROVIDERS[provider];
  
  if (!config.clientId || !config.clientSecret) {
    throw new Error(
      `OAuth provider ${provider} not configured. ` +
      `Please set ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET in .env`
    );
  }
  
  return config;
}

export default {
  OAUTH_PROVIDERS,
  GOOGLE_OAUTH_CONFIG,
  GITHUB_OAUTH_CONFIG,
  isOAuthProviderConfigured,
  getOAuthConfig,
};
