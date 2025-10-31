/**
 * Página de Recuperación de Contraseña (Paso 1)
 * 
 * Implementa el formulario para solicitar recuperación de contraseña:
 * - Input de email con validación
 * - Integración con endpoint POST /api/auth/forgot-password
 * - Mensaje de éxito después de enviar
 * - Link para volver al inicio de sesión
 * - Rate limiting visual
 * - Mensajes de error claros
 * 
 * Requisitos: 23.1, 23.2, 23.3
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthLayout, RateLimitMessage } from '@/components/auth';
import { authService } from '@/services/auth.service';
import type { AuthError } from '@/types/auth.types';
import { useForgotPasswordRateLimit } from '@/hooks/useRateLimit';

// ============================================================================
// Schema de Validación
// ============================================================================

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es obligatorio')
    .email('Ingresa un email válido'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ============================================================================
// Componente ForgotPasswordPage
// ============================================================================

export default function ForgotPasswordPage() {
  // Estados locales
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string>('');

  // Rate limiting
  const rateLimit = useForgotPasswordRateLimit({
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
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  // ============================================================================
  // Handlers
  // ============================================================================

  /**
   * Manejar envío del formulario
   */
  const onSubmit = async (data: ForgotPasswordFormData) => {
    // Verificar rate limiting antes de proceder
    const { allowed } = rateLimit.checkLimit();
    if (!allowed) {
      return; // El hook ya maneja la notificación
    }

    try {
      setIsLoading(true);
      setAuthError(null);

      // Enviar solicitud de recuperación
      await authService.forgotPassword({ email: data.email });

      // Mostrar mensaje de éxito
      setIsSuccess(true);
      setSubmittedEmail(data.email);
    } catch (error) {
      const authError = error as AuthError;
      
      // NOTA: No llamar rateLimit.recordAttempt() aquí porque authService ya lo hace
      // Esto evita contar doble los intentos fallidos
      
      // Mostrar error (excepto si es rate limiting, que se maneja automáticamente)
      if (authError.code !== 'rate-limit-exceeded') {
        // Para otros errores, mostrar mensaje genérico por seguridad
        // (no revelar si el email existe o no)
        setAuthError('Ocurrió un error. Por favor, intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // Render - Vista de Éxito
  // ============================================================================

  if (isSuccess) {
    return (
      <AuthLayout
        title="Revisa tu email"
        subtitle="Te hemos enviado instrucciones para recuperar tu contraseña"
        showBackToHome={false}
      >
        <div className="space-y-6">
          {/* Icono de éxito */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
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
            </div>
          </div>

          {/* Mensaje de éxito */}
          <div className="text-center space-y-3">
            <p className="text-gray-700">
              Hemos enviado un email a{' '}
              <span className="font-semibold text-gray-900">{submittedEmail}</span>
            </p>
            <p className="text-sm text-gray-600">
              Haz clic en el enlace del email para restablecer tu contraseña.
              El enlace expirará en <span className="font-medium">1 hora</span>.
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
                <p className="font-medium mb-1">¿No recibiste el email?</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Revisa tu carpeta de spam o correo no deseado</li>
                  <li>Verifica que el email sea correcto</li>
                  <li>Espera unos minutos, puede tardar en llegar</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botón para volver al login */}
          <div className="pt-4">
            <Link
              href="/login"
              className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Volver al inicio de sesión
            </Link>
          </div>

          {/* Opción de reenviar */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsSuccess(false);
                setSubmittedEmail('');
              }}
              className="text-sm text-primary-600 hover:text-primary-500 font-medium transition-colors"
            >
              ¿Necesitas reenviar el email?
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // ============================================================================
  // Render - Formulario
  // ============================================================================

  return (
    <AuthLayout
      title="¿Olvidaste tu contraseña?"
      subtitle="Ingresa tu email y te enviaremos instrucciones para recuperarla"
      showBackToHome={false}
    >
      <div className="space-y-6">
        {/* Mensaje de rate limiting */}
        {rateLimit.isBlocked && (
          <RateLimitMessage
            remainingTime={rateLimit.remainingTime}
            action="forgotPassword"
            onExpire={() => {
              // El hook ya maneja la expiración
            }}
          />
        )}

        {/* Mensaje de error */}
        {authError && !rateLimit.isBlocked && (
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
          {/* Campo de Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo electrónico
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
                autoFocus
                className={`block w-full pl-10 pr-3 py-3 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
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

          {/* Información de seguridad */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0"
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
              <p className="text-sm text-gray-600">
                Por seguridad, no revelaremos si este email está registrado.
                Si existe una cuenta, recibirás un email con instrucciones.
              </p>
            </div>
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
                Enviando instrucciones...
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Enviar instrucciones
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

        {/* Link a registro */}
        <div className="text-center pt-2 border-t border-gray-200">
          <p className="text-sm text-gray-600 mt-4">
            ¿No tienes una cuenta?{' '}
            <Link
              href="/registro"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
