/**
 * Hook personalizado para manejo de errores de autenticación
 * Proporciona utilidades para convertir errores de API en mensajes amigables
 */

import { useState, useCallback } from 'react';
import { 
  parseAuthError, 
  getAuthErrorMessage,
  mapHttpStatusToErrorCode
} from '@/lib/auth-errors';
import { type AuthErrorCode } from '@/types/auth.types';
import { AxiosError } from 'axios';

// ============================================================================
// Tipos
// ============================================================================

export interface AuthErrorState {
  /** Error general (no asociado a un campo específico) */
  general?: string;
  /** Errores por campo */
  fields: Record<string, string>;
  /** Código del error */
  code?: AuthErrorCode;
}

export interface UseAuthErrorsReturn {
  /** Estado de errores */
  errors: AuthErrorState;
  /** Establecer un error general */
  setGeneralError: (message: string) => void;
  /** Establecer un error para un campo específico */
  setFieldError: (field: string, message: string) => void;
  /** Procesar un error de API y extraer mensajes */
  handleApiError: (error: unknown, endpoint?: string) => void;
  /** Limpiar todos los errores */
  clearErrors: () => void;
  /** Limpiar error de un campo específico */
  clearFieldError: (field: string) => void;
  /** Verificar si hay algún error */
  hasErrors: boolean;
  /** Verificar si un campo tiene error */
  hasFieldError: (field: string) => boolean;
}

// ============================================================================
// Hook useAuthErrors
// ============================================================================

/**
 * Hook para manejo centralizado de errores de autenticación
 * 
 * @example
 * const { errors, handleApiError, clearErrors } = useAuthErrors();
 * 
 * try {
 *   await authService.login(credentials);
 * } catch (error) {
 *   handleApiError(error, '/api/auth/login');
 * }
 * 
 * // Mostrar error general
 * {errors.general && <ErrorMessage message={errors.general} />}
 * 
 * // Mostrar error de campo
 * <Input error={errors.fields.email} />
 */
export function useAuthErrors(): UseAuthErrorsReturn {
  const [errors, setErrors] = useState<AuthErrorState>({
    fields: {},
  });

  /**
   * Establece un error general
   */
  const setGeneralError = useCallback((message: string) => {
    setErrors((prev) => ({
      ...prev,
      general: message,
    }));
  }, []);

  /**
   * Establece un error para un campo específico
   */
  const setFieldError = useCallback((field: string, message: string) => {
    setErrors((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        [field]: message,
      },
    }));
  }, []);

  /**
   * Procesa un error de API y extrae mensajes amigables
   */
  const handleApiError = useCallback((error: unknown, endpoint?: string) => {
    // Si es un error de Axios
    if (error && typeof error === 'object' && 'isAxiosError' in error) {
      const axiosError = error as AxiosError<{
        code?: string;
        message?: string;
        field?: string;
        errors?: Array<{ field: string; message: string }>;
      }>;

      const status = axiosError.response?.status;
      const data = axiosError.response?.data;

      // Si hay múltiples errores de campo
      if (data?.errors && Array.isArray(data.errors)) {
        const fieldErrors: Record<string, string> = {};
        data.errors.forEach((err) => {
          if (err.field && err.message) {
            fieldErrors[err.field] = err.message;
          }
        });
        
        setErrors({
          fields: fieldErrors,
          code: data.code as AuthErrorCode,
        });
        return;
      }

      // Si hay un error de campo específico
      if (data?.field && data?.message) {
        setErrors({
          fields: { [data.field]: data.message },
          code: data.code as AuthErrorCode,
        });
        return;
      }

      // Si hay un código de error
      if (data?.code) {
        const message = getAuthErrorMessage(data.code as AuthErrorCode);
        setErrors({
          general: message,
          fields: {},
          code: data.code as AuthErrorCode,
        });
        return;
      }

      // Mapear por código de estado HTTP
      if (status) {
        const code = mapHttpStatusToErrorCode(status, endpoint);
        const message = getAuthErrorMessage(code);
        setErrors({
          general: message,
          fields: {},
          code,
        });
        return;
      }
    }

    // Parsear error genérico
    const parsed = parseAuthError(error);
    
    if (parsed.field) {
      setErrors({
        fields: { [parsed.field]: parsed.message },
        code: parsed.code,
      });
    } else {
      setErrors({
        general: parsed.message,
        fields: {},
        code: parsed.code,
      });
    }
  }, []);

  /**
   * Limpia todos los errores
   */
  const clearErrors = useCallback(() => {
    setErrors({ fields: {} });
  }, []);

  /**
   * Limpia el error de un campo específico
   */
  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      const newFields = { ...prev.fields };
      delete newFields[field];
      return {
        ...prev,
        fields: newFields,
      };
    });
  }, []);

  /**
   * Verifica si hay algún error
   */
  const hasErrors = !!(errors.general || Object.keys(errors.fields).length > 0);

  /**
   * Verifica si un campo tiene error
   */
  const hasFieldError = useCallback(
    (field: string) => !!errors.fields[field],
    [errors.fields]
  );

  return {
    errors,
    setGeneralError,
    setFieldError,
    handleApiError,
    clearErrors,
    clearFieldError,
    hasErrors,
    hasFieldError,
  };
}

// ============================================================================
// Hook useFormErrors
// ============================================================================

export interface UseFormErrorsReturn extends UseAuthErrorsReturn {
  /** Obtener error de un campo (útil para react-hook-form) */
  getFieldError: (field: string) => string | undefined;
  /** Establecer múltiples errores de campo a la vez */
  setFieldErrors: (errors: Record<string, string>) => void;
}

/**
 * Hook especializado para formularios con react-hook-form
 * Extiende useAuthErrors con utilidades adicionales para formularios
 * 
 * @example
 * const { errors, getFieldError, handleApiError } = useFormErrors();
 * 
 * <Input 
 *   {...register('email')}
 *   error={getFieldError('email') || errors.email?.message}
 * />
 */
export function useFormErrors(): UseFormErrorsReturn {
  const authErrors = useAuthErrors();

  /**
   * Obtiene el error de un campo
   */
  const getFieldError = useCallback(
    (field: string) => authErrors.errors.fields[field],
    [authErrors.errors.fields]
  );

  /**
   * Establece múltiples errores de campo a la vez
   */
  const setFieldErrors = useCallback(
    (errors: Record<string, string>) => {
      Object.entries(errors).forEach(([field, message]) => {
        authErrors.setFieldError(field, message);
      });
    },
    [authErrors]
  );

  return {
    ...authErrors,
    getFieldError,
    setFieldErrors,
  };
}
