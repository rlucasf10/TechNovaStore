'use client'

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// Tipos
// ============================================================================

export interface ErrorMessageProps {
  /** Mensaje de error a mostrar */
  message: string;
  /** Tipo de error (afecta el color y el icono) */
  variant?: 'error' | 'warning' | 'info';
  /** Tamaño del mensaje */
  size?: 'sm' | 'md' | 'lg';
  /** Mostrar icono de alerta */
  showIcon?: boolean;
  /** Icono personalizado (reemplaza el icono por defecto) */
  icon?: ReactNode;
  /** Clase CSS adicional */
  className?: string;
  /** ID del elemento (útil para aria-describedby) */
  id?: string;
  /** Acción opcional (botón o link) */
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============================================================================
// Componente ErrorMessage
// ============================================================================

/**
 * Componente para mostrar mensajes de error, advertencia o información
 * Diseñado para usarse debajo de campos de formulario o como mensajes generales
 * 
 * @example
 * // Error simple
 * <ErrorMessage message="El email es requerido" />
 * 
 * @example
 * // Error con acción
 * <ErrorMessage 
 *   message="Este email ya está registrado" 
 *   action={{ label: 'Iniciar sesión', onClick: () => router.push('/login') }}
 * />
 * 
 * @example
 * // Advertencia
 * <ErrorMessage 
 *   message="Tu sesión expirará pronto" 
 *   variant="warning"
 * />
 */
export function ErrorMessage({
  message,
  variant = 'error',
  size = 'sm',
  showIcon = true,
  icon,
  className,
  id,
  action,
}: ErrorMessageProps) {
  // Clases base
  const baseClasses = 'flex items-start gap-1.5 rounded-md';
  
  // Clases de variante (color)
  const variantClasses = {
    error: 'text-error',
    warning: 'text-warning',
    info: 'text-info',
  };
  
  // Clases de tamaño
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };
  
  // Tamaño del icono según el tamaño del texto
  const iconSizeClasses = {
    sm: 'w-4 h-4 mt-0.5',
    md: 'w-5 h-5 mt-0.5',
    lg: 'w-6 h-6 mt-1',
  };

  // Icono por defecto según la variante
  const DefaultIcon = () => {
    if (variant === 'error') {
      return (
        <svg 
          className={cn(iconSizeClasses[size], 'flex-shrink-0')}
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
      );
    }
    
    if (variant === 'warning') {
      return (
        <svg 
          className={cn(iconSizeClasses[size], 'flex-shrink-0')}
          fill="currentColor" 
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path 
            fillRule="evenodd" 
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
            clipRule="evenodd" 
          />
        </svg>
      );
    }
    
    // Info
    return (
      <svg 
        className={cn(iconSizeClasses[size], 'flex-shrink-0')}
        fill="currentColor" 
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path 
          fillRule="evenodd" 
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
          clipRule="evenodd" 
        />
      </svg>
    );
  };

  return (
    <div 
      id={id}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Icono */}
      {showIcon && (
        <span className="inline-flex" aria-hidden="true">
          {icon || <DefaultIcon />}
        </span>
      )}
      
      {/* Contenido */}
      <div className="flex-1 min-w-0">
        {/* Mensaje */}
        <p className="break-words">
          {message}
        </p>
        
        {/* Acción opcional */}
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className={cn(
              'mt-1 font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-1 rounded',
              variant === 'error' && 'focus:ring-error',
              variant === 'warning' && 'focus:ring-warning',
              variant === 'info' && 'focus:ring-info'
            )}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Componente FormFieldError
// ============================================================================

export interface FormFieldErrorProps {
  /** Mensaje de error */
  error?: string;
  /** ID del campo (para aria-describedby) */
  fieldId: string;
  /** Clase CSS adicional */
  className?: string;
}

/**
 * Componente especializado para mostrar errores de campos de formulario
 * Incluye el ID correcto para aria-describedby
 * 
 * @example
 * <Input id="email" error={errors.email?.message} />
 * <FormFieldError error={errors.email?.message} fieldId="email" />
 */
export function FormFieldError({ error, fieldId, className }: FormFieldErrorProps) {
  if (!error) return null;
  
  return (
    <ErrorMessage
      id={`${fieldId}-error`}
      message={error}
      variant="error"
      size="sm"
      className={cn('mt-1.5', className)}
    />
  );
}

// ============================================================================
// Componente AlertBox
// ============================================================================

export interface AlertBoxProps {
  /** Título del alert */
  title?: string;
  /** Mensaje del alert */
  message: string;
  /** Tipo de alert */
  variant?: 'error' | 'warning' | 'info' | 'success';
  /** Mostrar icono */
  showIcon?: boolean;
  /** Permitir cerrar el alert */
  dismissible?: boolean;
  /** Callback al cerrar */
  onDismiss?: () => void;
  /** Clase CSS adicional */
  className?: string;
  /** Acción opcional */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Componente para mostrar alertas destacadas (más prominentes que ErrorMessage)
 * Útil para mensajes importantes que necesitan más atención
 * 
 * @example
 * <AlertBox 
 *   title="Error de autenticación"
 *   message="Tus credenciales son incorrectas"
 *   variant="error"
 *   dismissible
 * />
 */
export function AlertBox({
  title,
  message,
  variant = 'error',
  showIcon = true,
  dismissible = false,
  onDismiss,
  className,
  action,
}: AlertBoxProps) {
  // Clases de variante (fondo y borde)
  const variantClasses = {
    error: 'bg-error/10 border-error/20 text-error',
    warning: 'bg-warning/10 border-warning/20 text-warning',
    info: 'bg-info/10 border-info/20 text-info',
    success: 'bg-success/10 border-success/20 text-success',
  };

  // Icono según variante
  const Icon = () => {
    if (variant === 'error') {
      return (
        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    }
    
    if (variant === 'warning') {
      return (
        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    }
    
    if (variant === 'success') {
      return (
        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    }
    
    // Info
    return (
      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        variantClasses[variant],
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icono */}
        {showIcon && (
          <span className="inline-flex mt-0.5" aria-hidden="true">
            <Icon />
          </span>
        )}
        
        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="font-semibold mb-1">
              {title}
            </h3>
          )}
          <p className="text-sm break-words">
            {message}
          </p>
          
          {/* Acción */}
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className="mt-2 text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded"
            >
              {action.label}
            </button>
          )}
        </div>
        
        {/* Botón de cerrar */}
        {dismissible && (
          <button
            type="button"
            onClick={onDismiss}
            className="flex-shrink-0 rounded-md p-1 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
