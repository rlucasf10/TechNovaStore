/**
 * Tests para utilidades de validación de tarjetas
 */

import {
  validateCardNumberLuhn,
  detectCardType,
  formatCardNumber,
  maskCardNumber,
  validateExpiryMonth,
  validateExpiryYear,
  validateCVV,
  getCardTypeName,
  getMaxCVVLength,
} from '@/features/commerce/utils/cardValidation'

describe('cardValidation', () => {
  describe('validateCardNumberLuhn', () => {
    it('debe validar números de tarjeta válidos', () => {
      // Visa
      expect(validateCardNumberLuhn('4242424242424242')).toBe(true)
      expect(validateCardNumberLuhn('4012888888881881')).toBe(true)
      
      // Mastercard
      expect(validateCardNumberLuhn('5555555555554444')).toBe(true)
      expect(validateCardNumberLuhn('5105105105105100')).toBe(true)
      
      // Amex
      expect(validateCardNumberLuhn('378282246310005')).toBe(true)
      expect(validateCardNumberLuhn('371449635398431')).toBe(true)
    })

    it('debe rechazar números de tarjeta inválidos', () => {
      expect(validateCardNumberLuhn('1234567890123456')).toBe(false)
      expect(validateCardNumberLuhn('4242424242424243')).toBe(false) // Último dígito incorrecto
      expect(validateCardNumberLuhn('1111111111111111')).toBe(false)
    })

    it('debe manejar números con espacios', () => {
      expect(validateCardNumberLuhn('4242 4242 4242 4242')).toBe(true)
      expect(validateCardNumberLuhn('5555 5555 5555 4444')).toBe(true)
    })

    it('debe rechazar números muy cortos o muy largos', () => {
      expect(validateCardNumberLuhn('123')).toBe(false)
      expect(validateCardNumberLuhn('12345678901234567890')).toBe(false)
    })
  })

  describe('detectCardType', () => {
    it('debe detectar Visa', () => {
      expect(detectCardType('4242424242424242')).toBe('visa')
      expect(detectCardType('4')).toBe('visa')
    })

    it('debe detectar Mastercard', () => {
      expect(detectCardType('5555555555554444')).toBe('mastercard')
      expect(detectCardType('5105105105105100')).toBe('mastercard')
      expect(detectCardType('2221000000000009')).toBe('mastercard') // Nueva serie
    })

    it('debe detectar American Express', () => {
      expect(detectCardType('378282246310005')).toBe('amex')
      expect(detectCardType('371449635398431')).toBe('amex')
    })

    it('debe detectar Discover', () => {
      expect(detectCardType('6011111111111117')).toBe('discover')
      expect(detectCardType('6500000000000002')).toBe('discover')
    })

    it('debe retornar unknown para tarjetas no reconocidas', () => {
      expect(detectCardType('9999999999999999')).toBe('unknown')
      expect(detectCardType('1234567890123456')).toBe('unknown')
    })
  })

  describe('formatCardNumber', () => {
    it('debe formatear números de Visa/Mastercard con espacios 4-4-4-4', () => {
      expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242')
      expect(formatCardNumber('5555555555554444')).toBe('5555 5555 5555 4444')
    })

    it('debe formatear números de Amex con espacios 4-6-5', () => {
      expect(formatCardNumber('378282246310005')).toBe('3782 822463 10005')
    })

    it('debe manejar números parciales', () => {
      expect(formatCardNumber('4242')).toBe('4242')
      expect(formatCardNumber('424242')).toBe('4242 42')
    })
  })

  describe('maskCardNumber', () => {
    it('debe enmascarar el número mostrando solo los últimos 4 dígitos', () => {
      expect(maskCardNumber('4242424242424242')).toBe('**** **** **** 4242')
      expect(maskCardNumber('5555555555554444')).toBe('**** **** **** 4444')
    })

    it('debe manejar números con espacios', () => {
      expect(maskCardNumber('4242 4242 4242 4242')).toBe('**** **** **** 4242')
    })
  })

  describe('validateExpiryMonth', () => {
    it('debe validar meses válidos', () => {
      expect(validateExpiryMonth('01')).toBe(true)
      expect(validateExpiryMonth('12')).toBe(true)
      expect(validateExpiryMonth('6')).toBe(true)
    })

    it('debe rechazar meses inválidos', () => {
      expect(validateExpiryMonth('0')).toBe(false)
      expect(validateExpiryMonth('13')).toBe(false)
      expect(validateExpiryMonth('99')).toBe(false)
    })
  })

  describe('validateExpiryYear', () => {
    it('debe validar años futuros', () => {
      const currentYear = new Date().getFullYear()
      expect(validateExpiryYear(currentYear.toString())).toBe(true)
      expect(validateExpiryYear((currentYear + 5).toString())).toBe(true)
    })

    it('debe rechazar años pasados', () => {
      expect(validateExpiryYear('2020')).toBe(false)
      expect(validateExpiryYear('2000')).toBe(false)
    })

    it('debe rechazar años muy lejanos en el futuro', () => {
      const currentYear = new Date().getFullYear()
      expect(validateExpiryYear((currentYear + 25).toString())).toBe(false)
    })

    it('debe validar mes/año combinados para el año actual', () => {
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth() + 1
      
      // Mes actual o futuro debe ser válido
      expect(validateExpiryYear(currentYear.toString(), currentMonth.toString())).toBe(true)
      
      // Mes pasado en el año actual debe ser inválido
      if (currentMonth > 1) {
        expect(validateExpiryYear(currentYear.toString(), '01')).toBe(false)
      }
    })
  })

  describe('validateCVV', () => {
    it('debe validar CVV de 3 dígitos para tarjetas normales', () => {
      expect(validateCVV('123')).toBe(true)
      expect(validateCVV('999')).toBe(true)
    })

    it('debe validar CVV de 4 dígitos para Amex', () => {
      expect(validateCVV('1234', 'amex')).toBe(true)
      expect(validateCVV('9999', 'amex')).toBe(true)
    })

    it('debe rechazar CVV inválidos', () => {
      expect(validateCVV('12')).toBe(false) // Muy corto
      expect(validateCVV('12345')).toBe(false) // Muy largo
      expect(validateCVV('123', 'amex')).toBe(false) // Amex necesita 4
    })
  })

  describe('getCardTypeName', () => {
    it('debe retornar nombres completos de tarjetas', () => {
      expect(getCardTypeName('visa')).toBe('Visa')
      expect(getCardTypeName('mastercard')).toBe('Mastercard')
      expect(getCardTypeName('amex')).toBe('American Express')
      expect(getCardTypeName('discover')).toBe('Discover')
      expect(getCardTypeName('unknown')).toBe('Desconocida')
    })
  })

  describe('getMaxCVVLength', () => {
    it('debe retornar 4 para Amex', () => {
      expect(getMaxCVVLength('amex')).toBe(4)
    })

    it('debe retornar 3 para otras tarjetas', () => {
      expect(getMaxCVVLength('visa')).toBe(3)
      expect(getMaxCVVLength('mastercard')).toBe(3)
      expect(getMaxCVVLength('discover')).toBe(3)
      expect(getMaxCVVLength('unknown')).toBe(3)
    })
  })
})
