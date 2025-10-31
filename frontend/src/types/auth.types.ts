/**
 * Tipos TypeScript para el sistema de autenticación
 * Incluye tipos para usuarios, credenciales, OAuth y gestión de métodos de autenticación
 */

// ============================================================================
// Tipos de Usuario
// ============================================================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  authMethods: AuthMethod[];
}

// ============================================================================
// Tipos de Autenticación
// ============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface SetPasswordData {
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ============================================================================
// Tipos de OAuth
// ============================================================================

export type OAuthProvider = 'google' | 'github';

export interface OAuthConfig {
  name: OAuthProvider;
  clientId: string;
  redirectUri: string;
  scope: string[];
  authUrl: string;
}

export interface OAuthCallbackData {
  provider: OAuthProvider;
  code: string;
  state: string;
}

export interface OAuthState {
  provider: OAuthProvider;
  redirectTo?: string;
  timestamp: number;
}

// ============================================================================
// Tipos de Métodos de Autenticación
// ============================================================================

export type AuthMethodType = 'password' | 'google' | 'github';

export interface AuthMethod {
  type: AuthMethodType;
  providerId?: string; // ID del usuario en el proveedor OAuth
  linkedAt: Date;
  lastUsed?: Date;
}

export interface UserAuthMethods {
  userId: string;
  email: string;
  authMethods: AuthMethod[];
}

export interface LinkAuthMethodData {
  provider: OAuthProvider;
  code: string;
}

export interface UnlinkAuthMethodData {
  type: AuthMethodType;
}

// ============================================================================
// Tipos de Respuesta de API
// ============================================================================

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  tokens?: {
    accessToken: string;
    refreshToken?: string;
  };
  // Retrocompatibilidad con versiones antiguas
  token?: string;
  refreshToken?: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  message?: string;
}

export interface AuthMethodsResponse {
  authMethods: AuthMethod[];
}

// ============================================================================
// Tipos de Errores de Autenticación
// ============================================================================

export type AuthErrorCode =
  | 'invalid-email'
  | 'invalid-credentials'
  | 'email-already-exists'
  | 'weak-password'
  | 'passwords-dont-match'
  | 'invalid-token'
  | 'token-expired'
  | 'network-error'
  | 'server-error'
  | 'rate-limit-exceeded'
  | 'oauth-cancelled'
  | 'oauth-failed'
  | 'method-already-linked'
  | 'cannot-unlink-only-method'
  | 'unauthorized';

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  field?: string;
}

// ============================================================================
// Tipos de Rate Limiting
// ============================================================================

export interface RateLimitState {
  attempts: number;
  lastAttempt: number;
  blockedUntil?: number;
}

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

// ============================================================================
// Tipos de Validación de Contraseña
// ============================================================================

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4; // 0: muy débil, 4: muy fuerte
  level: 'very-weak' | 'weak' | 'medium' | 'strong' | 'very-strong';
  feedback: string[];
  requirements: PasswordRequirement[];
}

export interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
}

// ============================================================================
// Tipos de Estado de Autenticación
// ============================================================================

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  error: AuthError | null;
  isLoading: boolean;
}
