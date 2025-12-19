/**
 * Modelo de dominio para CampaignProduct
 * 
 * Representa un producto con descuento aplicado durante una campaña.
 * Implementa las reglas definidas en los requisitos 3.5 y 11.3.
 */

import {
  CampaignProduct as ICampaignProduct,
  CreateCampaignProductData,
  ValidationResult
} from '../types'

/**
 * Clase CampaignProduct con validaciones de negocio
 * 
 * Esta clase encapsula la lógica de productos en campaña,
 * incluyendo precios originales, con descuento y métricas de venta.
 */
export class CampaignProduct implements ICampaignProduct {
  id: string
  campaignId: string
  productId: string
  originalPrice: number
  campaignPrice: number
  discountPercentage: number
  discountAmount: number
  campaignStock?: number
  unitsSold: number
  appliedAt: Date

  /**
   * Constructor privado - usar métodos estáticos para crear instancias
   */
  private constructor(data: ICampaignProduct) {
    this.id = data.id
    this.campaignId = data.campaignId
    this.productId = data.productId
    this.originalPrice = data.originalPrice
    this.campaignPrice = data.campaignPrice
    this.discountPercentage = data.discountPercentage
    this.discountAmount = data.discountAmount
    this.campaignStock = data.campaignStock
    this.unitsSold = data.unitsSold
    this.appliedAt = data.appliedAt
  }

  /**
   * Crea una nueva instancia de CampaignProduct desde datos de base de datos
   * 
   * @param data - Datos del producto en campaña desde la base de datos
   * @returns Instancia de CampaignProduct
   */
  static fromDatabase(data: ICampaignProduct): CampaignProduct {
    return new CampaignProduct(data)
  }

  /**
   * Crea una nueva instancia de CampaignProduct para inserción en base de datos
   * 
   * @param data - Datos para crear el producto en campaña
   * @returns Instancia de CampaignProduct con valores por defecto
   */
  static create(data: CreateCampaignProductData): CampaignProduct {
    return new CampaignProduct({
      id: '', // Se generará en la base de datos
      campaignId: data.campaignId,
      productId: data.productId,
      originalPrice: data.originalPrice,
      campaignPrice: data.campaignPrice,
      discountPercentage: data.discountPercentage,
      discountAmount: data.discountAmount,
      campaignStock: data.campaignStock,
      unitsSold: 0,
      appliedAt: new Date()
    })
  }

  /**
   * Valida los datos de un producto en campaña
   * 
   * Implementa las validaciones de los requisitos:
   * - 3.2: Precio original debe guardarse
   * - 3.3: Precio con descuento y porcentaje deben calcularse correctamente
   * - 2.7: Validación matemática correcta
   * 
   * @param data - Datos del producto en campaña a validar
   * @returns Resultado de validación con lista de errores
   */
  static validate(data: CreateCampaignProductData): ValidationResult {
    const errors: string[] = []

    // Validar IDs requeridos
    if (!data.campaignId || data.campaignId.trim().length === 0) {
      errors.push('El ID de la campaña es requerido')
    }

    if (!data.productId || data.productId.trim().length === 0) {
      errors.push('El ID del producto es requerido')
    }

    // Validar precio original (Requisito 3.2)
    if (data.originalPrice === undefined || data.originalPrice === null) {
      errors.push('El precio original es requerido')
    } else {
      if (typeof data.originalPrice !== 'number' || isNaN(data.originalPrice)) {
        errors.push('El precio original debe ser un número')
      } else if (data.originalPrice <= 0) {
        errors.push('El precio original debe ser mayor que cero')
      }
    }

    // Validar precio con campaña (Requisito 3.3)
    if (data.campaignPrice === undefined || data.campaignPrice === null) {
      errors.push('El precio con campaña es requerido')
    } else {
      if (typeof data.campaignPrice !== 'number' || isNaN(data.campaignPrice)) {
        errors.push('El precio con campaña debe ser un número')
      } else if (data.campaignPrice <= 0) {
        errors.push('El precio con campaña debe ser mayor que cero')
      } else if (data.originalPrice && data.campaignPrice >= data.originalPrice) {
        errors.push('El precio con campaña debe ser menor que el precio original')
      }
    }

    // Validar porcentaje de descuento (Requisito 3.3)
    if (data.discountPercentage === undefined || data.discountPercentage === null) {
      errors.push('El porcentaje de descuento es requerido')
    } else {
      if (typeof data.discountPercentage !== 'number' || isNaN(data.discountPercentage)) {
        errors.push('El porcentaje de descuento debe ser un número')
      } else if (data.discountPercentage < 1 || data.discountPercentage > 99) {
        errors.push('El porcentaje de descuento debe estar entre 1 y 99')
      }
    }

    // Validar cantidad de descuento (Requisito 3.3)
    if (data.discountAmount === undefined || data.discountAmount === null) {
      errors.push('La cantidad de descuento es requerida')
    } else {
      if (typeof data.discountAmount !== 'number' || isNaN(data.discountAmount)) {
        errors.push('La cantidad de descuento debe ser un número')
      } else if (data.discountAmount <= 0) {
        errors.push('La cantidad de descuento debe ser mayor que cero')
      }
    }

    // Validar coherencia matemática (Requisito 2.7)
    if (
      data.originalPrice &&
      data.campaignPrice &&
      data.discountAmount &&
      data.discountPercentage
    ) {
      // Verificar que: precio con descuento = precio original - descuento
      const expectedCampaignPrice = data.originalPrice - data.discountAmount
      const priceDifference = Math.abs(data.campaignPrice - expectedCampaignPrice)
      
      if (priceDifference > 0.01) { // Tolerancia de 1 céntimo por redondeo
        errors.push(
          `El precio con campaña (${data.campaignPrice}) no coincide con el cálculo ` +
          `(precio original ${data.originalPrice} - descuento ${data.discountAmount} = ${expectedCampaignPrice})`
        )
      }

      // Verificar que: porcentaje = (descuento / precio original) * 100
      const expectedPercentage = Math.round((data.discountAmount / data.originalPrice) * 100)
      
      if (Math.abs(data.discountPercentage - expectedPercentage) > 1) { // Tolerancia de 1% por redondeo
        errors.push(
          `El porcentaje de descuento (${data.discountPercentage}%) no coincide con el cálculo ` +
          `((${data.discountAmount} / ${data.originalPrice}) * 100 = ${expectedPercentage}%)`
        )
      }
    }

    // Validar stock de campaña (opcional)
    if (data.campaignStock !== undefined && data.campaignStock !== null) {
      if (typeof data.campaignStock !== 'number' || !Number.isInteger(data.campaignStock)) {
        errors.push('El stock de campaña debe ser un número entero')
      } else if (data.campaignStock < 0) {
        errors.push('El stock de campaña no puede ser negativo')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Incrementa las unidades vendidas
   * 
   * @param quantity - Cantidad de unidades vendidas
   */
  incrementUnitsSold(quantity: number = 1): void {
    if (quantity <= 0) {
      throw new Error('La cantidad debe ser mayor que cero')
    }
    this.unitsSold += quantity
  }

  /**
   * Verifica si hay stock disponible
   * 
   * @returns true si hay stock disponible o si no se controla stock
   */
  hasStock(): boolean {
    if (this.campaignStock === undefined || this.campaignStock === null) {
      return true // No se controla stock
    }
    return this.campaignStock > this.unitsSold
  }

  /**
   * Obtiene el stock restante
   * 
   * @returns Stock restante o undefined si no se controla stock
   */
  getRemainingStock(): number | undefined {
    if (this.campaignStock === undefined || this.campaignStock === null) {
      return undefined
    }
    return Math.max(0, this.campaignStock - this.unitsSold)
  }

  /**
   * Calcula los ingresos generados por este producto
   * 
   * @returns Ingresos totales (precio con campaña * unidades vendidas)
   */
  calculateRevenue(): number {
    return this.campaignPrice * this.unitsSold
  }

  /**
   * Calcula el descuento total aplicado
   * 
   * @returns Descuento total (cantidad de descuento * unidades vendidas)
   */
  calculateTotalDiscount(): number {
    return this.discountAmount * this.unitsSold
  }

  /**
   * Verifica si el producto ha tenido ventas
   * 
   * @returns true si se han vendido unidades
   */
  hasSales(): boolean {
    return this.unitsSold > 0
  }

  /**
   * Convierte el producto en campaña a objeto plano para serialización
   */
  toJSON(): ICampaignProduct {
    return {
      id: this.id,
      campaignId: this.campaignId,
      productId: this.productId,
      originalPrice: this.originalPrice,
      campaignPrice: this.campaignPrice,
      discountPercentage: this.discountPercentage,
      discountAmount: this.discountAmount,
      campaignStock: this.campaignStock,
      unitsSold: this.unitsSold,
      appliedAt: this.appliedAt
    }
  }
}
