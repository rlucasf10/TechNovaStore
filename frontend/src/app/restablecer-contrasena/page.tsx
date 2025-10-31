/**
 * Página de Restablecimiento de Contraseña (Paso 2)
 * 
 * Implementa el formulario para restablecer contraseña con token:
 * - Extrae token de URL query params
 * - Valida token al cargar página (GET /api/auth/validate-reset-token)
 * - Muestra formulario si token es válido
 * - Muestra error y botón "Solicitar nuevo link" si token inválido/expirado
 * - Input de nueva password con PasswordStrengthIndicator
 * - Input de confirmar password
 * - Valida que passwords coincidan
 * - Integra con endpoint POST /api/auth/reset-password
 * 
 * Requisitos: 23.4, 23.5, 23.6, 23.7, 23.9
 */

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthLayout, PasswordStrengthIndicator } from '@/components/auth';
import { authService } from '@/services/auth.service';
import type { AuthError } from '@/types/auth.types';

// ============================================================================
// Schema de Validación
// ============================================================================

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número')
      .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ============================================================================
// Estados de Validación del Token
// ============================================================================

type TokenValidationState = 'validating' | 'valid' | 'invalid' | 'expired' | 'success';

// ============================================================================
// Componente ResetPasswordContent (con acceso a useSearchParams)
// ============================================================================

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Estados locales
  const [tokenState, setTokenState] = useState<TokenValidationState>('validating');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Configurar React Hook Form con Zod
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Observar el valor de password para el indicador de fortaleza
  const passwordValue = watch('password');

  // ============================================================================
  // Validar Token al Cargar
  // ============================================================================

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenState('invalid');
        return;
      }

      try {
        const isValid = await authService.validateResetToken(token);
        setTokenState(isValid ? 'valid' : 'invalid');
      } catch (error) {
        const authError = error as AuthError;
        
        // Distinguir entre token expirado e inválido
        if (authError.code === 'token-expired') {
          setTokenState('expired');
        } else {
          setTokenState('invalid');
        }
      }
    };

    validateToken();
  }, [token]);

  // ============================================================================
  // Countdown para Auto-redirección
  // ============================================================================

  useEffect(() => {
    if (tokenState === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [tokenState, countdown]);

  // ============================================================================
  // Handlers
  // ============================================================================

  /**
   * Manejar envío del formulario
   */
  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setAuthError('Token no encontrado');
      return;
    }

    try {
      setIsLoading(true);
      setAuthError(null);

      // Restablecer contraseña
      await authService.resetPassword({
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      // Cambiar estado a 'success' para mostrar modal de confirmación
      setTokenState('success' as TokenValidationState);
      
      // Auto-redirigir después de 3 segundos
      setTimeout(() => {
        router.push('/login?reset=success');
      }, 3000);
    } catch (error) {
      const authError = error as AuthError;
      
      // Manejar errores específicos
      if (authError.code === 'token-expired') {
        setTokenState('expired');
      } else if (authError.code === 'invalid-token') {
        setTokenState('invalid');
      } else {
        setAuthError(authError.message || 'Ocurrió un error. Por favor, intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Solicitar nuevo link de recuperación
   */
  const handleRequestNewLink = () => {
    router.push('/recuperar-contrasena');
  };

  // ============================================================================
  // Render - Estado de Validación
  // ============================================================================

  if (tokenState === 'validating') {
    return (
      <AuthLayout
        title="Validando enlace..."
        subtitle="Por favor espera mientras verificamos tu enlace de recuperación"
        showBackToHome={false}
      >
        <div className="flex flex-col items-center justify-center py-12">
          {/* Spinner de carga */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-primary-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-6 text-sm text-gray-600">Verificando enlace...</p>
        </div>
      </AuthLayout>
    );
  }

  // ============================================================================
  // Render - Token Inválido o Expirado
  // ============================================================================

  if (tokenState === 'invalid' || tokenState === 'expired') {
    const isExpired = tokenState === 'expired';

    return (
      <AuthLayout
        title={isExpired ? 'Enlace expirado' : 'Enlace inválido'}
        subtitle={
          isExpired
            ? 'Este enlace de recuperación ha expirado'
            : 'Este enlace de recuperación no es válido'
        }
        showBackToHome={false}
      >
        <div className="space-y-6">
          {/* Icono de error */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
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
            </div>
          </div>

          {/* Mensaje de error */}
          <div className="text-center space-y-3">
            <p className="text-gray-700">
              {isExpired
                ? 'El enlace de recuperación ha expirado por seguridad. Los enlaces son válidos por 1 hora.'
                : 'El enlace de recuperación no es válido. Es posible que ya lo hayas usado o que haya sido generado incorrectamente.'}
            </p>
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0"
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
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">¿Qué puedes hacer?</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Solicita un nuevo enlace de recuperación</li>
                  <li>Verifica que hayas copiado el enlace completo del email</li>
                  <li>Asegúrate de usar el enlace más reciente</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botón para solicitar nuevo link */}
          <div className="pt-4">
            <button
              type="button"
              onClick={handleRequestNewLink}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Solicitar nuevo enlace
            </button>
          </div>

          {/* Link para volver al login */}
          <div className="text-center pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // ============================================================================
  // Render - Confirmación de Éxito
  // ============================================================================

  if (tokenState === 'success') {
    return (
      <AuthLayout
        title="¡Contraseña actualizada!"
        subtitle="Tu contraseña ha sido restablecida exitosamente"
        showBackToHome={false}
      >
        <div className="space-y-6">
          {/* Icono de éxito animado */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Círculo de fondo con animación de escala */}
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-[scale-in_0.3s_ease-out]">
                {/* Checkmark animado */}
                <svg
                  className="w-12 h-12 text-green-600 animate-[check-draw_0.5s_ease-out_0.2s_forwards]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{
                    strokeDasharray: 50,
                    strokeDashoffset: 50,
                  }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              {/* Anillo exterior con animación de pulso */}
              <div className="absolute inset-0 w-24 h-24 bg-green-200 rounded-full animate-ping opacity-20"></div>
            </div>
          </div>

          {/* Mensaje de confirmación */}
          <div className="text-center space-y-3">
            <h3 className="text-xl font-semibold text-gray-900">
              ¡Todo listo!
            </h3>
            <p className="text-gray-700">
              Tu contraseña ha sido actualizada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.
            </p>
          </div>

          {/* Información de seguridad */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Tu cuenta está segura</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Tu contraseña ha sido encriptada</li>
                  <li>El enlace de recuperación ha sido invalidado</li>
                  <li>Recibirás un email de confirmación</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contador de redirección */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-3">
              <div className="relative w-10 h-10">
                {/* Círculo de progreso */}
                <svg className="w-10 h-10 transform -rotate-90">
                  <circle
                    cx="20"
                    cy="20"
                    r="18"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="18"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-primary-600 transition-all duration-1000"
                    strokeDasharray={`${2 * Math.PI * 18}`}
                    strokeDashoffset={`${2 * Math.PI * 18 * (countdown / 3)}`}
                    strokeLinecap="round"
                  />
                </svg>
                {/* Número del countdown */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary-600">{countdown}</span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>Redirigiendo al inicio de sesión...</p>
              </div>
            </div>
          </div>

          {/* Botón para ir inmediatamente */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => router.push('/login?reset=success')}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              Ir al inicio de sesión ahora
            </button>
          </div>
        </div>

        {/* Estilos para las animaciones */}
        <style jsx>{`
          @keyframes scale-in {
            from {
              transform: scale(0);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }

          @keyframes check-draw {
            to {
              stroke-dashoffset: 0;
            }
          }
        `}</style>
      </AuthLayout>
    );
  }

  // ============================================================================
  // Render - Formulario de Restablecimiento
  // ============================================================================

  return (
    <AuthLayout
      title="Restablecer contraseña"
      subtitle="Ingresa tu nueva contraseña"
      showBackToHome={false}
    >
      <div className="space-y-6">
        {/* Mensaje de error */}
        {authError && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-red-400 mr-3 flex-shrink-0"
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

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Campo de Nueva Contraseña */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Nueva contraseña
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
                autoFocus
                className={`block w-full pl-10 pr-12 py-3 border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-gray-400`}
                placeholder="Ingresa tu nueva contraseña"
                disabled={isLoading}
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
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
          </div>

          {/* Indicador de Fortaleza de Contraseña */}
          {passwordValue && (
            <PasswordStrengthIndicator password={passwordValue} className="mt-3" />
          )}

          {/* Campo de Confirmar Contraseña */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirmar contraseña
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <input
                {...register('confirmPassword')}
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`block w-full pl-10 pr-12 py-3 border ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-gray-400`}
                placeholder="Confirma tu nueva contraseña"
                disabled={isLoading}
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
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
              <p id="confirm-password-error" className="text-sm text-red-600 flex items-center mt-1">
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
          </div>

          {/* Información de seguridad */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">Tu contraseña será encriptada</p>
                <p className="text-green-700">
                  Usamos encriptación de nivel bancario para proteger tu información.
                  Nunca almacenamos contraseñas en texto plano.
                </p>
              </div>
            </div>
          </div>

          {/* Botón de Submit */}
          <button
            type="submit"
            disabled={isLoading || isSubmitting}
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
                Restableciendo contraseña...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 mr-2"
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
                Restablecer contraseña
              </>
            )}
          </button>
        </form>

        {/* Link para volver al login */}
        <div className="text-center pt-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

// ============================================================================
// Componente Principal con Suspense
// ============================================================================

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout
          title="Cargando..."
          subtitle="Por favor espera"
          showBackToHome={false}
        >
          <div className="flex justify-center py-12">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-primary-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
          </div>
        </AuthLayout>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
