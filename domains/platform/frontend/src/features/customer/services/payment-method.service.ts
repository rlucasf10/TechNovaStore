/**
 * Servicio para gestión de métodos de pago del usuario
 * Por ahora usa localStorage, pero está preparado para integración con backend
 * 
 * SEGURIDAD:
 * - NUNCA almacena números de tarjeta completos (solo últimos 4 dígitos)
 * - NUNCA almacena CVV
 * - Los datos se enmascaran antes de almacenar
 */

import {
  PaymentMethod,
  PaymentMethodFormData,
  CardBrand,
} from '../types/payment-method.types'
import { maskCardNumber } from '@/shared/lib/security'

const STORAGE_KEY = 'user_payment_methods'

class PaymentMethodService {
  /**
   * Obtener todos los métodos de pago del usuario
   */
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`)
      if (!stored) return []

      const methods = JSON.parse(stored) as PaymentMethod[]
      // Convertir strings de fecha a objetos Date
      return methods.map((method) => ({
        ...method,
        createdAt: new Date(method.createdAt),
        updatedAt: new Date(method.updatedAt),
      }))
    } catch (error) {
      console.error('Error al obtener métodos de pago:', error)
      return []
    }
  }

  /**
   * Obtener un método de pago por ID
   */
  async getPaymentMethod(
    userId: string,
    methodId: string
  ): Promise<PaymentMethod | null> {
    const methods = await this.getPaymentMethods(userId)
    return methods.find((method) => method.id === methodId) || null
  }

  /**
   * Obtener el método de pago predeterminado
   */
  async getDefaultPaymentMethod(userId: string): Promise<PaymentMethod | null> {
    const methods = await this.getPaymentMethods(userId)
    return methods.find((method) => method.isDefault) || null
  }

  /**
   * Crear un nuevo método de pago
   */
  async createPaymentMethod(
    userId: string,
    data: PaymentMethodFormData
  ): Promise<PaymentMethod> {
    const methods = await this.getPaymentMethods(userId)

    // Si es el primero o se marca como predeterminado, actualizar otros
    if (data.isDefault || methods.length === 0) {
      methods.forEach((method) => {
        method.isDefault = false
      })
    }

    // Detectar marca de tarjeta
    const cardBrand = this.detectCardBrand(data.cardNumber)

    // Enmascarar número de tarjeta (solo guardar últimos 4 dígitos)
    const maskedCardNumber = this.maskCardNumber(data.cardNumber)

    const newMethod: PaymentMethod = {
      id: this.generateId(),
      userId,
      type: data.type,
      label: data.label,
      cardNumber: maskedCardNumber,
      cardBrand,
      cardholderName: data.cardholderName,
      expiryMonth: data.expiryMonth,
      expiryYear: data.expiryYear,
      billingAddress: data.billingStreet
        ? {
            street: data.billingStreet,
            city: data.billingCity || '',
            state: data.billingState || '',
            postalCode: data.billingPostalCode || '',
            country: data.billingCountry || 'España',
          }
        : undefined,
      isDefault: data.isDefault || methods.length === 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    methods.push(newMethod)
    this.savePaymentMethods(userId, methods)

    return newMethod
  }

  /**
   * Actualizar un método de pago existente
   */
  async updatePaymentMethod(
    userId: string,
    methodId: string,
    data: Partial<PaymentMethodFormData>
  ): Promise<PaymentMethod> {
    const methods = await this.getPaymentMethods(userId)
    const index = methods.findIndex((method) => method.id === methodId)

    if (index === -1) {
      throw new Error('Método de pago no encontrado')
    }

    // Si se marca como predeterminado, desmarcar los demás
    if (data.isDefault) {
      methods.forEach((method) => {
        method.isDefault = false
      })
    }

    // Actualizar datos (sin cambiar número de tarjeta por seguridad)
    const updatedMethod: PaymentMethod = {
      ...methods[index],
      label: data.label ?? methods[index].label,
      cardholderName: data.cardholderName ?? methods[index].cardholderName,
      expiryMonth: data.expiryMonth ?? methods[index].expiryMonth,
      expiryYear: data.expiryYear ?? methods[index].expiryYear,
      billingAddress: data.billingStreet
        ? {
            street: data.billingStreet,
            city: data.billingCity || '',
            state: data.billingState || '',
            postalCode: data.billingPostalCode || '',
            country: data.billingCountry || 'España',
          }
        : methods[index].billingAddress,
      isDefault: data.isDefault ?? methods[index].isDefault,
      updatedAt: new Date(),
    }

    methods[index] = updatedMethod
    this.savePaymentMethods(userId, methods)

    return updatedMethod
  }

  /**
   * Eliminar un método de pago
   */
  async deletePaymentMethod(userId: string, methodId: string): Promise<void> {
    const methods = await this.getPaymentMethods(userId)
    const filtered = methods.filter((method) => method.id !== methodId)

    // Si se eliminó el predeterminado y quedan otros, marcar el primero
    const deletedMethod = methods.find((method) => method.id === methodId)
    if (deletedMethod?.isDefault && filtered.length > 0) {
      filtered[0].isDefault = true
    }

    this.savePaymentMethods(userId, filtered)
  }

  /**
   * Marcar un método de pago como predeterminado
   */
  async setDefaultPaymentMethod(
    userId: string,
    methodId: string
  ): Promise<void> {
    const methods = await this.getPaymentMethods(userId)

    methods.forEach((method) => {
      method.isDefault = method.id === methodId
      if (method.id === methodId) {
        method.updatedAt = new Date()
      }
    })

    this.savePaymentMethods(userId, methods)
  }

  /**
   * Detectar marca de tarjeta basado en el número
   */
  private detectCardBrand(cardNumber: string): CardBrand {
    const cleanNumber = cardNumber.replace(/\s/g, '')

    // Visa: empieza con 4
    if (/^4/.test(cleanNumber)) return 'visa'

    // Mastercard: empieza con 51-55 o 2221-2720
    if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber))
      return 'mastercard'

    // American Express: empieza con 34 o 37
    if (/^3[47]/.test(cleanNumber)) return 'amex'

    // Discover: empieza con 6011, 622126-622925, 644-649, 65
    if (
      /^6011/.test(cleanNumber) ||
      /^65/.test(cleanNumber) ||
      /^64[4-9]/.test(cleanNumber)
    )
      return 'discover'

    return 'unknown'
  }

  /**
   * Enmascarar número de tarjeta
   * NOTA: Usa la función centralizada de seguridad
   */
  private maskCardNumber(cardNumber: string): string {
    return maskCardNumber(cardNumber)
  }

  /**
   * Guardar métodos de pago en localStorage
   */
  private savePaymentMethods(
    userId: string,
    methods: PaymentMethod[]
  ): void {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(methods))
  }

  /**
   * Generar ID único
   */
  private generateId(): string {
    return `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export const paymentMethodService = new PaymentMethodService()
