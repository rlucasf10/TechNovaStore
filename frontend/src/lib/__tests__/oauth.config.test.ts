/**
 * Tests para la configuración de OAuth
 */

import {
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
} from '../oauth.config';

// Mock de sessionStorage para tests
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock de crypto.subtle para tests
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    subtle: {
      digest: async (algorithm: string, data: ArrayBuffer) => {
        // Mock simple de SHA-256
        const array = new Uint8Array(data);
        const hash = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          hash[i] = array[i % array.length];
        }
        return hash.buffer;
      },
    },
  },
});

describe('OAuth Configuration', () => {
  beforeEach(() => {
    sessionStorageMock.clear();
  });

  describe('Provider Configs', () => {
    it('debe tener configuración de Google', () => {
      expect(GOOGLE_OAUTH_CONFIG).toBeDefined();
      expect(GOOGLE_OAUTH_CONFIG.name).toBe('google');
      expect(GOOGLE_OAUTH_CONFIG.authUrl).toBe('https://accounts.google.com/o/oauth2/v2/auth');
      expect(GOOGLE_OAUTH_CONFIG.scope).toContain('openid');
      expect(GOOGLE_OAUTH_CONFIG.scope).toContain('email');
      expect(GOOGLE_OAUTH_CONFIG.scope).toContain('profile');
    });

    it('debe tener configuración de GitHub', () => {
      expect(GITHUB_OAUTH_CONFIG).toBeDefined();
      expect(GITHUB_OAUTH_CONFIG.name).toBe('github');
      expect(GITHUB_OAUTH_CONFIG.authUrl).toBe('https://github.com/login/oauth/authorize');
      expect(GITHUB_OAUTH_CONFIG.scope).toContain('user:email');
      expect(GITHUB_OAUTH_CONFIG.scope).toContain('read:user');
    });

    it('debe tener ambos proveedores en OAUTH_PROVIDERS', () => {
      expect(OAUTH_PROVIDERS.google).toBeDefined();
      expect(OAUTH_PROVIDERS.github).toBeDefined();
    });
  });

  describe('State Generation and Validation', () => {
    it('debe generar un state válido', () => {
      const state = generateOAuthState('google');
      
      expect(state).toBeDefined();
      expect(typeof state).toBe('string');
      expect(state.length).toBeGreaterThan(0);
    });

    it('debe guardar el state en sessionStorage', () => {
      const state = generateOAuthState('google', '/dashboard');
      
      const stored = sessionStorage.getItem('oauth_state');
      expect(stored).toBe(state);
    });

    it('debe incluir provider y timestamp en el state', () => {
      const state = generateOAuthState('github', '/profile');
      
      const decoded = JSON.parse(atob(state));
      expect(decoded.provider).toBe('github');
      expect(decoded.redirectTo).toBe('/profile');
      expect(decoded.timestamp).toBeDefined();
      expect(typeof decoded.timestamp).toBe('number');
    });

    it('debe validar un state correcto', () => {
      const state = generateOAuthState('google');
      
      const validated = validateOAuthState(state);
      expect(validated).not.toBeNull();
      expect(validated?.provider).toBe('google');
    });

    it('debe rechazar un state inválido', () => {
      const validated = validateOAuthState('invalid-state');
      expect(validated).toBeNull();
    });

    it('debe rechazar un state que no coincide', () => {
      generateOAuthState('google');
      
      const differentState = btoa(JSON.stringify({
        provider: 'github',
        timestamp: Date.now(),
      }));
      
      const validated = validateOAuthState(differentState);
      expect(validated).toBeNull();
    });

    it('debe rechazar un state expirado', () => {
      const expiredState = btoa(JSON.stringify({
        provider: 'google',
        timestamp: Date.now() - (11 * 60 * 1000), // 11 minutos atrás
      }));
      
      sessionStorage.setItem('oauth_state', expiredState);
      
      const validated = validateOAuthState(expiredState);
      expect(validated).toBeNull();
    });

    it('debe limpiar el state después de validar', () => {
      const state = generateOAuthState('google');
      
      validateOAuthState(state);
      
      const stored = sessionStorage.getItem('oauth_state');
      expect(stored).toBeNull();
    });
  });

  describe('PKCE Generation', () => {
    it('debe generar un PKCE challenge válido', async () => {
      const pkce = await generatePKCEChallenge();
      
      expect(pkce).toBeDefined();
      expect(pkce.codeVerifier).toBeDefined();
      expect(pkce.codeChallenge).toBeDefined();
      expect(pkce.codeChallengeMethod).toBe('S256');
    });

    it('debe generar un code verifier de 128 caracteres', async () => {
      const pkce = await generatePKCEChallenge();
      
      expect(pkce.codeVerifier.length).toBe(128);
    });

    it('debe guardar el code verifier en sessionStorage', async () => {
      await generatePKCEChallenge();
      
      const stored = sessionStorage.getItem('oauth_code_verifier');
      expect(stored).toBeDefined();
      expect(stored?.length).toBe(128);
    });

    it('debe generar code challenge diferente al verifier', async () => {
      const pkce = await generatePKCEChallenge();
      
      expect(pkce.codeChallenge).not.toBe(pkce.codeVerifier);
    });

    it('debe obtener y limpiar el code verifier guardado', async () => {
      const pkce = await generatePKCEChallenge();
      
      const retrieved = getStoredCodeVerifier();
      expect(retrieved).toBe(pkce.codeVerifier);
      
      // Debe limpiarse después de obtener
      const retrievedAgain = getStoredCodeVerifier();
      expect(retrievedAgain).toBeNull();
    });
  });

  describe('Authorization URL Building', () => {
    it('debe construir URL de autorización para Google', async () => {
      // Mock de clientId para el test
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'test-google-client-id';
      
      const url = await buildAuthorizationUrl({
        provider: 'google',
        usePKCE: false, // Desactivar PKCE para simplificar el test
      });
      
      expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url).toContain('client_id=test-google-client-id');
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=openid%20email%20profile');
      expect(url).toContain('state=');
      expect(url).toContain('access_type=offline');
      expect(url).toContain('prompt=consent');
    });

    it('debe construir URL de autorización para GitHub', async () => {
      // Mock de clientId para el test
      process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID = 'test-github-client-id';
      
      const url = await buildAuthorizationUrl({
        provider: 'github',
        usePKCE: false,
      });
      
      expect(url).toContain('https://github.com/login/oauth/authorize');
      expect(url).toContain('client_id=test-github-client-id');
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=user%3Aemail%20read%3Auser');
      expect(url).toContain('state=');
    });

    it('debe incluir PKCE en la URL cuando está habilitado', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'test-google-client-id';
      
      const url = await buildAuthorizationUrl({
        provider: 'google',
        usePKCE: true,
      });
      
      expect(url).toContain('code_challenge=');
      expect(url).toContain('code_challenge_method=S256');
    });

    it('debe lanzar error si el proveedor no está configurado', async () => {
      // Limpiar clientId
      delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      
      await expect(
        buildAuthorizationUrl({ provider: 'google' })
      ).rejects.toThrow('not configured');
    });
  });

  describe('Configuration Validation', () => {
    it('debe detectar si un proveedor está configurado', () => {
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'test-client-id';
      
      const isConfigured = isOAuthProviderConfigured('google');
      expect(isConfigured).toBe(true);
    });

    it('debe detectar si un proveedor NO está configurado', () => {
      delete process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
      
      const isConfigured = isOAuthProviderConfigured('github');
      expect(isConfigured).toBe(false);
    });

    it('debe retornar lista de proveedores configurados', () => {
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'test-google-id';
      process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID = 'test-github-id';
      
      const configured = getConfiguredProviders();
      expect(configured).toContain('google');
      expect(configured).toContain('github');
    });

    it('debe validar la configuración completa', () => {
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'test-google-id';
      process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID = 'test-github-id';
      
      const validation = validateOAuthConfiguration();
      expect(validation.valid).toBe(true);
      expect(validation.missing).toHaveLength(0);
    });

    it('debe detectar proveedores faltantes', () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      delete process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
      
      const validation = validateOAuthConfiguration();
      expect(validation.valid).toBe(false);
      expect(validation.missing).toContain('google');
      expect(validation.missing).toContain('github');
    });
  });
});
