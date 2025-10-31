/**
 * Componente ChangePassword
 * 
 * Permite a los usuarios cambiar su contraseña desde el dashboard.
 * Incluye rate limiting para prevenir ataques de fuerza bruta.
 * 
 * Características:
 * - Validación de contraseña actual
 * - Validación de nueva contraseña con PasswordStrengthIndicator
 * - Confirmación de nueva contraseña
 * - Rate limiting (5 intentos, bloqueo de 30 minutos)
 * - Mensajes de error claros
 * - Loading states
 * 
 * Requisitos: Rate limiting para cambio de contraseña
 */

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RateLimitMessage } from '@/components/auth';
import PasswordStrengthIndicator from '@/components/auth/PasswordStrengthIndicator';
import { authService } from '@/services/auth.service';
import type { AuthError } from '@/types/auth.types';
import { useChangePasswordRateLimit } from '@/hooks/useRateLimit';

// ============================================================================
// Schema de Validación
// ============================================================================

const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'La contraseña actual es obligatoria'),
  newPassword: z
    .string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial'),
  confirmPassword: z
    .string()
    .min(1, 'Confirma tu nueva contraseña'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// ============================================================================
// Componente ChangePassword
// ============================================================================

interface ChangePasswordProps {
  className?: string;
}

export function ChangePassword({ className = '' }: ChangePasswordProps) {
  // Estados locales
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Rate limiting para cambio de contraseña
  const rateLimit = useChangePasswordRateLimit({
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
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Observar el valor de newPassword para el PasswordStrengthIndicator
  const newPassword = watch('newPassword');
  const confirmPassword = watch('confirmPassword');

  // ============================================================================
  // Handlers
  // ============================================================================

  /**
   * Manejar envío del formulario
   */
  const onSubmit = async (data: ChangePasswordFormData) => {
    // Verificar rate limiting antes de proceder
    const { allowed } = rateLimit.checkLimit();
    if (!allowed) {
      return; // El hook ya maneja la notificación
    }

    try {
      setIsLoading(true);
      setAuthError(null);
      setIsSuccess(false);

      // Cambiar contraseña
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      // Cambio exitoso - resetear rate limiting y formulario
      rateLimit.reset();
      reset();
      setIsSuccess(true);

      // Ocultar mensaje de éxito después de 5 segundos
      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);

    } catch (error) {
      const authError = error as AuthError;
      
      // Registrar intento fallido para rate limiting
      rateLimit.recordAttempt();
      
      // Mostrar error (excepto si es rate limiting, que se maneja automáticamente)
      if (authError.code !== 'rate-limit-exceeded') {
        setAuthError(authError.message || 'Error al cambiar la contraseña. Intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={`max-w-2xl ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Cambiar Contraseña
        </h3>

        <div className="space-y-6">
          {/* Mensaje de éxito */}
          {isSuccess && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-green-400 mr-3"
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
                <p className="text-sm font-medium text-green-800">
                  Contraseña cambiada exitosamente
                </p>
              </div>
            </div>
          )}

          {/* Mensaje de rate limiting */}
          {rateLimit.isBlocked && (
            <div className="space-y-4">
              <RateLimitMessage
                remainingTime={rateLimit.remainingTime}
                action="changePassword"
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

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Contraseña Actual */}
            <div className="space-y-2">
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                Contraseña Actual *
              </label>
              <div className="relative">
                <input
                  {...register('currentPassword')}
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`block w-full px-4 py-3 pr-12 border ${
                    errors.currentPassword ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-gray-400`}
                  placeholder="Ingresa tu contraseña actual"
                  disabled={isLoading || rateLimit.isBlocked}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  {showCurrentPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.currentPassword.message}
                </p>
              )}
            </div>

            {/* Nueva Contraseña */}
            <div className="space-y-2">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                Nueva Contraseña *
              </label>
              <div className="relative">
                <input
                  {...register('newPassword')}
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`block w-full px-4 py-3 pr-12 border ${
                    errors.newPassword ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-gray-400`}
                  placeholder="Mínimo 8 caracteres"
                  disabled={isLoading || rateLimit.isBlocked}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  {showNewPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.newPassword.message}
                </p>
              )}

              {/* Indicador de fortaleza de contraseña */}
              {newPassword && newPassword.length > 0 && (
                <PasswordStrengthIndicator password={newPassword} className="mt-3" />
              )}
            </div>

            {/* Confirmar Nueva Contraseña */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar Nueva Contraseña *
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`block w-full px-4 py-3 pr-12 border ${
                    errors.confirmPassword
                      ? 'border-red-300'
                      : confirmPassword && newPassword === confirmPassword
                        ? 'border-green-300'
                        : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-gray-400`}
                  placeholder="Repite tu nueva contraseña"
                  disabled={isLoading || rateLimit.isBlocked}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.confirmPassword.message}
                </p>
              )}

              {/* Indicador visual de coincidencia */}
              {confirmPassword && confirmPassword.length > 0 && !errors.confirmPassword && (
                <p className={`text-sm flex items-center mt-1 ${
                  newPassword === confirmPassword ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {newPassword === confirmPassword ? (
                    <>
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Las contraseñas coinciden
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Las contraseñas no coinciden
                    </>
                  )}
                </p>
              )}
            </div>

            {/* Botón de Submit */}
            <div className="pt-4">
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
                    Cambiando contraseña...
                  </>
                ) : (
                  'Cambiar Contraseña'
                )}
              </button>
            </div>
          </form>

          {/* Información de seguridad */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Consejos de seguridad:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Usa una contraseña única que no uses en otros sitios</li>
                  <li>Combina letras mayúsculas, minúsculas, números y símbolos</li>
                  <li>Evita información personal como nombres o fechas</li>
                  <li>Considera usar un gestor de contraseñas</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;