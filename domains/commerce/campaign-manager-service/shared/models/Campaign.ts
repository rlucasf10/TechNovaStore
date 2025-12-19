/**
 * Modelo de dominio para Campaign
 * 
 * Representa una campaña promocional con validaciones de negocio.
 * Implementa las reglas de validación definidas en los requisitos 1.1 y 11.2.
 */

import {
  Campaign as ICampaign,
  CreateCampaignData,
  DiscountRules,
  FrontendConfig,
  ValidationResult
} from '../types'

/**
 * Clase Campaign con validaciones de negocio
 * 
 * Esta clase encapsula la lógica de validación de campañas
 * y proporciona métodos para crear y validar instancias de Campaign.
 */
export class Campaign implements ICampaign {
  id: string
  name: string
  slug: string
  startDate: Date
  endDate: Date
  priority: number
  isActive: boolean
  discountRules: DiscountRules
  frontendConfig: FrontendConfig
  discountsApplied: boolean
  appliedAt?: Date
  deactivatedAt?: Date
  createdAt: Date
  updatedAt: Date

  /**
   * Constructor privado - usar métodos estáticos para crear instancias
   */
  private constructor(data: ICampaign) {
    this.id = data.id
    this.name = data.name
    this.slug = data.slug
    this.startDate = data.startDate
    this.endDate = data.endDate
    this.priority = data.priority
    this.isActive = data.isActive
    this.discountRules = data.discountRules
    this.frontendConfig = data.frontendConfig
    this.discountsApplied = data.discountsApplied
    this.appliedAt = data.appliedAt
    this.deactivatedAt = data.deactivatedAt
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  /**
   * Crea una nueva instancia de Campaign desde datos de base de datos
   * 
   * @param data - Datos de la campaña desde la base de datos
   * @returns Instancia de Campaign
   */
  static fromDatabase(data: ICampaign): Campaign {
    return new Campaign(data)
  }

  /**
   * Crea una nueva instancia de Campaign para inserción en base de datos
   * 
   * @param data - Datos para crear la campaña
   * @returns Instancia de Campaign con valores por defecto
   */
  static create(data: CreateCampaignData): Campaign {
    const now = new Date()
    
    return new Campaign({
      id: '', // Se generará en la base de datos
      name: data.name,
      slug: data.slug,
      startDate: data.startDate,
      endDate: data.endDate,
      priority: data.priority,
      isActive: false,
      discountRules: data.discountRules,
      frontendConfig: data.frontendConfig,
      discountsApplied: false,
      createdAt: now,
      updatedAt: now
    })
  }

  /**
   * Valida los datos de una campaña
   * 
   * Implementa las validaciones de los requisitos:
   * - 10.1: Fecha de inicio anterior a fecha de fin
   * - 10.2: Fechas no en el pasado
   * - 10.3: Nombre único (se valida en el repositorio)
   * - 10.4: Prioridad entero positivo
   * - 10.5: Porcentajes entre 1-99
   * - 10.6: Descuentos fijos positivos
   * 
   * @param data - Datos de la campaña a validar
   * @returns Resultado de validación con lista de errores
   */
  static validate(data: CreateCampaignData): ValidationResult {
    const errors: string[] = []

    // Validar nombre
    if (!data.name || data.name.trim().length === 0) {
      errors.push('El nombre de la campaña es requerido')
    }
    if (data.name && data.name.length > 255) {
      errors.push('El nombre de la campaña no puede exceder 255 caracteres')
    }

    // Validar slug
    if (!data.slug || data.slug.trim().length === 0) {
      errors.push('El slug de la campaña es requerido')
    }
    if (data.slug && data.slug.length > 255) {
      errors.push('El slug de la campaña no puede exceder 255 caracteres')
    }
    if (data.slug && !/^[a-z0-9-]+$/.test(data.slug)) {
      errors.push('El slug solo puede contener letras minúsculas, números y guiones')
    }

    // Validar fechas (Requisito 10.1)
    if (!data.startDate || !data.endDate) {
      errors.push('Las fechas de inicio y fin son requeridas')
    } else {
      if (data.startDate >= data.endDate) {
        errors.push('La fecha de inicio debe ser anterior a la fecha de fin')
      }

      // Validar que las fechas no estén en el pasado (Requisito 10.2)
      const now = new Date()
      if (data.startDate < now) {
        errors.push('La fecha de inicio no puede estar en el pasado')
      }
      if (data.endDate < now) {
        errors.push('La fecha de fin no puede estar en el pasado')
      }
    }

    // Validar prioridad (Requisito 10.4)
    if (data.priority === undefined || data.priority === null) {
      errors.push('La prioridad es requerida')
    } else {
      if (!Number.isInteger(data.priority)) {
        errors.push('La prioridad debe ser un número entero')
      }
      if (data.priority <= 0) {
        errors.push('La prioridad debe ser un número positivo')
      }
    }

    // Validar reglas de descuento
    const discountRulesErrors = this.validateDiscountRules(data.discountRules)
    errors.push(...discountRulesErrors)

    // Validar configuración de frontend
    const frontendConfigErrors = this.validateFrontendConfig(data.frontendConfig)
    errors.push(...frontendConfigErrors)

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Valida las reglas de descuento
   * 
   * Implementa las validaciones de los requisitos:
   * - 10.5: Porcentajes entre 1-99
   * - 10.6: Descuentos fijos positivos
   * - 2.7: Validación matemática de reglas
   * 
   * @param rules - Reglas de descuento a validar
   * @returns Lista de errores encontrados
   */
  private static validateDiscountRules(rules: DiscountRules): string[] {
    const errors: string[] = []

    if (!rules) {
      errors.push('Las reglas de descuento son requeridas')
      return errors
    }

    // Validar que al menos haya una regla definida
    if (!rules.global && !rules.categories && !rules.products) {
      errors.push('Debe definir al menos una regla de descuento (global, por categoría o por producto)')
    }

    // Validar regla global
    if (rules.global) {
      const globalErrors = this.validateDiscountRule(rules.global, 'global')
      errors.push(...globalErrors)
    }

    // Validar reglas por categoría
    if (rules.categories) {
      Object.entries(rules.categories).forEach(([category, rule]) => {
        const categoryErrors = this.validateDiscountRule(rule, `categoría "${category}"`)
        errors.push(...categoryErrors)
      })
    }

    // Validar reglas por producto
    if (rules.products) {
      Object.entries(rules.products).forEach(([productId, rule]) => {
        const productErrors = this.validateDiscountRule(rule, `producto "${productId}"`)
        errors.push(...productErrors)
      })
    }

    return errors
  }

  /**
   * Valida una regla de descuento individual
   * 
   * @param rule - Regla de descuento a validar
   * @param context - Contexto de la regla (para mensajes de error)
   * @returns Lista de errores encontrados
   */
  private static validateDiscountRule(rule: any, context: string): string[] {
    const errors: string[] = []

    if (!rule) {
      errors.push(`La regla de descuento para ${context} es inválida`)
      return errors
    }

    // Validar tipo
    if (!rule.type || !['percentage', 'fixed'].includes(rule.type)) {
      errors.push(`El tipo de descuento para ${context} debe ser "percentage" o "fixed"`)
    }

    // Validar valor
    if (rule.value === undefined || rule.value === null) {
      errors.push(`El valor de descuento para ${context} es requerido`)
    } else {
      if (typeof rule.value !== 'number' || isNaN(rule.value)) {
        errors.push(`El valor de descuento para ${context} debe ser un número`)
      } else {
        // Validar porcentajes (Requisito 10.5)
        if (rule.type === 'percentage') {
          if (rule.value < 1 || rule.value > 99) {
            errors.push(`El porcentaje de descuento para ${context} debe estar entre 1 y 99`)
          }
        }

        // Validar descuentos fijos (Requisito 10.6)
        if (rule.type === 'fixed') {
          if (rule.value <= 0) {
            errors.push(`El descuento fijo para ${context} debe ser un número positivo`)
          }
        }
      }
    }

    // Validar descuento máximo (solo para porcentajes)
    if (rule.maxDiscount !== undefined && rule.maxDiscount !== null) {
      if (rule.type !== 'percentage') {
        errors.push(`El descuento máximo solo aplica para descuentos porcentuales en ${context}`)
      }
      if (typeof rule.maxDiscount !== 'number' || rule.maxDiscount <= 0) {
        errors.push(`El descuento máximo para ${context} debe ser un número positivo`)
      }
    }

    // Validar compra mínima
    if (rule.minPurchase !== undefined && rule.minPurchase !== null) {
      if (typeof rule.minPurchase !== 'number' || rule.minPurchase <= 0) {
        errors.push(`La compra mínima para ${context} debe ser un número positivo`)
      }
    }

    return errors
  }

  /**
   * Valida la configuración de frontend
   * 
   * Implementa las validaciones del requisito 8.1-8.4
   * 
   * @param config - Configuración de frontend a validar
   * @returns Lista de errores encontrados
   */
  private static validateFrontendConfig(config: FrontendConfig): string[] {
    const errors: string[] = []

    if (!config) {
      errors.push('La configuración de frontend es requerida')
      return errors
    }

    // Validar promoBanner (Requisito 8.2)
    if (!config.promoBanner) {
      errors.push('La configuración del banner promocional es requerida')
    } else {
      if (!config.promoBanner.messages || !Array.isArray(config.promoBanner.messages)) {
        errors.push('Los mensajes del banner promocional son requeridos')
      } else if (config.promoBanner.messages.length === 0) {
        errors.push('Debe definir al menos un mensaje para el banner promocional')
      } else {
        config.promoBanner.messages.forEach((msg, index) => {
          if (!msg.icon || !msg.text) {
            errors.push(`El mensaje ${index + 1} del banner debe tener icono y texto`)
          }
        })
      }
    }

    // Validar hero (Requisito 8.3)
    if (!config.hero) {
      errors.push('La configuración del hero es requerida')
    } else {
      if (!config.hero.title || config.hero.title.trim().length === 0) {
        errors.push('El título del hero es requerido')
      }
      if (!config.hero.subtitle || config.hero.subtitle.trim().length === 0) {
        errors.push('El subtítulo del hero es requerido')
      }
      if (!config.hero.ctaText || config.hero.ctaText.trim().length === 0) {
        errors.push('El texto del CTA del hero es requerido')
      }
    }

    // Validar dealsSection (Requisito 8.4)
    if (!config.dealsSection) {
      errors.push('La configuración de la sección de ofertas es requerida')
    } else {
      if (!config.dealsSection.title || config.dealsSection.title.trim().length === 0) {
        errors.push('El título de la sección de ofertas es requerido')
      }
      if (!config.dealsSection.subtitle || config.dealsSection.subtitle.trim().length === 0) {
        errors.push('El subtítulo de la sección de ofertas es requerido')
      }
      if (!config.dealsSection.badge || config.dealsSection.badge.trim().length === 0) {
        errors.push('El badge de la sección de ofertas es requerido')
      }
    }

    return errors
  }

  /**
   * Activa la campaña
   */
  activate(): void {
    this.isActive = true
    this.updatedAt = new Date()
  }

  /**
   * Desactiva la campaña
   */
  deactivate(): void {
    this.isActive = false
    this.deactivatedAt = new Date()
    this.updatedAt = new Date()
  }

  /**
   * Marca los descuentos como aplicados
   */
  markDiscountsApplied(): void {
    this.discountsApplied = true
    this.appliedAt = new Date()
    this.updatedAt = new Date()
  }

  /**
   * Marca los descuentos como removidos
   */
  markDiscountsRemoved(): void {
    this.discountsApplied = false
    this.appliedAt = undefined
    this.updatedAt = new Date()
  }

  /**
   * Verifica si la campaña debe activarse
   * 
   * @param now - Fecha actual
   * @returns true si la campaña debe activarse
   */
  shouldActivate(now: Date = new Date()): boolean {
    return !this.isActive && this.startDate <= now && this.endDate > now
  }

  /**
   * Verifica si la campaña debe desactivarse
   * 
   * @param now - Fecha actual
   * @returns true si la campaña debe desactivarse
   */
  shouldDeactivate(now: Date = new Date()): boolean {
    return this.isActive && this.endDate <= now
  }

  /**
   * Convierte la campaña a objeto plano para serialización
   */
  toJSON(): ICampaign {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      startDate: this.startDate,
      endDate: this.endDate,
      priority: this.priority,
      isActive: this.isActive,
      discountRules: this.discountRules,
      frontendConfig: this.frontendConfig,
      discountsApplied: this.discountsApplied,
      appliedAt: this.appliedAt,
      deactivatedAt: this.deactivatedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}
