'use client';

import React, { useMemo } from 'react';
import { calculatePasswordStrength } from '@/lib/password-validation';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

interface StrengthConfig {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  percentage: number;
}

/**
 * Componente que muestra un indicador visual de la fortaleza de una contraseña
 * Incluye:
 * - Barra de progreso con colores (rojo/amarillo/verde)
 * - Lista de requisitos con checkmarks dinámicos
 * - Validación de: 8+ caracteres, mayúscula, minúscula, número, especial, no común
 * - Cálculo de nivel de fortaleza: Muy Débil, Débil, Media, Fuerte, Muy Fuerte
 * 
 * Usa el sistema centralizado de validación de contraseñas (@/lib/password-validation)
 */
export default function PasswordStrengthIndicator({
  password,
  className = '',
}: PasswordStrengthIndicatorProps) {
  // Usar el sistema centralizado de validación
  const strength = useMemo(() => {
    return calculatePasswordStrength(password);
  }, [password]);

  // Mapear nivel de fortaleza a configuración visual
  const strengthConfig: StrengthConfig = useMemo(() => {
    const configs = {
      'very-weak': {
        label: 'Muy Débil',
        color: 'bg-red-600',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        percentage: 0,
      },
      'weak': {
        label: 'Débil',
        color: 'bg-red-500',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        percentage: 25,
      },
      'medium': {
        label: 'Media',
        color: 'bg-yellow-500',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
        percentage: 50,
      },
      'strong': {
        label: 'Fuerte',
        color: 'bg-blue-500',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        percentage: 75,
      },
      'very-strong': {
        label: 'Muy Fuerte',
        color: 'bg-green-500',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        percentage: 100,
      },
    };

    return configs[strength.level];
  }, [strength.level]);

  // No mostrar nada si no hay contraseña
  if (password.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Barra de progreso con color dinámico */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Fortaleza de la contraseña:</span>
          <span className={`font-semibold ${strengthConfig.textColor}`}>
            {strengthConfig.label}
          </span>
        </div>
        <div className={`h-2 rounded-full ${strengthConfig.bgColor} overflow-hidden`}>
          <div
            className={`h-full ${strengthConfig.color} transition-all duration-300 ease-out`}
            style={{ width: `${strengthConfig.percentage}%` }}
            role="progressbar"
            aria-valuenow={strengthConfig.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Fortaleza de contraseña: ${strengthConfig.label}`}
          />
        </div>
      </div>

      {/* Lista de requisitos con checkmarks dinámicos */}
      <div className="space-y-2">
        <p className="text-sm text-gray-600 font-medium">Requisitos:</p>
        <ul className="space-y-1.5" role="list">
          {strength.requirements.map((requirement) => {
            return (
              <li
                key={requirement.id}
                className="flex items-center gap-2 text-sm"
                role="listitem"
              >
                {/* Checkmark o círculo vacío */}
                <span
                  className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ${
                    requirement.met
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                  aria-label={requirement.met ? 'Cumplido' : 'No cumplido'}
                >
                  {requirement.met ? (
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-2 h-2"
                      fill="currentColor"
                      viewBox="0 0 8 8"
                    >
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                  )}
                </span>
                <span
                  className={`transition-colors duration-200 ${
                    requirement.met ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {requirement.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Feedback adicional (opcional) */}
      {strength.feedback.length > 0 && strength.score < 3 && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800 font-medium mb-1">
            Sugerencias para mejorar tu contraseña:
          </p>
          <ul className="text-xs text-yellow-700 space-y-0.5">
            {strength.feedback.slice(0, 3).map((feedback, index) => (
              <li key={index}>• {feedback}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
