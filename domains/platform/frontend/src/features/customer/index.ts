// Customer Feature - Exports

// Components - Auth
export * from './components/auth/ProtectedRoute'
export * from './components/auth/AdminRoute'
export { default as SocialLoginButtons } from './components/auth/SocialLoginButtons'
export { default as SetPasswordModal } from './components/auth/SetPasswordModal'
export { default as PasswordStrengthIndicator } from './components/auth/PasswordStrengthIndicator'
export * from './components/auth/RateLimitMessage'
export * from './components/auth/RateLimitStatus'
export { default as AuthLayout } from './components/auth/AuthLayout'
export { default as AuthDivider } from './components/auth/AuthDivider'
export { default as AuthCard } from './components/auth/AuthCard'
export * from './components/dashboard/UserDashboard'
export * from './components/dashboard/ChangePassword'
export * from './components/dashboard/GdprDashboard'
export * from './components/dashboard/OrderTracking'
export * from './components/dashboard/TrackingTimeline'

// Hooks
export * from './hooks/useAuth'
export * from './hooks/useAuthErrors'
export * from './hooks/useUser'
export * from './hooks/useNotifications'

// Services
export * from './services/auth.service'

// Store (explicit exports to avoid conflicts)
export { 
  useAuthStore,
  type User as UserStore
} from './store/auth.store'

// Types (main source of truth for types)
export type {
  User,
  UserAuthMethods,
  LoginCredentials,
  RegisterData,
  ForgotPasswordData,
  ResetPasswordData,
  SetPasswordData,
  ChangePasswordData,
  OAuthProvider,
  OAuthConfig,
  OAuthCallbackData,
  OAuthState,
  AuthMethod,
  AuthMethodType,
  LinkAuthMethodData,
  UnlinkAuthMethodData,
  AuthResponse,
  ValidateTokenResponse,
  AuthMethodsResponse,
  AuthError,
  AuthErrorCode,
  RateLimitState,
  RateLimitConfig,
  PasswordStrength,
  PasswordRequirement,
  AuthStatus,
  AuthState
} from './types/auth.types'

// Lib
export * from './lib/auth-errors'
export * from './lib/auth-schemas'
export * from './lib/password-validation'
export * from './lib/oauth.config'
