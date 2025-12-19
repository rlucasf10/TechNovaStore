/**
 * Utilidades de Seguridad
 * 
 * Este módulo proporciona funciones para el manejo seguro de datos sensibles:
 * - Enmascaramiento de datos sensibles
 * - Validación de datos antes de logging
 * - Sanitización de objetos para prevenir exposición de datos
 * 
 * IMPORTANTE: Nunca almacenar datos sensibles en localStorage
 * Los tokens de autenticación se manejan mediante httpOnly cookies en el backend
 */

// ============================================================================
// Tipos de Datos Sensibles
// ============================================================================

/**
 * Lista de campos que contienen datos sensibles y NO deben ser logueados
 * ni almacenados en localStorage
 * 
 * IMPORTANTE: Esta lista se usa para detectar campos sensibles en objetos
 * y aplicar redacción completa (***REDACTED***) antes de loguear
 */
const SENSITIVE_FIELDS = [
  // Autenticación - CRÍTICO
  'password',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'oldPassword',
  'token',
  'accessToken',
  'refreshToken',
  'auth_token',
  'access_token',
  'refresh_token',
  'authToken',
  'bearerToken',
  'bearer_token',
  'apiKey',
  'api_key',
  'apiSecret',
  'api_secret',
  'secret',
  'secretKey',
  'secret_key',
  'privateKey',
  'private_key',
  'credentials',
  'sessionToken',
  'session_token',
  
  // Tarjetas de crédito - CRÍTICO
  'cardNumber',
  'card_number',
  'creditCard',
  'credit_card',
  'creditCardNumber',
  'cvv',
  'cvc',
  'cvc2',
  'cvv2',
  'securityCode',
  'security_code',
  'cardDetails',
  'card_details',
  'cardCvv',
  'card_cvv',
  'expiryDate',
  'expiry_date',
  'cardExpiry',
  'card_expiry',
  
  // Información personal sensible - CRÍTICO
  'ssn',
  'socialSecurityNumber',
  'social_security_number',
  'taxId',
  'tax_id',
  'driverLicense',
  'driver_license',
  'passport',
  'passportNumber',
  'passport_number',
  
  // Datos bancarios
  'accountNumber',
  'account_number',
  'routingNumber',
  'routing_number',
  'iban',
  'swift',
  'bic',
  'bankAccount',
  'bank_account',
  
  // Otros datos sensibles
  'pin',
  'pinCode',
  'pin_code',
  'otp',
  'verificationCode',
  'verification_code',
  'securityAnswer',
  'security_answer',
] as const

/**
 * Patrones regex para detectar datos sensibles en strings
 */
const SENSITIVE_PATTERNS = {
  // Tarjetas de crédito (13-19 dígitos consecutivos, con o sin espacios)
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{3,4}\b|\b\d{13,19}\b/g,
  
  // CVV (3-4 dígitos)
  cvv: /\b\d{3,4}\b/g,
  
  // Email (para enmascarar parcialmente)
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // Tokens JWT (formato típico)
  jwt: /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g,
} as const

// ============================================================================
// Funciones de Enmascaramiento
// ============================================================================

/**
 * Enmascara un número de tarjeta mostrando solo los últimos 4 dígitos
 * @param cardNumber - Número de tarjeta completo
 * @returns Número enmascarado (ej: "**** **** **** 1234")
 */
export function maskCardNumber(cardNumber: string): string {
  if (!cardNumber) return ''
  
  const cleanNumber = cardNumber.replace(/\s/g, '')
  const lastFour = cleanNumber.slice(-4)
  
  // Crear grupos de 4 asteriscos para mantener el formato
  const numGroups = Math.ceil((cleanNumber.length - 4) / 4)
  const maskedGroups = Array(numGroups).fill('****')
  
  return [...maskedGroups, lastFour].join(' ')
}

/**
 * Enmascara un CVV completamente
 * @param cvv - Código CVV
 * @returns CVV enmascarado (ej: "***")
 */
export function maskCVV(cvv: string): string {
  if (!cvv) return ''
  return '*'.repeat(cvv.length)
}

/**
 * Enmascara un email mostrando solo la primera letra y el dominio
 * @param email - Email completo
 * @returns Email enmascarado (ej: "j***@example.com")
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email
  
  const [localPart, domain] = email.split('@')
  if (localPart.length <= 1) return email
  
  const maskedLocal = localPart[0] + '*'.repeat(Math.min(localPart.length - 1, 3))
  return `${maskedLocal}@${domain}`
}

/**
 * Enmascara un token mostrando solo los primeros y últimos caracteres
 * @param token - Token completo
 * @returns Token enmascarado (ej: "eyJ...xyz")
 */
export function maskToken(token: string): string {
  if (!token || token.length < 10) return '***'
  
  const start = token.substring(0, 3)
  const end = token.substring(token.length - 3)
  return `${start}...${end}`
}

// ============================================================================
// Sanitización de Objetos
// ============================================================================

/**
 * Sanitiza un objeto removiendo o enmascarando campos sensibles
 * Útil antes de loguear objetos o enviarlos a servicios de analytics
 * 
 * @param obj - Objeto a sanitizar
 * @param options - Opciones de sanitización
 * @returns Objeto sanitizado (copia profunda)
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  options: {
    /** Si true, enmascara los valores en lugar de eliminarlos */
    mask?: boolean
    /** Campos adicionales a considerar sensibles */
    additionalSensitiveFields?: string[]
  } = {}
): T {
  const { mask = true, additionalSensitiveFields = [] } = options
  
  // Combinar campos sensibles predefinidos con adicionales
  const allSensitiveFields = [
    ...SENSITIVE_FIELDS,
    ...additionalSensitiveFields,
  ]
  
  // Función recursiva para sanitizar
  function sanitizeValue(value: any, key?: string): any {
    // Null o undefined
    if (value === null || value === undefined) {
      return value
    }
    
    // Verificar si la clave es sensible
    const isSensitiveKey = key && allSensitiveFields.some(
      field => key.toLowerCase().includes(field.toLowerCase())
    )
    
    if (isSensitiveKey) {
      if (!mask) {
        return undefined // Eliminar el campo
      }
      
      // REDACCIÓN COMPLETA para todos los campos sensibles
      // Esto previene la exposición accidental de datos sensibles en logs
      return '***REDACTED***'
    }
    
    // Arrays
    if (Array.isArray(value)) {
      return value.map(item => sanitizeValue(item))
    }
    
    // Objetos
    if (typeof value === 'object') {
      const sanitized: Record<string, any> = {}
      for (const [k, v] of Object.entries(value)) {
        const sanitizedValue = sanitizeValue(v, k)
        if (sanitizedValue !== undefined) {
          sanitized[k] = sanitizedValue
        }
      }
      return sanitized
    }
    
    // Valores primitivos
    return value
  }
  
  return sanitizeValue(obj) as T
}

// ============================================================================
// Logging Seguro
// ============================================================================

/**
 * Logger seguro que automáticamente sanitiza objetos antes de loguear
 * Usar en lugar de console.log para datos que puedan contener información sensible
 */
export const secureLogger = {
  /**
   * Log de información (sanitizado)
   */
  log: (...args: any[]) => {
    const sanitizedArgs = args.map(arg => 
      typeof arg === 'object' && arg !== null 
        ? sanitizeObject(arg) 
        : arg
    )
    console.log(...sanitizedArgs)
  },
  
  /**
   * Log de errores (sanitizado)
   */
  error: (...args: any[]) => {
    const sanitizedArgs = args.map(arg => 
      typeof arg === 'object' && arg !== null 
        ? sanitizeObject(arg) 
        : arg
    )
    console.error(...sanitizedArgs)
  },
  
  /**
   * Log de advertencias (sanitizado)
   */
  warn: (...args: any[]) => {
    const sanitizedArgs = args.map(arg => 
      typeof arg === 'object' && arg !== null 
        ? sanitizeObject(arg) 
        : arg
    )
    console.warn(...sanitizedArgs)
  },
  
  /**
   * Log de información de desarrollo (sanitizado)
   */
  debug: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      const sanitizedArgs = args.map(arg => 
        typeof arg === 'object' && arg !== null 
          ? sanitizeObject(arg) 
          : arg
      )
      console.debug(...sanitizedArgs)
    }
  },
}

// ============================================================================
// Validación de Almacenamiento
// ============================================================================

/**
 * Verifica si un objeto contiene datos sensibles que NO deberían almacenarse
 * en localStorage
 * 
 * @param obj - Objeto a verificar
 * @returns true si contiene datos sensibles
 */
export function containsSensitiveData(obj: Record<string, any>): boolean {
  function checkValue(value: any, key?: string): boolean {
    if (value === null || value === undefined) {
      return false
    }
    
    // Verificar si la clave es sensible
    if (key && SENSITIVE_FIELDS.some(
      field => key.toLowerCase().includes(field.toLowerCase())
    )) {
      return true
    }
    
    // Verificar strings con patrones sensibles
    if (typeof value === 'string') {
      // Verificar patrones de tarjetas de crédito
      if (SENSITIVE_PATTERNS.creditCard.test(value)) {
        return true
      }
      // Verificar patrones de JWT
      if (SENSITIVE_PATTERNS.jwt.test(value)) {
        return true
      }
    }
    
    // Verificar arrays recursivamente
    if (Array.isArray(value)) {
      return value.some(item => checkValue(item))
    }
    
    // Verificar objetos recursivamente
    if (typeof value === 'object') {
      return Object.entries(value).some(([k, v]) => checkValue(v, k))
    }
    
    return false
  }
  
  return checkValue(obj)
}

/**
 * Wrapper seguro para localStorage.setItem que previene almacenar datos sensibles
 * 
 * @param key - Clave de almacenamiento
 * @param value - Valor a almacenar
 * @throws Error si el valor contiene datos sensibles
 */
export function safeLocalStorageSet(key: string, value: string): void {
  // Verificar si la clave misma es sensible
  if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
    console.error(`❌ Intento de almacenar dato sensible en localStorage: ${key}`)
    throw new Error(`No se permite almacenar datos sensibles en localStorage: ${key}`)
  }
  
  // Intentar parsear el valor como JSON para verificar contenido
  try {
    const parsed = JSON.parse(value)
    if (typeof parsed === 'object' && containsSensitiveData(parsed)) {
      console.error(`❌ Intento de almacenar objeto con datos sensibles en localStorage: ${key}`)
      throw new Error(`El objeto contiene datos sensibles y no puede almacenarse en localStorage`)
    }
  } catch (e) {
    // Si no es JSON válido, verificar el string directamente
    if (SENSITIVE_PATTERNS.creditCard.test(value) || SENSITIVE_PATTERNS.jwt.test(value)) {
      console.error(`❌ Intento de almacenar dato sensible en localStorage: ${key}`)
      throw new Error(`El valor contiene datos sensibles y no puede almacenarse en localStorage`)
    }
  }
  
  // Si pasa todas las validaciones, almacenar
  localStorage.setItem(key, value)
}

// ============================================================================
// Utilidades de Validación
// ============================================================================

/**
 * Valida que un string no contenga patrones de datos sensibles
 * Útil para validar inputs antes de enviarlos a logs o analytics
 * 
 * @param str - String a validar
 * @returns true si el string es seguro para loguear
 */
export function isSafeToLog(str: string): boolean {
  // Verificar patrones de tarjetas de crédito
  if (SENSITIVE_PATTERNS.creditCard.test(str)) {
    return false
  }
  
  // Verificar patrones de JWT
  if (SENSITIVE_PATTERNS.jwt.test(str)) {
    return false
  }
  
  return true
}

/**
 * Sanitiza un string removiendo patrones de datos sensibles
 * 
 * @param str - String a sanitizar
 * @returns String sanitizado
 */
export function sanitizeString(str: string): string {
  let sanitized = str
  
  // Reemplazar números de tarjeta
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.creditCard, '****')
  
  // Reemplazar tokens JWT
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.jwt, '[TOKEN]')
  
  return sanitized
}

// ============================================================================
// Exportaciones
// ============================================================================

export default {
  maskCardNumber,
  maskCVV,
  maskEmail,
  maskToken,
  sanitizeObject,
  secureLogger,
  containsSensitiveData,
  safeLocalStorageSet,
  isSafeToLog,
  sanitizeString,
}
