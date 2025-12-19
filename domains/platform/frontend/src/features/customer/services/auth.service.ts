/**
 * Servicio de Autenticación
 * Maneja todas las operaciones de autenticación incluyendo:
 * - Login/Logout/Registro
 * - Recuperación de contraseña
 * - OAuth 2.0 (Google, GitHub)
 * - Gestión de métodos de autenticación
 * - Rate limiting en cliente
 */

import axios, { AxiosError } from 'axios';
import {
  User,
  LoginCredentials,
  RegisterData,
  ForgotPasswordData,
  ResetPasswordData,
  SetPasswordData,
  ChangePasswordData,
  OAuthProvider,
  OAuthCallbackData,
  LinkAuthMethodData,
  UnlinkAuthMethodData,
  AuthResponse,
  ValidateTokenResponse,
  AuthMethodsResponse,
  AuthError,
  AuthErrorCode,
  RateLimitState,
  RateLimitConfig,
} from '@/customer';
import { secureLogger } from '@/shared/lib/security';

// ============================================================================
// Utilidades de Transformación de Datos
// ============================================================================

/**
 * Transforma los datos del usuario del formato del backend (snake_case)
 * al formato del frontend (camelCase)
 */
function transformUserFromBackend(backendUser: any): User {
  return {
    id: backendUser.id?.toString() || '',
    email: backendUser.email || '',
    firstName: backendUser.first_name || backendUser.firstName || '',
    lastName: backendUser.last_name || backendUser.lastName || '',
    phone: backendUser.phone,
    avatar: backendUser.avatar,
    role: backendUser.role === 'admin' ? 'admin' : 'user',
    emailVerified: backendUser.email_verified || backendUser.emailVerified || false,
    createdAt: backendUser.created_at ? new Date(backendUser.created_at) : new Date(),
    updatedAt: backendUser.updated_at ? new Date(backendUser.updated_at) : new Date(),
    authMethods: (backendUser.auth_methods || backendUser.authMethods || []).map((method: any) => ({
      type: method.type,
      providerId: method.providerId,
      linkedAt: method.linkedAt ? new Date(method.linkedAt) : new Date(),
      lastUsed: method.lastUsed ? new Date(method.lastUsed) : undefined,
    })),
  };
}

// ============================================================================
// Configuración
// ============================================================================

// API_URL ya incluye /api si está configurado en NEXT_PUBLIC_API_URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const AUTH_ENDPOINTS = {
  login: `${API_BASE}/auth/login`,
  logout: `${API_BASE}/auth/logout`,
  register: `${API_BASE}/auth/register`,
  refreshToken: `${API_BASE}/auth/refresh`,
  forgotPassword: `${API_BASE}/auth/forgot-password`,
  validateResetToken: `${API_BASE}/auth/validate-reset-token`,
  resetPassword: `${API_BASE}/auth/reset-password`,
  setPassword: `${API_BASE}/auth/set-password`,
  changePassword: `${API_BASE}/auth/change-password`,
  me: `${API_BASE}/auth/me`,
  oauthCallback: `${API_BASE}/auth/oauth/callback`,
  authMethods: `${API_BASE}/auth/methods`,
  linkMethod: `${API_BASE}/auth/link-method`,
  unlinkMethod: `${API_BASE}/auth/unlink-method`,
};

// Importar configuración de OAuth desde el módulo dedicado
import {
  buildAuthorizationUrl,
  validateOAuthState,
  getStoredCodeVerifier,
  isOAuthProviderConfigured,
} from '@/customer';

// Configuración de rate limiting
const RATE_LIMIT_CONFIG: Record<string, RateLimitConfig> = {
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutos
    blockDurationMs: 15 * 60 * 1000, // 15 minutos
  },
  forgotPassword: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hora
    blockDurationMs: 60 * 60 * 1000, // 1 hora
  },
};

// ============================================================================
// Configuración de Axios
// ============================================================================

// CSRF token management
let csrfToken: string | null = null;
let sessionId: string | null = null;
let csrfPromise: Promise<{ token: string; sessionId: string }> | null = null;

// Function to get CSRF token
const getCSRFToken = async (): Promise<{ token: string; sessionId: string }> => {
  // If we already have a token, return it
  if (csrfToken && sessionId) {
    return { token: csrfToken, sessionId };
  }

  // If we're already fetching, wait for that request
  if (csrfPromise) {
    return csrfPromise;
  }

  // Start fetching
  csrfPromise = (async () => {
    try {
      // Generate a session ID if we don't have one
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // Use appropriate base URL for CSRF token endpoint
      const csrfBaseUrl = typeof window !== 'undefined'
        ? (process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000')
        : (process.env.INTERNAL_API_URL?.replace('/api', '') || 'http://api-gateway:3000');

      const response = await axios.get(`${csrfBaseUrl}/api/csrf-token`, {
        headers: {
          'X-Session-ID': sessionId,
        },
        withCredentials: true,
        timeout: 5000, // 5 seconds timeout
      });

      csrfToken = response.data.csrfToken || response.data.token;
      sessionId = response.data.sessionId || sessionId;

      return { token: csrfToken!, sessionId: sessionId! };
    } catch (error) {
      secureLogger.error('Error getting CSRF token:', error);
      // Reset promise so we can retry
      csrfPromise = null;
      throw error;
    } finally {
      // Clear promise after completion
      csrfPromise = null;
    }
  })();

  return csrfPromise;
};

// Crear instancia de Axios con configuración para cookies httpOnly
const authAxios = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Importante: permite enviar cookies httpOnly
  timeout: 60000, // 60 segundos de timeout (OAuth puede tardar)
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ SEGURIDAD: Interceptor para agregar CSRF token
// NO agregamos Authorization header porque usamos httpOnly cookies
// Las cookies httpOnly son enviadas automáticamente por el navegador
authAxios.interceptors.request.use(
  async (config) => {
    // Skip CSRF token for:
    // 1. GET, HEAD, OPTIONS requests (safe methods)
    // 2. The CSRF token endpoint itself (to avoid infinite loop)
    const isSafeMethod = config.method && ['get', 'head', 'options'].includes(config.method.toLowerCase());
    const isCsrfEndpoint = config.url?.includes('/csrf-token');

    if (!isSafeMethod && !isCsrfEndpoint) {
      try {
        secureLogger.log('Getting CSRF token for:', config.method, config.url);
        const { token: csrf, sessionId: sid } = await getCSRFToken();
        secureLogger.log('Got CSRF token:', csrf.substring(0, 10) + '...', 'Session:', sid);
        config.headers['X-CSRF-Token'] = csrf;
        config.headers['X-Session-ID'] = sid;
      } catch (error) {
        secureLogger.error('Failed to get CSRF token:', error);
        // Don't continue without CSRF token - it will fail anyway
        throw error;
      }
    }
    return config;
  },
  (error) => {
    secureLogger.error('Auth request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar refresh token automático
authAxios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    const requestUrl = originalRequest?.url || '';

    // Para /auth/me, los errores 401 son esperados (usuario no logueado)
    // No intentar refresh ni loguear nada
    if (requestUrl.includes('/auth/me') && error.response?.status === 401) {
      return Promise.reject(error);
    }

    // Si el error es 401 y no hemos intentado refresh aún
    // Y NO es el endpoint de refresh (para evitar loops infinitos)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !requestUrl.includes('/auth/refresh') &&
      !requestUrl.includes('/auth/login') &&
      !requestUrl.includes('/auth/register')
    ) {
      originalRequest._retry = true;

      try {
        // Intentar refrescar el token
        await authAxios.post(AUTH_ENDPOINTS.refreshToken);

        // Reintentar la petición original
        return authAxios(originalRequest);
      } catch (refreshError) {
        // Si el refresh falla, NO redirigir si ya estamos en login
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// Utilidades de Rate Limiting
// ============================================================================

class RateLimiter {
  private storage: Storage | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.storage = window.localStorage;
    }
  }

  private getKey(action: string): string {
    return `rate_limit_${action}`;
  }

  private getState(action: string): RateLimitState {
    if (!this.storage) {
      return { attempts: 0, lastAttempt: 0 };
    }

    const stored = this.storage.getItem(this.getKey(action));
    if (!stored) {
      return { attempts: 0, lastAttempt: 0 };
    }

    try {
      return JSON.parse(stored);
    } catch {
      return { attempts: 0, lastAttempt: 0 };
    }
  }

  private setState(action: string, state: RateLimitState): void {
    if (!this.storage) return;
    this.storage.setItem(this.getKey(action), JSON.stringify(state));
  }

  checkLimit(action: string): { allowed: boolean; remainingTime?: number } {
    const config = RATE_LIMIT_CONFIG[action];
    if (!config) {
      return { allowed: true };
    }

    const state = this.getState(action);
    const now = Date.now();

    // Si está bloqueado, verificar si ya pasó el tiempo de bloqueo
    if (state.blockedUntil && state.blockedUntil > now) {
      return {
        allowed: false,
        remainingTime: Math.ceil((state.blockedUntil - now) / 1000),
      };
    }

    // Si pasó la ventana de tiempo, resetear intentos
    if (now - state.lastAttempt > config.windowMs) {
      this.setState(action, { attempts: 0, lastAttempt: now });
      return { allowed: true };
    }

    // Verificar si excedió el límite
    if (state.attempts >= config.maxAttempts) {
      const blockedUntil = state.lastAttempt + config.blockDurationMs;
      this.setState(action, { ...state, blockedUntil });
      return {
        allowed: false,
        remainingTime: Math.ceil((blockedUntil - now) / 1000),
      };
    }

    return { allowed: true };
  }

  recordAttempt(action: string): void {
    const state = this.getState(action);
    const now = Date.now();

    this.setState(action, {
      attempts: state.attempts + 1,
      lastAttempt: now,
    });
  }

  reset(action: string): void {
    if (!this.storage) return;
    this.storage.removeItem(this.getKey(action));
  }
}

const rateLimiter = new RateLimiter();

// ============================================================================
// Utilidades de Manejo de Errores
// ============================================================================

function handleAuthError(error: unknown, silent: boolean = false): AuthError {
  // Solo loguear si no es silencioso (para errores esperados como 401 en /auth/me)
  if (!silent) {
    secureLogger.log('🔍 Handling auth error:', error);
  }
  
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ 
      code?: string; 
      message?: string | string[]; 
      error?: string;
      details?: string | string[];
      errors?: string[];
    }>;

    // Errores de red
    if (!axiosError.response) {
      return {
        code: 'network-error',
        message: 'Error de conexión. Verifica tu internet.',
      };
    }

    // Errores del servidor
    const status = axiosError.response.status;
    const data = axiosError.response.data;
    
    // Solo loguear si no es silencioso
    if (!silent) {
      secureLogger.log('📊 Error response:', { status, data });
    }

    // Error 400 - Bad Request (credenciales incorrectas, datos inválidos)
    if (status === 400) {
      // Intentar obtener el código de error de diferentes campos
      const errorCode = data?.code || data?.error;
      
      // Intentar obtener el mensaje de error de diferentes campos y formatos
      let errorMessage: string | string[] | undefined;
      if (data?.message) {
        errorMessage = data.message;
      } else if (data?.details) {
        errorMessage = data.details;
      } else if (data?.errors && Array.isArray(data.errors)) {
        errorMessage = data.errors;
      }
      
      secureLogger.log('🔑 400 Error details:', { errorCode, errorMessage });
      
      // Manejar VALIDATION_ERROR específicamente (común en backends)
      if (errorCode === 'VALIDATION_ERROR') {
        // Para errores de validación en login, asumir credenciales incorrectas
        return {
          code: 'invalid-credentials',
          message: 'Email o contraseña incorrectos',
        };
      }
      
      // Si hay un código específico del backend, usarlo
      if (errorCode && isValidErrorCode(errorCode)) {
        const finalMessage = normalizeErrorMessage(errorMessage) || getErrorMessage(errorCode);
        return {
          code: errorCode,
          message: finalMessage,
        };
      }
      
      // Normalizar errorMessage (puede ser string o array)
      const normalizedMessage = normalizeErrorMessage(errorMessage);
      secureLogger.log('🔧 Normalized message:', normalizedMessage);
      
      // Si el mensaje contiene palabras clave de credenciales incorrectas
      if (normalizedMessage && (
        normalizedMessage.toLowerCase().includes('invalid') ||
        normalizedMessage.toLowerCase().includes('incorrect') ||
        normalizedMessage.toLowerCase().includes('wrong') ||
        normalizedMessage.toLowerCase().includes('credentials') ||
        normalizedMessage.toLowerCase().includes('password') ||
        normalizedMessage.toLowerCase().includes('email')
      )) {
        return {
          code: 'invalid-credentials',
          message: 'Email o contraseña incorrectos',
        };
      }
      
      // Si no hay información específica, asumir credenciales incorrectas para login
      return {
        code: 'invalid-credentials',
        message: 'Email o contraseña incorrectos',
      };
    }

    // Error 401 - No autenticado
    if (status === 401) {
      // Para login, 401 también significa credenciales incorrectas
      const errorCode = data?.code || data?.error;
      if (errorCode === 'invalid-credentials' || errorCode === 'unauthorized') {
        return {
          code: 'invalid-credentials',
          message: 'Email o contraseña incorrectos',
        };
      }
      
      return {
        code: 'unauthorized',
        message: 'No autenticado',
      };
    }

    if (status === 429) {
      return {
        code: 'rate-limit-exceeded',
        message: 'Demasiados intentos. Intenta de nuevo más tarde.',
      };
    }

    if (status >= 500) {
      return {
        code: 'server-error',
        message: 'Error del servidor. Intenta de nuevo más tarde.',
      };
    }

    // Errores específicos del backend (para otros códigos de estado)
    const errorCode = data?.code || data?.error;
    if (errorCode && isValidErrorCode(errorCode)) {
      const finalMessage = normalizeErrorMessage(data?.message) || getErrorMessage(errorCode);
      const authError: AuthError = {
        code: errorCode,
        message: finalMessage,
      };
      
      // Si es un error de usuario OAuth sin contraseña, extraer el proveedor
      if (errorCode === 'oauth-user-no-password' && (data as any)?.provider) {
        authError.provider = (data as any).provider;
      }
      
      return authError;
    }

    return {
      code: 'server-error',
      message: 'Ocurrió un error inesperado.',
    };
  }

  return {
    code: 'server-error',
    message: 'Ocurrió un error inesperado.',
  };
}

const ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  'invalid-email': 'El email ingresado no está registrado',
  'invalid-credentials': 'Email o contraseña incorrectos',
  'email-already-exists': 'Este email ya está registrado',
  'weak-password': 'La contraseña no cumple con los requisitos de seguridad',
  'passwords-dont-match': 'Las contraseñas no coinciden',
  'invalid-token': 'El link de recuperación es inválido o ha expirado',
  'token-expired': 'El link de recuperación ha expirado. Solicita uno nuevo',
  'network-error': 'Error de conexión. Verifica tu internet',
  'server-error': 'Error del servidor. Intenta de nuevo más tarde',
  'rate-limit-exceeded': 'Demasiados intentos. Intenta de nuevo más tarde',
  'oauth-cancelled': 'Autenticación cancelada',
  'oauth-failed': 'Error al autenticar con el proveedor',
  'oauth-user-no-password': 'Tu cuenta usa OAuth y no tiene contraseña establecida',
  'method-already-linked': 'Este método ya está vinculado a tu cuenta',
  'cannot-unlink-only-method': 'No puedes desvincular tu único método de autenticación',
  'unauthorized': 'No tienes permisos para realizar esta acción',
};

function getErrorMessage(code: AuthErrorCode): string {
  return ERROR_MESSAGES[code] || 'Ocurrió un error inesperado';
}

function isValidErrorCode(code: string): code is AuthErrorCode {
  return code in ERROR_MESSAGES;
}

function normalizeErrorMessage(message: string | string[] | undefined): string {
  if (typeof message === 'string') {
    return message;
  }
  if (Array.isArray(message) && message.length > 0) {
    return message[0];
  }
  return '';
}

// ============================================================================
// Utilidades de OAuth
// ============================================================================

// Las utilidades de OAuth (state, PKCE) se han movido a @/lib/oauth.config
// para mejor organización y reutilización

// ============================================================================
// Clase AuthService
// ============================================================================

class AuthService {
  /**
   * Iniciar sesión con email y contraseña
   */
  async login(credentials: LoginCredentials): Promise<User> {
    // ✅ SEGURIDAD: NO loguear credenciales (email/password) para prevenir exposición de datos sensibles
    // Solo loguear información no sensible para debugging
    secureLogger.log('🔐 Login attempt started');

    // Verificar rate limiting
    const limitCheck = rateLimiter.checkLimit('login');
    if (!limitCheck.allowed) {
      secureLogger.error('❌ Rate limit exceeded');
      throw {
        code: 'rate-limit-exceeded',
        message: `Demasiados intentos. Intenta en ${limitCheck.remainingTime} segundos.`,
      } as AuthError;
    }

    try {
      const response = await authAxios.post<{ success: boolean; message: string; data: AuthResponse }>(
        AUTH_ENDPOINTS.login,
        credentials
      );
      // ✅ SEGURIDAD: Solo loguear status code, NO loguear response.data que podría contener tokens
      secureLogger.log('✅ Login response received:', response.status);

      // Registrar intento exitoso (resetear contador)
      rateLimiter.reset('login');

      if (!response.data.data || !response.data.data.user) {
        secureLogger.error('❌ No user data in response');
        // ✅ SEGURIDAD: NO loguear response.data completo que podría contener tokens
        throw new Error('No user data received');
      }

      // ✅ SEGURIDAD: NO almacenar tokens en localStorage
      // El token viene en una httpOnly cookie que el navegador maneja automáticamente
      // localStorage es vulnerable a ataques XSS

      // Transformar datos del backend (snake_case) al frontend (camelCase)
      const user = transformUserFromBackend(response.data.data.user);
      // ✅ SEGURIDAD: Solo loguear información no sensible (userId, role)
      secureLogger.log('✅ Login successful for user:', { userId: user.id, role: user.role });
      return user;
    } catch (error) {
      // ✅ SEGURIDAD: NO loguear el objeto error completo que podría contener credenciales
      // Solo loguear información sanitizada
      
      // Registrar intento fallido
      rateLimiter.recordAttempt('login');
      
      // Procesar y lanzar el error manejado
      const authError = handleAuthError(error);
      secureLogger.error('🚨 Login failed:', { code: authError.code, message: authError.message });
      
      throw authError;
    }
  }

  /**
   * Cerrar sesión
   * ✅ SEGURIDAD: NO eliminamos tokens de localStorage porque no los almacenamos ahí
   * El backend invalida la httpOnly cookie automáticamente
   */
  async logout(): Promise<void> {
    try {
      await authAxios.post(AUTH_ENDPOINTS.logout);
    } catch (error) {
      // Ignorar errores de logout (el usuario ya no está autenticado)
      secureLogger.error('Logout error:', error);
    }
  }

  /**
   * Registrar nuevo usuario
   */
  async register(data: RegisterData): Promise<User> {
    try {
      const response = await authAxios.post<{ success: boolean; message: string; data: AuthResponse }>(
        AUTH_ENDPOINTS.register,
        data
      );

      if (!response.data.data || !response.data.data.user) {
        throw new Error('No user data received');
      }

      // Transformar datos del backend (snake_case) al frontend (camelCase)
      return transformUserFromBackend(response.data.data.user);
    } catch (error) {
      throw handleAuthError(error);
    }
  }

  /**
   * Refrescar token de autenticación
   */
  async refreshToken(): Promise<void> {
    try {
      await authAxios.post(AUTH_ENDPOINTS.refreshToken);
    } catch (error) {
      throw handleAuthError(error);
    }
  }

  /**
   * Obtener usuario actual
   * ✅ SEGURIDAD: Hacemos petición directamente al backend
   * Si hay una httpOnly cookie válida, el backend responde con el usuario
   * Si no hay cookie o es inválida, el backend responde 401
   * NO verificamos localStorage porque no almacenamos tokens ahí
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await authAxios.get<{ success: boolean; data: any }>(AUTH_ENDPOINTS.me);
      const backendUser = response.data.data;
      if (!backendUser) {
        return null;
      }
      // Transformar datos del backend (snake_case) al frontend (camelCase)
      return transformUserFromBackend(backendUser);
    } catch (error) {
      // Pasar silent=true para no loguear errores 401 esperados
      const authError = handleAuthError(error, true);
      // Si el error es 401 (no autenticado), retornar null en lugar de lanzar error
      if (authError.code === 'unauthorized') {
        return null;
      }
      // Para cualquier otro error, también retornar null (usuario no autenticado)
      return null;
    }
  }

  /**
   * Solicitar recuperación de contraseña
   */
  async forgotPassword(data: ForgotPasswordData): Promise<void> {
    // Verificar rate limiting
    const limitCheck = rateLimiter.checkLimit('forgotPassword');
    if (!limitCheck.allowed) {
      throw {
        code: 'rate-limit-exceeded',
        message: `Demasiadas solicitudes. Intenta en ${limitCheck.remainingTime} segundos.`,
      } as AuthError;
    }

    try {
      await authAxios.post(AUTH_ENDPOINTS.forgotPassword, data);
      rateLimiter.recordAttempt('forgotPassword');
    } catch (error) {
      rateLimiter.recordAttempt('forgotPassword');
      throw handleAuthError(error);
    }
  }

  /**
   * Validar token de recuperación de contraseña
   */
  async validateResetToken(token: string): Promise<boolean> {
    try {
      const response = await authAxios.get<ValidateTokenResponse>(
        `${AUTH_ENDPOINTS.validateResetToken}?token=${token}`
      );
      return response.data.valid;
    } catch (error) {
      throw handleAuthError(error);
    }
  }

  /**
   * Restablecer contraseña con token
   */
  async resetPassword(data: ResetPasswordData): Promise<void> {
    try {
      await authAxios.post(AUTH_ENDPOINTS.resetPassword, data);
    } catch (error) {
      throw handleAuthError(error);
    }
  }

  /**
   * Establecer contraseña (para usuarios OAuth sin contraseña)
   */
  async setPassword(data: SetPasswordData): Promise<void> {
    try {
      await authAxios.post(AUTH_ENDPOINTS.setPassword, data);
    } catch (error) {
      throw handleAuthError(error);
    }
  }

  /**
   * Cambiar contraseña (requiere contraseña actual)
   */
  async changePassword(data: ChangePasswordData): Promise<void> {
    try {
      await authAxios.post(AUTH_ENDPOINTS.changePassword, data);
    } catch (error) {
      throw handleAuthError(error);
    }
  }

  /**
   * Iniciar flujo de OAuth 2.0
   * Construye la URL de autorización con state y PKCE, y abre popup del proveedor
   * @returns Referencia al popup abierto (o null si se redirigió)
   */
  async oauthLogin(provider: OAuthProvider, redirectTo?: string): Promise<Window | null> {
    // Verificar que el proveedor esté configurado
    if (!isOAuthProviderConfigured(provider)) {
      throw new Error(
        `OAuth provider ${provider} not configured. ` +
        `Please set NEXT_PUBLIC_${provider.toUpperCase()}_CLIENT_ID in .env.local`
      );
    }

    try {
      // Construir URL de autorización con state y PKCE
      const authUrl = await buildAuthorizationUrl({
        provider,
        redirectTo,
        usePKCE: true, // Habilitar PKCE para mayor seguridad
      });

      // Abrir popup centrado en la pantalla (estilo PCComponentes)
      if (typeof window !== 'undefined') {
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const popup = window.open(
          authUrl,
          `oauth_${provider}`,
          `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
        );

        // Verificar si el popup se abrió correctamente
        if (!popup || popup.closed) {
          // Si el popup fue bloqueado, redirigir normalmente
          secureLogger.warn('Popup bloqueado, redirigiendo normalmente...');
          window.location.href = authUrl;
          return null;
        }
        
        return popup;
      }
      return null;
    } catch (error) {
      secureLogger.error('Error initiating OAuth login:', error);
      throw {
        code: 'oauth-failed',
        message: 'Error al iniciar autenticación con ' + provider,
      } as AuthError;
    }
  }

  /**
   * Procesar callback de OAuth
   * Valida el state, obtiene el code verifier (PKCE) y envía al backend
   */
  async oauthCallback(data: OAuthCallbackData): Promise<User> {
    try {
      // Validar state (CSRF protection)
      const stateData = validateOAuthState(data.state);
      if (!stateData) {
        throw {
          code: 'oauth-failed',
          message: 'Estado de OAuth inválido o expirado',
        } as AuthError;
      }

      // Verificar que el provider coincida
      if (stateData.provider !== data.provider) {
        throw {
          code: 'oauth-failed',
          message: 'Proveedor de OAuth no coincide',
        } as AuthError;
      }

      // Obtener code verifier (PKCE)
      const codeVerifier = getStoredCodeVerifier();

      // Enviar código al backend junto con el code verifier
      const response = await authAxios.post<{ success: boolean; message: string; data: AuthResponse }>(
        AUTH_ENDPOINTS.oauthCallback,
        {
          provider: data.provider,
          code: data.code,
          codeVerifier, // Incluir code verifier para PKCE
        }
      );

      if (!response.data.data || !response.data.data.user) {
        throw new Error('No user data received');
      }

      // ✅ SEGURIDAD: NO almacenar tokens en localStorage
      // El token viene en una httpOnly cookie que el navegador maneja automáticamente
      // localStorage es vulnerable a ataques XSS

      // Transformar datos del backend (snake_case) al frontend (camelCase)
      return transformUserFromBackend(response.data.data.user);
    } catch (error) {
      throw handleAuthError(error);
    }
  }

  /**
   * Obtener métodos de autenticación del usuario
   */
  async getAuthMethods(): Promise<AuthMethodsResponse> {
    try {
      const response = await authAxios.get<AuthMethodsResponse>(
        AUTH_ENDPOINTS.authMethods
      );
      return response.data;
    } catch (error) {
      throw handleAuthError(error);
    }
  }

  /**
   * Vincular método de autenticación OAuth
   */
  async linkAuthMethod(data: LinkAuthMethodData): Promise<void> {
    try {
      await authAxios.post(AUTH_ENDPOINTS.linkMethod, data);
    } catch (error) {
      throw handleAuthError(error);
    }
  }

  /**
   * Desvincular método de autenticación
   */
  async unlinkAuthMethod(data: UnlinkAuthMethodData): Promise<void> {
    try {
      await authAxios.delete(AUTH_ENDPOINTS.unlinkMethod, { data });
    } catch (error) {
      throw handleAuthError(error);
    }
  }
}

// Exportar instancia única del servicio
export const authService = new AuthService();
export default authService;
