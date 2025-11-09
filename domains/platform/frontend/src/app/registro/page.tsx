/**
 * Página de Registro
 * 
 * Implementa el formulario de registro con:
 * - Validación con React Hook Form y Zod
 * - Integración con authService
 * - PasswordStrengthIndicator para validación visual
 * - Validación en tiempo real de confirmación de contraseña
 * - Checkbox obligatorio de términos y condiciones
 * - Toggle de mostrar/ocultar contraseña
 * - Botones de OAuth (Google, GitHub)
 * - Mensajes de error claros
 * - Loading states
 * 
 * Requisitos: 20.1, 20.6, 20.7
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout, AuthDivider, RateLimitMessage, PasswordStrengthIndicator, SocialLoginButtons } from '@/customer';
import { useAuth } from '@/customer';
import { registerSchema, type RegisterFormData } from '@/customer';
import type { AuthError } from '@/customer';
import { useRegisterRateLimit } from '@/hooks/useRateLimit';

// ============================================================================
// Componente RegistroPage
// ============================================================================

export default function RegistroPage() {
  // Estados locales
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Hook de autenticación
  const { register: registerUser } = useAuth();

  // Rate limiting para registro
  const rateLimit = useRegisterRateLimit({
    onExpire: () => {
      // El componente RateLimitMessage se ocultará automáticamente
    },
    onLimitReached: () => {
      setAuthError(null); // Limpiar error general cuando se activa rate limit
    },
  });

  // Configurar React Hook Form con Zod
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
    mode: 'onChange', // Validar en tiempo real
  });

  // Observar el valor de password para el PasswordStrengthIndicator
  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  // ============================================================================
  // Handlers
  // ============================================================================

  /**
   * Manejar envío del formulario de registro
   */
  const onSubmit = async (data: RegisterFormData) => {
    // Verificar rate limiting antes de proceder
    const { allowed } = rateLimit.checkLimit();
    if (!allowed) {
      return; // El hook ya maneja la notificación
    }

    try {
      setIsLoading(true);
      setAuthError(null);

      // Intentar registro usando el hook useAuth
      await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });

      // Registro exitoso - resetear rate limiting
      rateLimit.reset();

      // El hook useAuth redirige automáticamente al dashboard después del registro exitoso
    } catch (error) {
      const authError = error as AuthError;
      
      // Registrar intento fallido para rate limiting
      rateLimit.recordAttempt();
      
      // Mostrar error (excepto si es rate limiting, que se maneja automáticamente)
      if (authError.code !== 'rate-limit-exceeded') {
        setAuthError(authError.message || 'Error al crear la cuenta. Intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Manejar error de OAuth
   */
  const handleOAuthError = (error: Error) => {
    setAuthError(error.message || 'Error al registrarse con OAuth. Intenta de nuevo.');
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <AuthLayout
      title="Crea tu cuenta"
      subtitle="Únete a TechNovaStore y disfruta de ofertas exclusivas"
    >
      <div className="space-y-6">
        {/* Mensaje de rate limiting */}
        {rateLimit.isBlocked && (
          <div className="space-y-4">
            <RateLimitMessage
              remainingTime={rateLimit.remainingTime}
              action="register"
              onExpire={() => {
                // El hook ya maneja la expiración
              }}
            />
            
            {/* Botón de desarrollo para resetear rate limiting */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    rateLimit.resetAll();
                    window.location.reload();
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  🧹 [DEV] Resetear Rate Limiting
                </button>
              </div>
            )}
          </div>
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

        {/* Formulario de Registro */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Nombre y Apellidos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Campo de Nombre */}
            <div className="space-y-2">
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                Nombre *
              </label>
              <input
                {...register('firstName')}
                id="firstName"
                type="text"
                autoComplete="given-name"
                className={`block w-full px-4 py-3 border ${errors.firstName ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-gray-400`}
                placeholder="Juan"
                disabled={isLoading}
                aria-invalid={errors.firstName ? 'true' : 'false'}
                aria-describedby={errors.firstName ? 'firstName-error' : undefined}
              />
              {errors.firstName && (
                <p id="firstName-error" className="text-sm text-red-600 flex items-center mt-1">
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
                  {errors.firstName.message}
                </p>
              )}
            </div>

            {/* Campo de Apellidos */}
            <div className="space-y-2">
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Apellidos *
              </label>
              <input
                {...register('lastName')}
                id="lastName"
                type="text"
                autoComplete="family-name"
                className={`block w-full px-4 py-3 border ${errors.lastName ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-gray-400`}
                placeholder="Pérez García"
                disabled={isLoading}
                aria-invalid={errors.lastName ? 'true' : 'false'}
                aria-describedby={errors.lastName ? 'lastName-error' : undefined}
              />
              {errors.lastName && (
                <p id="lastName-error" className="text-sm text-red-600 flex items-center mt-1">
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
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Campo de Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo electrónico *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
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
                className={`block w-full pl-10 pr-3 py-3 border ${errors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-gray-400`}
                placeholder="tu@email.com"
                disabled={isLoading}
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
            </div>
            {errors.email && (
              <p id="email-error" className="text-sm text-red-600 flex items-center mt-1">
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

          {/* Campo de Contraseña con PasswordStrengthIndicator */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
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
                autoComplete="new-password"
                className={`block w-full pl-10 pr-12 py-3 border ${errors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-gray-400`}
                placeholder="Mínimo 8 caracteres"
                disabled={isLoading}
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isLoading}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
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
              <p id="password-error" className="text-sm text-red-600 flex items-center mt-1">
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

            {/* Indicador de fortaleza de contraseña */}
            {password && password.length > 0 && (
              <PasswordStrengthIndicator password={password} className="mt-3" />
            )}
          </div>

          {/* Campo de Confirmar Contraseña con validación en tiempo real */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirmar contraseña *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className={`h-5 w-5 transition-colors ${confirmPassword && password === confirmPassword
                    ? 'text-green-500'
                    : 'text-gray-400'
                    }`}
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
              <input
                {...register('confirmPassword')}
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`block w-full pl-10 pr-12 py-3 border ${errors.confirmPassword
                  ? 'border-red-300'
                  : confirmPassword && password === confirmPassword
                    ? 'border-green-300'
                    : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-gray-400`}
                placeholder="Repite tu contraseña"
                disabled={isLoading}
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isLoading}
                aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showConfirmPassword ? (
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
            {errors.confirmPassword && (
              <p
                id="confirmPassword-error"
                className="text-sm text-red-600 flex items-center mt-1"
              >
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
                {errors.confirmPassword.message}
              </p>
            )}
            {/* Indicador visual de coincidencia en tiempo real */}
            {confirmPassword && confirmPassword.length > 0 && !errors.confirmPassword && (
              <p
                className={`text-sm flex items-center mt-1 ${password === confirmPassword ? 'text-green-600' : 'text-gray-500'
                  }`}
              >
                {password === confirmPassword ? (
                  <>
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Las contraseñas coinciden
                  </>
                ) : (
                  <>
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Las contraseñas no coinciden
                  </>
                )}
              </p>
            )}
          </div>

          {/* Checkbox de Términos y Condiciones (obligatorio) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start">
              <input
                {...register('acceptTerms')}
                id="acceptTerms"
                type="checkbox"
                className={`h-4 w-4 mt-0.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer ${errors.acceptTerms ? 'border-red-300' : ''
                  }`}
                disabled={isLoading}
                aria-invalid={errors.acceptTerms ? 'true' : 'false'}
                aria-describedby={errors.acceptTerms ? 'acceptTerms-error' : undefined}
              />
              <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Acepto los{' '}
                <Link
                  href="/terminos"
                  className="text-primary-600 hover:text-primary-500 font-medium underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  términos y condiciones
                </Link>
                {' '}y la{' '}
                <Link
                  href="/privacy-policy"
                  className="text-primary-600 hover:text-primary-500 font-medium underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  política de privacidad
                </Link>
                {' *'}
              </label>
            </div>
            {errors.acceptTerms && (
              <p id="acceptTerms-error" className="text-sm text-red-600 flex items-center ml-6">
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
                {errors.acceptTerms.message}
              </p>
            )}
          </div>

          {/* Botón de Submit con loading state */}
          <button
            type="submit"
            disabled={isLoading || isSubmitting || rateLimit.isBlocked}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
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
                Creando cuenta...
              </>
            ) : (
              'Crear cuenta'
            )}
          </button>
        </form>

        {/* Divider */}
        <AuthDivider text="O regístrate con" />

        {/* Botones de OAuth */}
        <SocialLoginButtons
          redirectTo="/dashboard"
          onError={handleOAuthError}
          disabled={isLoading || rateLimit.isBlocked}
        />

        {/* Link a Login */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            ¿Ya tienes una cuenta?{' '}
            <Link
              href="/login"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
