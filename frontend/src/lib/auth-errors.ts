/**
 * Diccionario de mensajes de error de autenticación
 * Proporciona mensajes amigables y accionables para todos los errores de autenticación
 */

import { AuthErrorCode } from '@/types/auth.types';

// ============================================================================
// Diccionario de Mensajes de Error
// ============================================================================

/**
 * Mensajes de error amigables para cada código de error de autenticación
 */
export const authErrorMessages: Record<AuthErrorCode, string> = {
  // Errores de validación de email
  'invalid-email': 'El email ingresado no está registrado',
  
  // Errores de credenciales
  'invalid-credentials': 'Email o contraseña incorrectos',
  
  // Errores de registro
  'email-already-exists': 'Este email ya está registrado. ¿Quieres iniciar sesión?',
  
  // Errores de contraseña
  'weak-password': 'La contraseña no cumple con los requisitos de seguridad',
  'passwords-dont-match': 'Las contraseñas no coinciden',
  
  // Errores de token
  'invalid-token': 'El link de recuperación es inválido o ha expirado',
  'token-expired': 'El link de recuperación ha expirado. Solicita uno nuevo',
  
  // Errores de red y servidor
  'network-error': 'Error de conexión. Verifica tu internet e intenta de nuevo',
  'server-error': 'Error del servidor. Intenta de nuevo más tarde',
  
  // Errores de rate limiting
  'rate-limit-exceeded': 'Demasiados intentos. Por favor, espera unos minutos antes de intentar de nuevo',
  
  // Errores de OAuth
  'oauth-cancelled': 'Autenticación cancelada. Intenta de nuevo si deseas continuar',
  'oauth-failed': 'Error al autenticar con el proveedor. Intenta de nuevo',
  
  // Errores de gestión de métodos de autenticación
  'method-already-linked': 'Este método de autenticación ya está vinculado a tu cuenta',
  'cannot-unlink-only-method': 'No puedes desvincular tu único método de autenticación. Agrega otro método primero',
  
  // Errores de autorización
  'unauthorized': 'No tienes permisos para realizar esta acción',
};

// ============================================================================
// Mensajes de Error por Campo
// ============================================================================

/**
 * Mensajes de error específicos para campos de formulario
 */
export const fieldErrorMessages = {
  email: {
    required: 'El email es requerido',
    invalid: 'Ingresa un email válido',
    notFound: 'Este email no está registrado',
    alreadyExists: 'Este email ya está en uso',
  },
  password: {
    required: 'La contraseña es requerida',
    tooShort: 'La contraseña debe tener al menos 8 caracteres',
    noUppercase: 'Debe contener al menos una letra mayúscula',
    noLowercase: 'Debe contener al menos una letra minúscula',
    noNumber: 'Debe contener al menos un número',
    noSpecial: 'Debe contener al menos un carácter especial',
    weak: 'La contraseña es demasiado débil',
  },
  confirmPassword: {
    required: 'Confirma tu contraseña',
    noMatch: 'Las contraseñas no coinciden',
  },
  firstName: {
    required: 'El nombre es requerido',
    tooShort: 'El nombre debe tener al menos 2 caracteres',
    invalid: 'El nombre solo puede contener letras',
  },
  lastName: {
    required: 'El apellido es requerido',
    tooShort: 'El apellido debe tener al menos 2 caracteres',
    invalid: 'El apellido solo puede contener letras',
  },
  terms: {
    required: 'Debes aceptar los términos y condiciones',
  },
};

// ============================================================================
// Utilidades para Manejo de Errores
// ============================================================================

/**
 * Obtiene el mensaje de error amigable para un código de error
 */
export function getAuthErrorMessage(errorCode: AuthErrorCode): string {
  return authErrorMessages[errorCode] || 'Ha ocurrido un error. Intenta de nuevo';
}

/**
 * Extrae el código de error de una respuesta de API
 */
export function extractErrorCode(error: unknown): AuthErrorCode {
  // Si es un objeto con código de error
  if (error && typeof error === 'object' && 'code' in error) {
    return (error as { code: AuthErrorCode }).code;
  }
  
  // Si es un error de Axios
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { code?: string } } };
    const code = axiosError.response?.data?.code;
    if (code && isAuthErrorCode(code)) {
      return code;
    }
  }
  
  // Si es un error de red
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: string }).message.toLowerCase();
    if (message.includes('network') || message.includes('fetch')) {
      return 'network-error';
    }
  }
  
  // Error genérico del servidor
  return 'server-error';
}

/**
 * Verifica si un string es un código de error válido
 */
function isAuthErrorCode(code: string): code is AuthErrorCode {
  return code in authErrorMessages;
}

/**
 * Convierte un error de API en un objeto de error estructurado
 */
export interface ParsedAuthError {
  code: AuthErrorCode;
  message: string;
  field?: string;
}

export function parseAuthError(error: unknown): ParsedAuthError {
  const code = extractErrorCode(error);
  const message = getAuthErrorMessage(code);
  
  // Intentar extraer el campo afectado
  let field: string | undefined;
  if (error && typeof error === 'object') {
    if ('field' in error) {
      field = (error as { field: string }).field;
    } else if ('response' in error) {
      const axiosError = error as { response?: { data?: { field?: string } } };
      field = axiosError.response?.data?.field;
    }
  }
  
  return { code, message, field };
}

// ============================================================================
// Mapeo de Errores HTTP a Códigos de Error
// ============================================================================

/**
 * Mapea códigos de estado HTTP a códigos de error de autenticación
 */
export function mapHttpStatusToErrorCode(status: number, endpoint?: string): AuthErrorCode {
  switch (status) {
    case 400:
      // Bad Request - puede ser varios tipos de error
      if (endpoint?.includes('login')) {
        return 'invalid-credentials';
      }
      if (endpoint?.includes('register')) {
        return 'email-already-exists';
      }
      return 'server-error';
      
    case 401:
      // Unauthorized
      return 'invalid-credentials';
      
    case 403:
      // Forbidden
      return 'unauthorized';
      
    case 404:
      // Not Found
      if (endpoint?.includes('email') || endpoint?.includes('user')) {
        return 'invalid-email';
      }
      return 'server-error';
      
    case 409:
      // Conflict
      return 'email-already-exists';
      
    case 410:
      // Gone - token expirado
      return 'token-expired';
      
    case 422:
      // Unprocessable Entity - validación fallida
      return 'weak-password';
      
    case 429:
      // Too Many Requests
      return 'rate-limit-exceeded';
      
    case 500:
    case 502:
    case 503:
    case 504:
      // Server errors
      return 'server-error';
      
    default:
      return 'server-error';
  }
}

// ============================================================================
// Mensajes de Éxito
// ============================================================================

/**
 * Mensajes de éxito para operaciones de autenticación
 */
export const authSuccessMessages = {
  login: '¡Bienvenido de nuevo!',
  register: '¡Cuenta creada exitosamente! Bienvenido a TechNovaStore',
  logout: 'Sesión cerrada correctamente',
  forgotPassword: 'Email enviado. Revisa tu bandeja de entrada',
  resetPassword: 'Contraseña actualizada exitosamente',
  setPassword: 'Contraseña establecida exitosamente',
  changePassword: 'Contraseña cambiada exitosamente',
  updateProfile: 'Perfil actualizado correctamente',
  linkMethod: 'Método de autenticación vinculado exitosamente',
  unlinkMethod: 'Método de autenticación desvinculado',
  verifyEmail: 'Email verificado correctamente',
};

// ============================================================================
// Mensajes de Advertencia
// ============================================================================

/**
 * Mensajes de advertencia para situaciones especiales
 */
export const authWarningMessages = {
  passwordExpiringSoon: 'Tu contraseña expirará pronto. Considera cambiarla',
  emailNotVerified: 'Tu email no está verificado. Revisa tu bandeja de entrada',
  weakPassword: 'Tu contraseña es débil. Considera usar una más segura',
  singleAuthMethod: 'Solo tienes un método de autenticación. Agrega otro para mayor seguridad',
  sessionExpiring: 'Tu sesión expirará pronto. Guarda tu trabajo',
};

// ============================================================================
// Mensajes Informativos
// ============================================================================

/**
 * Mensajes informativos para guiar al usuario
 */
export const authInfoMessages = {
  oauthNoPassword: 'Tu cuenta usa {provider} para iniciar sesión. ¿Quieres establecer una contraseña?',
  multipleMethodsRecommended: 'Tener múltiples métodos de autenticación aumenta la seguridad de tu cuenta',
  passwordRequirements: 'La contraseña debe tener al menos 8 caracteres, incluyendo mayúsculas, minúsculas, números y caracteres especiales',
  tokenExpiration: 'Este enlace expirará en 1 hora por seguridad',
  rateLimitInfo: 'Por seguridad, limitamos el número de intentos. Intenta de nuevo en {minutes} minutos',
};
