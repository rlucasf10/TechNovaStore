/**
 * Utilidades para validación de tarjetas de crédito
 */

/**
 * Algoritmo de Luhn para validar números de tarjeta de crédito
 * @param cardNumber - Número de tarjeta sin espacios
 * @returns true si el número es válido según el algoritmo de Luhn
 */
export function validateCardNumberLuhn(cardNumber: string): boolean {
  // Eliminar espacios y caracteres no numéricos
  const cleanNumber = cardNumber.replace(/\D/g, '')
  
  // Debe tener entre 13 y 19 dígitos
  if (cleanNumber.length < 13 || cleanNumber.length > 19) {
    return false
  }
  
  let sum = 0
  let isEven = false
  
  // Recorrer de derecha a izquierda
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i], 10)
    
    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }
    
    sum += digit
    isEven = !isEven
  }
  
  return sum % 10 === 0
}

/**
 * Detecta el tipo de tarjeta basándose en el número
 * @param cardNumber - Número de tarjeta
 * @returns Tipo de tarjeta detectado
 */
export function detectCardType(cardNumber: string): 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown' {
  const cleanNumber = cardNumber.replace(/\s/g, '')
  
  if (/^4/.test(cleanNumber)) {
    return 'visa'
  }
  
  if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber)) {
    return 'mastercard'
  }
  
  if (/^3[47]/.test(cleanNumber)) {
    return 'amex'
  }
  
  if (/^6(?:011|5)/.test(cleanNumber)) {
    return 'discover'
  }
  
  return 'unknown'
}

/**
 * Formatea el número de tarjeta con espacios
 * @param cardNumber - Número de tarjeta
 * @returns Número formateado con espacios
 */
export function formatCardNumber(cardNumber: string): string {
  const cleanNumber = cardNumber.replace(/\s/g, '')
  const cardType = detectCardType(cleanNumber)
  
  // American Express usa formato 4-6-5
  if (cardType === 'amex') {
    return cleanNumber.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3').trim()
  }
  
  // Otros usan formato 4-4-4-4
  return cleanNumber.replace(/(\d{4})/g, '$1 ').trim()
}

/**
 * Enmascara el número de tarjeta mostrando solo los últimos 4 dígitos
 * @param cardNumber - Número de tarjeta
 * @returns Número enmascarado (ej: "**** **** **** 1234")
 */
export function maskCardNumber(cardNumber: string): string {
  const cleanNumber = cardNumber.replace(/\s/g, '')
  const lastFour = cleanNumber.slice(-4)
  
  // Crear grupos de 4 asteriscos para mantener el formato
  const numGroups = Math.ceil((cleanNumber.length - 4) / 4)
  const maskedGroups = Array(numGroups).fill('****')
  
  return [...maskedGroups, lastFour].join(' ')
}

/**
 * Valida el mes de expiración
 * @param month - Mes (1-12)
 * @returns true si el mes es válido
 */
export function validateExpiryMonth(month: string): boolean {
  const monthNum = parseInt(month, 10)
  return monthNum >= 1 && monthNum <= 12
}

/**
 * Valida el año de expiración
 * @param year - Año (YYYY)
 * @param month - Mes opcional para validar que no esté expirada
 * @returns true si el año es válido
 */
export function validateExpiryYear(year: string, month?: string): boolean {
  const yearNum = parseInt(year, 10)
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  
  // El año debe estar entre el año actual y 20 años en el futuro
  if (yearNum < currentYear || yearNum > currentYear + 20) {
    return false
  }
  
  // Si es el año actual, verificar que el mes no haya pasado
  if (month && yearNum === currentYear) {
    const monthNum = parseInt(month, 10)
    return monthNum >= currentMonth
  }
  
  return true
}

/**
 * Valida el CVV
 * @param cvv - Código de seguridad
 * @param cardType - Tipo de tarjeta (opcional)
 * @returns true si el CVV es válido
 */
export function validateCVV(cvv: string, cardType?: string): boolean {
  const cleanCVV = cvv.replace(/\D/g, '')
  
  // American Express usa 4 dígitos, otros usan 3
  if (cardType === 'amex') {
    return cleanCVV.length === 4
  }
  
  return cleanCVV.length === 3 || cleanCVV.length === 4
}

/**
 * Obtiene el nombre completo del tipo de tarjeta
 * @param cardType - Tipo de tarjeta
 * @returns Nombre completo de la tarjeta
 */
export function getCardTypeName(cardType: string): string {
  const names: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    discover: 'Discover',
    unknown: 'Desconocida',
  }
  
  return names[cardType] || 'Desconocida'
}

/**
 * Obtiene la longitud máxima del CVV según el tipo de tarjeta
 * @param cardType - Tipo de tarjeta
 * @returns Longitud máxima del CVV
 */
export function getMaxCVVLength(cardType: string): number {
  return cardType === 'amex' ? 4 : 3
}
