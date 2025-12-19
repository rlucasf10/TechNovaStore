/**
 * Página de Login
 * 
 * Implementa el formulario de inicio de sesión con:
 * - Validación con React Hook Form y Zod
 * - Integración con authService
 * - Toggle de mostrar/ocultar contraseña
 * - Checkbox "Recordarme"
 * - Links a recuperación de contraseña y registro
 * - Botones de OAuth (Google, GitHub)
 * - Mensajes de error claros
 * - Loading states
 * 
 * Requisitos: 20.1, 20.6
 */

'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout, AuthDivider, RateLimitMessage, SocialLoginButtons } from '@/customer';
import { loginSchema, type LoginFormData } from '@/customer';
import { authService } from '@/customer';
import type { AuthError } from '@/customer';
import { useAuthStore } from '@/customer';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';
import { useRouter } from 'next/navigation';
import { useLoginRateLimit } from '@/hooks/useRateLimit';
import { secureLogger } from '@/shared/lib/security';

// ============================================================================
// Funciones de utilidad
// ============================================================================

/**
 * Valida que una URL de redirección sea segura
 * Solo permite rutas internas (que empiecen con /)
 * Previene ataques de Open Redirect
 */
function validateRedirectUrl(url: string | null): string | null {
  if (!url) return null;
  
  // Solo permitir rutas que empiecen con /
  if (!url.startsWith('/')) {
    console.warn('🔒 URL de redirección rechazada (no es ruta interna):', url);
    return null;
  }
  
  // No permitir // (protocolo relativo) que podría redirigir a dominios externos
  if (url.startsWith('//')) {
    console.warn('🔒 URL de redirección rechazada (protocolo relativo):', url);
    return null;
  }
  
  // No permitir javascript: o data: URLs
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.startsWith('javascript:') || lowerUrl.startsWith('data:')) {
    console.warn('🔒 URL de redirección rechazada (esquema peligroso):', url);
    return null;
  }
  
  // Lista blanca de rutas permitidas (opcional, más restrictivo)
  const allowedPaths = [
    '/dashboard/usuario',
    '/dashboard/admin',
    '/checkout',
    '/carrito',
    '/productos',
    '/pedidos',
    '/perfil',
    '/notificaciones',
  ];
  
  // Verificar si la ruta está en la lista blanca o es una subruta
  const isAllowed = allowedPaths.some(path => 
    url === path || url.startsWith(`${path}/`) || url.startsWith(`${path}?`)
  );
  
  if (!isAllowed) {
    console.warn('🔒 URL de redirección rechazada (no está en lista blanca):', url);
    return null;
  }
  
  secureLogger.log('✅ URL de redirección validada:', url);
  return url;
}

// ============================================================================
// Componente LoginPage
// ============================================================================

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  // Estados locales
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectingUser, setRedirectingUser] = useState<{ name: string; role: string } | null>(null);

  // Rate limiting
  const rateLimit = useLoginRateLimit({
    onExpire: () => {
      // El componente RateLimitMessage se ocultará automáticamente
    },
    onLimitReached: () => {
      setAuthError(null); // Limpiar error general cuando se activa rate limit
    },
  });

  // Obtener mensajes de query params
  const successParam = searchParams.get('success');
  const resetParam = searchParams.get('reset');
  const messageParam = searchParams.get('message');
  const errorParam = searchParams.get('error');
  
  // Determinar el mensaje de éxito a mostrar
  let successMessage: string | null = null;
  if (resetParam === 'success') {
    successMessage = '✓ Contraseña actualizada exitosamente. Inicia sesión con tu nueva contraseña.';
  } else if (successParam) {
    successMessage = successParam;
  }

  // Mensaje informativo (ej: después de OAuth con email existente)
  let infoMessage: string | null = null;
  if (messageParam && !errorParam) {
    infoMessage = decodeURIComponent(messageParam);
  }

  // Configurar React Hook Form con Zod
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // ============================================================================
  // Handlers
  // ============================================================================

  /**
   * Manejar envío del formulario de login
   */
  const onSubmit = async (data: LoginFormData) => {
    // Verificar rate limiting antes de proceder
    const { allowed } = rateLimit.checkLimit();
    if (!allowed) {
      return; // El hook ya maneja la notificación
    }

    try {
      setIsLoading(true);
      setAuthError(null);

      // Intentar login
      const user = await authService.login({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });

      // Login exitoso - resetear rate limiting
      rateLimit.reset();

      // Actualizar estado global
      setUser(user);
      queryClient.setQueryData(queryKeys.auth.user, user);

      // Mostrar pantalla de redirección
      setIsRedirecting(true);
      setRedirectingUser({ name: user.firstName || user.email, role: user.role });

      // Pequeña pausa para mostrar el mensaje de éxito
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Verificar si hay una URL de redirección guardada
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
      
      // Validar que la URL sea segura (solo rutas internas)
      const safeRedirectUrl = validateRedirectUrl(redirectUrl);
      
      if (safeRedirectUrl) {
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(safeRedirectUrl);
      } else {
        // Redirigir según el rol del usuario
        if (user.role === 'admin') {
          router.push('/dashboard/admin');
        } else {
          router.push('/dashboard/usuario');
        }
      }
    } catch (error) {
      // ✅ SEGURIDAD: Usar secureLogger para sanitizar automáticamente datos sensibles
      secureLogger.log('🔍 Login page caught error');
      const authError = error as AuthError;
      secureLogger.log('🔍 Processed auth error:', { code: authError.code, message: authError.message });
      
      // NOTA: No llamar rateLimit.recordAttempt() aquí porque authService ya lo hace
      // Esto evita contar doble los intentos fallidos
      
      // Mostrar error (excepto si es rate limiting, que se maneja automáticamente)
      if (authError.code !== 'rate-limit-exceeded') {
        const errorMessage = authError.message || 'Error al iniciar sesión. Intenta de nuevo.';
        setAuthError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Manejar error de OAuth
   */
  const handleOAuthError = (error: Error) => {
    setAuthError(error.message || 'Error al iniciar sesión con OAuth. Intenta de nuevo.');
  };

  // ============================================================================
  // Render
  // ============================================================================

  // Mostrar pantalla de redirección después de login exitoso
  if (isRedirecting && redirectingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          {/* Icono de éxito animado */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Título */}
          <h2 className="text-2xl font-semibold mb-2 text-gray-900">
            ¡Bienvenido, {redirectingUser.name}!
          </h2>
          
          {/* Subtítulo según rol */}
          <p className="text-gray-600 mb-6">
            {redirectingUser.role === 'admin' 
              ? 'Accediendo al panel de administración...'
              : 'Redirigiendo a tu dashboard...'}
          </p>

          {/* Spinner de carga */}
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>

          {/* Badge de rol */}
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
            {redirectingUser.role === 'admin' ? '👑 Administrador' : '👤 Usuario'}
          </div>

          {/* Indicador de seguridad */}
          <div className="mt-6 flex items-center justify-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Inicio de sesión seguro</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout
      title="Bienvenido de nuevo"
      subtitle="Inicia sesión en tu cuenta de TechNovaStore"
    >
      <div className="space-y-6">
        {/* Mensaje de éxito (ej: contraseña actualizada) */}
        {successMessage && (
          <div className="rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 p-4 shadow-sm animate-[fade-in-down_0.5s_ease-out]">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-semibold text-green-900 mb-1">
                  ¡Contraseña actualizada!
                </h3>
                <p className="text-sm text-green-800">
                  Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje informativo (ej: vincular cuenta OAuth) */}
        {infoMessage && !successMessage && (
          <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 p-4 shadow-sm animate-[fade-in-down_0.5s_ease-out]">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Vincula tu cuenta
                </h3>
                <p className="text-sm text-blue-800">
                  {infoMessage}
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  Después de iniciar sesión, podrás vincular tu cuenta desde el Dashboard.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Estilos para animación */}
        <style jsx>{`
          @keyframes fade-in-down {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>

        {/* Mensaje de rate limiting */}
        {rateLimit.isBlocked && (
          <RateLimitMessage
            remainingTime={rateLimit.remainingTime}
            action="login"
            onExpire={() => {
              // El hook ya maneja la expiración
            }}
          />
        )}

        {/* Mensaje de error general */}
        {authError && !rateLimit.isBlocked && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-red-400 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm font-medium text-red-800">{authError}</p>
            </div>
          </div>
        )}

        {/* Formulario de Login */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Campo de Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Correo electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              </div>
              <input
                {...register('email')}
                id="email"
                type="email"
                autoComplete="email"
                className={`block w-full pl-10 pr-3 py-3 border ${errors.email ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-slate-600'
                  } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100`}
                placeholder="tu@email.com"
                disabled={isLoading}
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
            </div>
            {errors.email && (
              <p id="email-error" className="text-sm text-red-600 dark:text-red-400 flex items-center mt-1">
                <svg
                  className="h-4 w-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Campo de Contraseña */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <input
                {...register('password')}
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={`block w-full pl-10 pr-12 py-3 border ${errors.password ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-slate-600'
                  } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100`}
                placeholder="••••••••"
                disabled={isLoading}
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                disabled={isLoading}
                aria-label="Mostrar contraseña"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-sm text-red-600 dark:text-red-400 flex items-center mt-1">
                <svg
                  className="h-4 w-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Recordarme y Olvidaste tu contraseña */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                {...register('rememberMe')}
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-slate-600 rounded cursor-pointer dark:bg-slate-700"
                disabled={isLoading}
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                Recordarme
              </label>
            </div>
            <Link
              href="/recuperar-contrasena"
              className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Botón de Submit */}
          <button
            type="submit"
            disabled={isLoading || isSubmitting || rateLimit.isBlocked}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading || isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Iniciando sesión...
              </>
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </form>

        {/* Divider */}
        <AuthDivider text="O continúa con" />

        {/* Botones de OAuth */}
        <SocialLoginButtons
          redirectTo="/dashboard/usuario"
          onError={handleOAuthError}
          disabled={isLoading || rateLimit.isBlocked}
        />

        {/* Link a Registro */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ¿No tienes una cuenta?{' '}
            <Link
              href="/registro"
              className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition-colors"
            >
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
