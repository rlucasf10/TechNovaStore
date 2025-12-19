/**
 * Tipos para gestión de métodos de pago del usuario
 */

export interface PaymentMethod {
  id: string
  userId: string
  type: PaymentMethodType
  label: string // 'Personal', 'Trabajo', etc.
  // Datos de tarjeta (enmascarados)
  cardNumber: string // Solo últimos 4 dígitos: **** **** **** 1234
  cardBrand: CardBrand
  cardholderName: string
  expiryMonth: string
  expiryYear: string
  // Dirección de facturación
  billingAddress?: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PaymentMethodFormData {
  type: PaymentMethodType
  label: string
  cardNumber: string
  cardholderName: string
  expiryMonth: string
  expiryYear: string
  cvv: string
  // Dirección de facturación
  billingStreet?: string
  billingCity?: string
  billingState?: string
  billingPostalCode?: string
  billingCountry?: string
  isDefault: boolean
}

export type PaymentMethodType = 'credit_card' | 'debit_card'

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown'

export type PaymentMethodLabel = 'Personal' | 'Trabajo' | 'Otro'
