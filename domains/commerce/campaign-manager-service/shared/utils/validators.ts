/**
 * Validators Utility - Campaign Manager Service
 * 
 * Proporciona validación y sanitización de datos para campañas.
 * Implementa los requisitos 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7.
 */

import {
  CreateCampaignData,
  DiscountRules,
  DiscountRule,
  FrontendConfig,
  ValidationResult,
} from '../types'

/**
 * Clase para validar datos de campañas
 */
export class CampaignValidator {
  /**
   * Valida todos los datos de una campaña
   * 
   * @param data - Datos de la campaña a validar
   * @returns Resultado de la validación con lista de errores
   */
  validateCampaignData(data: CreateCampaignData): ValidationResult {
    const errors: string[] = []

    // Validar nombre
    if (!data.name || typeof data.name !== 'string') {
      errors.push('El nombre de la campaña es requerido')
    } else if (data.name.trim().length < 3) {
      errors.push('El nombre de la campaña debe tener al menos 3 caracteres')
    } else if (data.name.length > 255) {
      errors.push('El nombre de la campaña no puede exceder 255 caracteres')
    }

    // Validar slug
    if (!data.slug || typeof data.slug !== 'string') {
      errors.push('El slug de la campaña es requerido')
    } else if (data.slug.trim().length < 3) {
      errors.push('El slug de la campaña debe tener al menos 3 caracteres')
    } else if (data.slug.length > 255) {
      errors.push('El slug de la campaña no puede exceder 255 caracteres')
    } else if (!/^[a-z0-9-]+$/.test(data.slug)) {
      errors.push('El slug solo puede contener letras minúsculas, números y guiones')
    }

    // Validar fechas
    const dateValidation = this.validateDates(data.startDate, data.endDate)
    if (!dateValidation.isValid) {
      errors.push(...dateValidation.errors)
    }

    // Validar prioridad
    if (typeof data.priority !== 'number') {
      errors.push('La prioridad debe ser un número')
    } else if (!Number.isInteger(data.priority)) {
      errors.push('La prioridad debe ser un número entero')
    } else if (data.priority < 1) {
      errors.push('La prioridad debe ser un número positivo mayor que 0')
    }

    // Validar reglas de descuento
    const rulesValidation = this.validateDiscountRules(data.discountRules)
    if (!rulesValidation.isValid) {
      errors.push(...rulesValidation.errors)
    }

    // Validar configuración de frontend
    const configValidation = this.validateFrontendConfig(data.frontendConfig)
    if (!configValidation.isValid) {
      errors.push(...configValidation.errors)
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Valida las fechas de inicio y fin de una campaña
   * Requisitos: 10.1, 10.2
   * 
   * @param startDate - Fecha de inicio
   * @param endDate - Fecha de fin
   * @returns Resultado de la validación
   */
  validateDates(startDate: Date, endDate: Date): ValidationResult {
    const errors: string[] = []

    // Validar que sean fechas válidas
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
      errors.push('La fecha de inicio no es válida')
    }

    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
      errors.push('La fecha de fin no es válida')
    }

    if (errors.length > 0) {
      return { isValid: false, errors }
    }

    // Requisito 10.1: La fecha de inicio debe ser anterior a la fecha de fin
    if (startDate >= endDate) {
      errors.push('La fecha de inicio debe ser anterior a la fecha de fin')
    }

    // Requisito 10.2: Las fechas no deben estar en el pasado (al crear)
    const now = new Date()
    if (startDate < now) {
      errors.push('La fecha de inicio no puede estar en el pasado')
    }

    if (endDate < now) {
      errors.push('La fecha de fin no puede estar en el pasado')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Valida las reglas de descuento de una campaña
   * Requisitos: 10.4, 10.5, 10.6
   * 
   * @param rules - Reglas de descuento a validar
   * @returns Resultado de la validación
   */
  validateDiscountRules(rules: DiscountRules): ValidationResult {
    const errors: string[] = []

    // Validar que haya al menos una regla
    if (!rules.global && !rules.categories && !rules.products) {
      errors.push('Debe definir al menos una regla de descuento (global, por categoría o por producto)')
    }

    // Validar regla global
    if (rules.global) {
      const globalValidation = this.validateDiscountRule(rules.global, 'global')
      if (!globalValidation.isValid) {
        errors.push(...globalValidation.errors)
      }
    }

    // Validar reglas por categoría
    if (rules.categories) {
      Object.entries(rules.categories).forEach(([category, rule]) => {
        const categoryValidation = this.validateDiscountRule(rule, `categoría "${category}"`)
        if (!categoryValidation.isValid) {
          errors.push(...categoryValidation.errors)
        }
      })
    }

    // Validar reglas por producto
    if (rules.products) {
      Object.entries(rules.products).forEach(([productId, rule]) => {
        const productValidation = this.validateDiscountRule(rule, `producto "${productId}"`)
        if (!productValidation.isValid) {
          errors.push(...productValidation.errors)
        }
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Valida una regla de descuento individual
   * Requisitos: 10.5, 10.6
   * 
   * @param rule - Regla de descuento a validar
   * @param context - Contexto de la regla (para mensajes de error)
   * @returns Resultado de la validación
   */
  private validateDiscountRule(rule: DiscountRule, context: string): ValidationResult {
    const errors: string[] = []

    // Validar tipo
    if (!rule.type || (rule.type !== 'percentage' && rule.type !== 'fixed')) {
      errors.push(`Tipo de descuento inválido en ${context}. Debe ser "percentage" o "fixed"`)
    }

    // Validar valor
    if (typeof rule.value !== 'number' || isNaN(rule.value)) {
      errors.push(`El valor del descuento en ${context} debe ser un número`)
    } else {
      // Requisito 10.5: Porcentajes entre 1 y 99
      if (rule.type === 'percentage') {
        if (rule.value < 1 || rule.value > 99) {
          errors.push(`El porcentaje de descuento en ${context} debe estar entre 1 y 99`)
        }
      }

      // Requisito 10.6: Descuentos fijos deben ser positivos
      if (rule.type === 'fixed') {
        if (rule.value <= 0) {
          errors.push(`El descuento fijo en ${context} debe ser un número positivo`)
        }
      }
    }

    // Validar descuento máximo (solo para porcentajes)
    if (rule.maxDiscount !== undefined) {
      if (rule.type !== 'percentage') {
        errors.push(`El descuento máximo en ${context} solo aplica para descuentos porcentuales`)
      } else if (typeof rule.maxDiscount !== 'number' || rule.maxDiscount <= 0) {
        errors.push(`El descuento máximo en ${context} debe ser un número positivo`)
      }
    }

    // Validar compra mínima
    if (rule.minPurchase !== undefined) {
      if (typeof rule.minPurchase !== 'number' || rule.minPurchase <= 0) {
        errors.push(`La compra mínima en ${context} debe ser un número positivo`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Valida la configuración de frontend de una campaña
   * 
   * @param config - Configuración de frontend a validar
   * @returns Resultado de la validación
   */
  validateFrontendConfig(config: FrontendConfig): ValidationResult {
    const errors: string[] = []

    // Validar promoBanner
    if (!config.promoBanner) {
      errors.push('La configuración del banner promocional es requerida')
    } else {
      if (!Array.isArray(config.promoBanner.messages) || config.promoBanner.messages.length === 0) {
        errors.push('El banner promocional debe tener al menos un mensaje')
      } else {
        config.promoBanner.messages.forEach((msg, index) => {
          if (!msg.icon || typeof msg.icon !== 'string') {
            errors.push(`El mensaje ${index + 1} del banner debe tener un icono`)
          }
          if (!msg.text || typeof msg.text !== 'string') {
            errors.push(`El mensaje ${index + 1} del banner debe tener texto`)
          }
        })
      }
    }

    // Validar hero
    if (!config.hero) {
      errors.push('La configuración del hero es requerida')
    } else {
      if (!config.hero.title || typeof config.hero.title !== 'string') {
        errors.push('El hero debe tener un título')
      }
      if (!config.hero.subtitle || typeof config.hero.subtitle !== 'string') {
        errors.push('El hero debe tener un subtítulo')
      }
      if (!config.hero.ctaText || typeof config.hero.ctaText !== 'string') {
        errors.push('El hero debe tener un texto de CTA')
      }
    }

    // Validar dealsSection
    if (!config.dealsSection) {
      errors.push('La configuración de la sección de ofertas es requerida')
    } else {
      if (!config.dealsSection.title || typeof config.dealsSection.title !== 'string') {
        errors.push('La sección de ofertas debe tener un título')
      }
      if (!config.dealsSection.subtitle || typeof config.dealsSection.subtitle !== 'string') {
        errors.push('La sección de ofertas debe tener un subtítulo')
      }
      if (!config.dealsSection.badge || typeof config.dealsSection.badge !== 'string') {
        errors.push('La sección de ofertas debe tener un badge')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Sanitiza una cadena de texto para prevenir inyección SQL y XSS
   * Requisito: 10.7
   * 
   * @param input - Cadena a sanitizar
   * @returns Cadena sanitizada
   */
  sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return ''
    }

    return input
      // Eliminar caracteres de control
      .replace(/[\x00-\x1F\x7F]/g, '')
      // Escapar caracteres HTML peligrosos
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      // Eliminar scripts
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Trim espacios
      .trim()
  }

  /**
   * Sanitiza un objeto completo recursivamente
   * Requisito: 10.7
   * 
   * @param obj - Objeto a sanitizar
   * @returns Objeto sanitizado
   */
  sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const sanitized: any = {}

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value)
      } else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
        if (Array.isArray(value)) {
          sanitized[key] = value.map(item =>
            typeof item === 'string' ? this.sanitizeString(item) :
            typeof item === 'object' ? this.sanitizeObject(item) :
            item
          )
        } else {
          sanitized[key] = this.sanitizeObject(value)
        }
      } else {
        sanitized[key] = value
      }
    }

    return sanitized as T
  }

  /**
   * Sanitiza los datos de una campaña antes de almacenarlos
   * Requisito: 10.7
   * 
   * @param data - Datos de la campaña a sanitizar
   * @returns Datos sanitizados
   */
  sanitizeCampaignData(data: CreateCampaignData): CreateCampaignData {
    return {
      ...data,
      name: this.sanitizeString(data.name),
      slug: this.sanitizeString(data.slug),
      frontendConfig: this.sanitizeObject(data.frontendConfig),
    }
  }
}

/**
 * Instancia singleton del validador
 */
export const campaignValidator = new CampaignValidator()

export default campaignValidator
