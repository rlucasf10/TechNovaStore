'use client'

import { InputHTMLAttributes, forwardRef, ReactNode, useState } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Etiqueta del input */
  label?: string
  /** Mensaje de error a mostrar */
  error?: string
  /** Texto de ayuda a mostrar debajo del input */
  helperText?: string
  /** Variante del input (determina el tipo y comportamiento) */
  variant?: 'text' | 'email' | 'password' | 'number'
  /** Icono a mostrar a la izquierda del input */
  iconLeft?: ReactNode
  /** Icono a mostrar a la derecha del input */
  iconRight?: ReactNode
  /** Habilitar label flotante (se mueve arriba cuando hay contenido) */
  floatingLabel?: boolean
  /** Mostrar icono de validación inline (checkmark cuando válido) */
  showValidation?: boolean
  /** Indica si el input es válido (para mostrar icono de validación) */
  isValid?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    id,
    variant = 'text',
    iconLeft,
    iconRight,
    floatingLabel = false,
    showValidation = false,
    isValid = false,
    disabled,
    value,
    type,
    ...props 
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substring(2, 11)}`
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    
    // Determinar el tipo de input basado en la variante
    const inputType = variant === 'password' 
      ? (showPassword ? 'text' : 'password')
      : variant === 'number'
      ? 'number'
      : variant === 'email'
      ? 'email'
      : type || 'text'

    // Determinar si el label debe estar flotando
    const hasValue = value !== undefined && value !== null && value !== ''
    const shouldFloat = floatingLabel && (isFocused || hasValue)

    // Clases base del input
    const baseClasses = 'block w-full rounded-md border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0'
    
    // Estados del input
    const stateClasses = error
      ? 'border-error focus:border-error focus:ring-error/20 text-gray-900'
      : disabled
      ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500/20 text-gray-900'

    // Padding según iconos
    const paddingClasses = cn(
      'py-2.5 text-base',
      iconLeft && !floatingLabel ? 'pl-10' : floatingLabel ? 'pl-3' : 'pl-3',
      (iconRight || showValidation || variant === 'password') ? 'pr-10' : 'pr-3',
      floatingLabel && 'pt-6 pb-2'
    )

    // Icono de validación
    const ValidationIcon = () => {
      if (!showValidation) return null
      
      if (error) {
        return (
          <svg 
            className="w-5 h-5 text-error" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        )
      }
      
      if (isValid && hasValue) {
        return (
          <svg 
            className="w-5 h-5 text-success" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        )
      }
      
      return null
    }

    // Botón de toggle para password
    const PasswordToggle = () => {
      if (variant !== 'password') return null
      
      return (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
          tabIndex={-1}
          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {showPassword ? (
            <svg 
              className="w-5 h-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" 
              />
            </svg>
          ) : (
            <svg 
              className="w-5 h-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
            >
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
      )
    }

    return (
      <div className="w-full">
        <div className="relative">
          {/* Label estático o flotante */}
          {label && !floatingLabel && (
            <label 
              htmlFor={inputId} 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {label}
            </label>
          )}
          
          {/* Label flotante */}
          {label && floatingLabel && (
            <label
              htmlFor={inputId}
              className={cn(
                'absolute left-3 transition-all duration-200 pointer-events-none',
                shouldFloat
                  ? 'top-2 text-xs text-primary-600 font-medium'
                  : 'top-1/2 -translate-y-1/2 text-base text-gray-500',
                error && shouldFloat && 'text-error'
              )}
            >
              {label}
            </label>
          )}

          {/* Icono izquierdo */}
          {iconLeft && !floatingLabel && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <span className="inline-flex w-5 h-5" aria-hidden="true">
                {iconLeft}
              </span>
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            value={value}
            disabled={disabled}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            className={cn(
              baseClasses,
              stateClasses,
              paddingClasses,
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error 
                ? `${inputId}-error` 
                : helperText 
                ? `${inputId}-helper` 
                : undefined
            }
            {...props}
          />

          {/* Icono derecho o validación */}
          {(iconRight || showValidation) && variant !== 'password' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {showValidation ? (
                <ValidationIcon />
              ) : (
                <span className="inline-flex w-5 h-5 text-gray-400" aria-hidden="true">
                  {iconRight}
                </span>
              )}
            </div>
          )}

          {/* Toggle de password */}
          <PasswordToggle />
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="flex items-start gap-1 mt-1.5">
            <svg 
              className="w-4 h-4 text-error mt-0.5 flex-shrink-0" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                clipRule="evenodd" 
              />
            </svg>
            <p id={`${inputId}-error`} className="text-sm text-error">
              {error}
            </p>
          </div>
        )}

        {/* Texto de ayuda */}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
export type { InputProps }