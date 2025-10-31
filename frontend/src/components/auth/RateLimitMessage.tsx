/**
 * Componente RateLimitMessage
 * 
 * Muestra un mensaje de rate limiting con countdown timer visual.
 * Se usa cuando el usuario excede el límite de intentos de login o
 * solicitudes de recuperación de contraseña.
 * 
 * Características:
 * - Countdown timer en tiempo real
 * - Barra de progreso visual
 * - Mensaje claro y accionable
 * - Animación de entrada
 * - Icono de advertencia
 * 
 * Requisitos: 23.10
 */

'use client';

import React, { useState, useEffect } from 'react';

// ============================================================================
// Tipos
// ============================================================================

interface RateLimitMessageProps {
  /** Tiempo restante en segundos */
  remainingTime: number;
  /** Tipo de acción limitada */
  action: 'login' | 'forgotPassword' | 'register' | 'changePassword';
  /** Callback cuando el tiempo expira */
  onExpire?: () => void;
  /** Clase CSS adicional */
  className?: string;
}

// ============================================================================
// Componente RateLimitMessage
// ============================================================================

export function RateLimitMessage({
  remainingTime: initialTime,
  action,
  onExpire,
  className = '',
}: RateLimitMessageProps) {
  const [remainingTime, setRemainingTime] = useState(initialTime);

  // ============================================================================
  // Efectos
  // ============================================================================

  /**
   * Countdown timer
   */
  useEffect(() => {
    if (remainingTime <= 0) {
      onExpire?.();
      return;
    }

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(timer);
          onExpire?.();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingTime, onExpire]);

  // ============================================================================
  // Utilidades
  // ============================================================================

  /**
   * Formatear tiempo restante en formato MM:SS
   */
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Calcular porcentaje de progreso (para barra visual)
   */
  const getProgressPercentage = (): number => {
    let totalTime: number;
    switch (action) {
      case 'login':
        totalTime = 15 * 60; // 15 minutos
        break;
      case 'forgotPassword':
        totalTime = 60 * 60; // 1 hora
        break;
      case 'register':
        totalTime = 10 * 60; // 10 minutos
        break;
      case 'changePassword':
        totalTime = 30 * 60; // 30 minutos
        break;
      default:
        totalTime = 15 * 60; // Por defecto 15 minutos
    }
    return ((totalTime - remainingTime) / totalTime) * 100;
  };

  /**
   * Obtener mensaje según el tipo de acción
   */
  const getMessage = (): string => {
    switch (action) {
      case 'login':
        return 'Demasiados intentos de inicio de sesión. Por seguridad, tu cuenta ha sido bloqueada temporalmente.';
      case 'forgotPassword':
        return 'Has excedido el límite de solicitudes de recuperación de contraseña. Por favor, espera antes de intentar nuevamente.';
      case 'register':
        return 'Demasiados intentos de registro. Por seguridad, el registro ha sido bloqueado temporalmente.';
      case 'changePassword':
        return 'Demasiados intentos de cambio de contraseña. Por seguridad, esta función ha sido bloqueada temporalmente.';
      default:
        return 'Has excedido el límite de intentos. Por favor, espera antes de intentar nuevamente.';
    }
  };

  /**
   * Obtener título según el tipo de acción
   */
  const getTitle = (): string => {
    switch (action) {
      case 'login':
        return 'Cuenta bloqueada temporalmente';
      case 'forgotPassword':
        return 'Límite de solicitudes alcanzado';
      case 'register':
        return 'Registro bloqueado temporalmente';
      case 'changePassword':
        return 'Cambio de contraseña bloqueado';
      default:
        return 'Límite de intentos alcanzado';
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (remainingTime <= 0) {
    return null;
  }

  return (
    <div
      className={`rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 p-5 shadow-md animate-[fade-in-down_0.5s_ease-out] ${className}`}
      role="alert"
      aria-live="polite"
    >
      {/* Header con icono y título */}
      <div className="flex items-start mb-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center animate-pulse">
            <svg
              className="h-7 w-7 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-base font-bold text-amber-900 mb-1">
            {getTitle()}
          </h3>
          <p className="text-sm text-amber-800 leading-relaxed">
            {getMessage()}
          </p>
        </div>
      </div>

      {/* Countdown timer prominente */}
      <div className="bg-white rounded-lg p-4 mb-4 border border-amber-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Tiempo restante:
          </span>
          <span
            className="text-2xl font-bold text-amber-600 tabular-nums"
            aria-label={`${remainingTime} segundos restantes`}
          >
            {formatTime(remainingTime)}
          </span>
        </div>

        {/* Barra de progreso */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 to-orange-500 h-2.5 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${getProgressPercentage()}%` }}
            role="progressbar"
            aria-valuenow={getProgressPercentage()}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progreso del tiempo de espera"
          />
        </div>
      </div>

      {/* Mensaje de ayuda */}
      <div className="flex items-start bg-amber-100 rounded-lg p-3">
        <svg
          className="h-5 w-5 text-amber-700 mr-2 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="text-sm text-amber-800">
          <p className="font-medium mb-1">¿Por qué veo esto?</p>
          <p className="text-xs leading-relaxed">
            Esta medida de seguridad protege contra intentos automatizados y abuso del sistema.
            {action === 'login' && ' Si olvidaste tu contraseña, usa la opción "¿Olvidaste tu contraseña?" después de que expire el tiempo.'}
            {action === 'register' && ' Si ya tienes una cuenta, puedes iniciar sesión mientras tanto.'}
            {action === 'changePassword' && ' Puedes seguir usando tu cuenta normalmente con tu contraseña actual.'}
          </p>
        </div>
      </div>

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
    </div>
  );
}

export default RateLimitMessage;
