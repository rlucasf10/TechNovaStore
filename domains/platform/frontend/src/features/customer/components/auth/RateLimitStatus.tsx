/**
 * Componente RateLimitStatus
 * 
 * Muestra el estado actual de rate limiting para diferentes acciones.
 * Útil para mostrar en el dashboard de usuario o configuración de seguridad.
 * 
 * Características:
 * - Estado de múltiples acciones (login, forgot password, etc.)
 * - Información de intentos restantes
 * - Tiempo hasta el reset
 * - Botón para resetear manualmente (solo para admins)
 * 
 * Requisitos: 23.10
 */

'use client';

import React from 'react';
import { useRateLimit, RATE_LIMIT_CONFIGS } from '@/hooks/useRateLimit';

// ============================================================================
// Tipos
// ============================================================================

interface RateLimitStatusProps {
  /** Mostrar solo acciones específicas */
  actions?: Array<keyof typeof RATE_LIMIT_CONFIGS>;
  /** Permitir reset manual (solo para admins) */
  allowReset?: boolean;
  /** Clase CSS adicional */
  className?: string;
}

interface ActionStatusProps {
  action: keyof typeof RATE_LIMIT_CONFIGS;
  allowReset?: boolean;
}

// ============================================================================
// Componente ActionStatus
// ============================================================================

function ActionStatus({ action, allowReset = false }: ActionStatusProps) {
  const rateLimit = useRateLimit(action, {
    config: RATE_LIMIT_CONFIGS[action],
  });

  const getActionLabel = (action: string): string => {
    const labels = {
      login: 'Inicio de sesión',
      forgotPassword: 'Recuperación de contraseña',
      register: 'Registro',
      changePassword: 'Cambio de contraseña',
    };
    return labels[action as keyof typeof labels] || action;
  };

  const getActionIcon = (action: string): React.ReactNode => {
    const icons = {
      login: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
      ),
      forgotPassword: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      register: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      changePassword: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    };
    return icons[action as keyof typeof icons] || (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes < 60) {
      return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const config = RATE_LIMIT_CONFIGS[action];
  const remainingAttempts = Math.max(0, config.maxAttempts - rateLimit.attempts);

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${rateLimit.isBlocked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
          {getActionIcon(action)}
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-900">
            {getActionLabel(action)}
          </h4>
          <p className="text-xs text-gray-500">
            {rateLimit.isBlocked ? (
              <>
                <span className="text-red-600 font-medium">Bloqueado</span>
                {' • '}
                <span>Se desbloquea en {formatTime(rateLimit.remainingTime)}</span>
              </>
            ) : (
              <>
                <span className="text-green-600 font-medium">Disponible</span>
                {rateLimit.attempts > 0 && (
                  <>
                    {' • '}
                    <span>{remainingAttempts} intentos restantes</span>
                  </>
                )}
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {/* Indicador visual de intentos */}
        <div className="flex space-x-1">
          {Array.from({ length: config.maxAttempts }).map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index < rateLimit.attempts
                  ? 'bg-red-400'
                  : 'bg-gray-200'
              }`}
              title={`Intento ${index + 1}`}
            />
          ))}
        </div>

        {/* Botón de reset (solo para admins) */}
        {allowReset && rateLimit.attempts > 0 && (
          <button
            onClick={() => rateLimit.reset()}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
            title="Resetear contador de intentos"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Componente RateLimitStatus
// ============================================================================

export function RateLimitStatus({
  actions = ['login', 'forgotPassword'],
  allowReset = false,
  className = '',
}: RateLimitStatusProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Estado de Seguridad
        </h3>
        <div className="flex items-center text-xs text-gray-500">
          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Límites de intentos por seguridad
        </div>
      </div>

      <div className="space-y-2">
        {actions.map((action) => (
          <ActionStatus
            key={action}
            action={action}
            allowReset={allowReset}
          />
        ))}
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start">
          <svg className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">¿Por qué existen estos límites?</p>
            <p className="text-xs leading-relaxed">
              Estos límites protegen tu cuenta contra intentos de acceso no autorizado.
              Si alcanzas el límite, deberás esperar antes de intentar nuevamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RateLimitStatus;