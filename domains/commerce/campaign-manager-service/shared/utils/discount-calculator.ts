/**
 * Discount Calculator Utility - Campaign Manager Service
 * 
 * Proporciona funciones para calcular descuentos según reglas definidas.
 * Implementa los requisitos 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7.
 */

import { DiscountRule, DiscountRules } from '../types'

/**
 * Interfaz para representar un producto simplificado
 */
export interface Product {
  id: string
  our_price: number
  category?: string
}

/**
 * Resultado del cálculo de descuento
 */
export interface DiscountCalculation {
  /** Monto del descuento en euros */
  amount: number
  
  /** Porcentaje de descuento aplicado */
  percentage: number
}

/**
 * Clase para calcular descuentos según reglas de campaña
 */
export class DiscountCalculator {
  /**
   * Calcula el descuento para un precio según una regla
   * Requisitos: 2.1, 2.2, 2.6, 2.7
   * 
   * @param price - Precio original del producto
   * @param rule - Regla de descuento a aplicar
   * @returns Cálculo del descuento (monto y porcentaje)
   */
  calculateDiscount(price: number, rule: DiscountRule): DiscountCalculation {
    if (price <= 0) {
      return { amount: 0, percentage: 0 }
    }

    let discountAmount: number

    // Calcular descuento según el tipo
    if (rule.type === 'percentage') {
      // Requisito 2.1: Descuento porcentual (1-99%)
      const percentage = Math.max(1, Math.min(99, rule.value))
      discountAmount = price * (percentage / 100)
      
      // Requisito 2.6: Aplicar descuento máximo si está definido
      if (rule.maxDiscount !== undefined && rule.maxDiscount > 0) {
        discountAmount = Math.min(discountAmount, rule.maxDiscount)
      }
    } else if (rule.type === 'fixed') {
      // Requisito 2.2: Descuento de cantidad fija
      discountAmount = rule.value
      
      // No permitir que el descuento sea mayor al precio
      discountAmount = Math.min(discountAmount, price)
    } else {
      return { amount: 0, percentage: 0 }
    }

    // Requisito 2.7: Calcular porcentaje de descuento correctamente
    const discountPercentage = Math.round((discountAmount / price) * 100)

    return {
      amount: Math.round(discountAmount * 100) / 100, // Redondear a 2 decimales
      percentage: discountPercentage,
    }
  }

  /**
   * Aplica el límite de descuento máximo
   * Requisito: 2.6
   * 
   * @param discountAmount - Monto del descuento calculado
   * @param maxDiscount - Descuento máximo permitido (opcional)
   * @returns Monto del descuento limitado
   */
  applyMaxDiscount(discountAmount: number, maxDiscount?: number): number {
    if (maxDiscount === undefined || maxDiscount <= 0) {
      return discountAmount
    }

    return Math.min(discountAmount, maxDiscount)
  }

  /**
   * Obtiene la regla de descuento aplicable para un producto
   * Requisitos: 2.3, 2.4, 2.5
   * 
   * Prioridad:
   * 1. Descuento específico del producto (mayor prioridad)
   * 2. Descuento por categoría
   * 3. Descuento global (menor prioridad)
   * 
   * @param product - Producto para el cual obtener la regla
   * @param rules - Conjunto de reglas de descuento
   * @returns Regla aplicable o null si no hay ninguna
   */
  getApplicableRule(product: Product, rules: DiscountRules): DiscountRule | null {
    // Requisito 2.4: Prioridad 1 - Descuento específico del producto
    if (rules.products && rules.products[product.id]) {
      return rules.products[product.id]
    }

    // Requisito 2.3: Prioridad 2 - Descuento por categoría
    if (product.category && rules.categories && rules.categories[product.category]) {
      return rules.categories[product.category]
    }

    // Requisito 2.5: Prioridad 3 - Descuento global
    if (rules.global) {
      return rules.global
    }

    return null
  }

  /**
   * Calcula el precio con descuento para un producto
   * Requisito: 2.7
   * 
   * @param product - Producto al que aplicar el descuento
   * @param rules - Reglas de descuento de la campaña
   * @returns Objeto con precios y descuentos calculados
   */
  calculateProductDiscount(
    product: Product,
    rules: DiscountRules
  ): {
    originalPrice: number
    campaignPrice: number
    discountAmount: number
    discountPercentage: number
    ruleApplied: DiscountRule | null
  } {
    const originalPrice = product.our_price

    // Obtener la regla aplicable
    const rule = this.getApplicableRule(product, rules)

    if (!rule) {
      return {
        originalPrice,
        campaignPrice: originalPrice,
        discountAmount: 0,
        discountPercentage: 0,
        ruleApplied: null,
      }
    }

    // Calcular descuento
    const discount = this.calculateDiscount(originalPrice, rule)

    // Requisito 2.7: precio con descuento = precio original - descuento
    const campaignPrice = Math.round((originalPrice - discount.amount) * 100) / 100

    return {
      originalPrice,
      campaignPrice,
      discountAmount: discount.amount,
      discountPercentage: discount.percentage,
      ruleApplied: rule,
    }
  }

  /**
   * Valida que un descuento sea matemáticamente correcto
   * Requisito: 2.7
   * 
   * @param originalPrice - Precio original
   * @param campaignPrice - Precio con descuento
   * @param discountAmount - Monto del descuento
   * @param discountPercentage - Porcentaje del descuento
   * @returns true si los cálculos son correctos
   */
  validateDiscountCalculation(
    originalPrice: number,
    campaignPrice: number,
    discountAmount: number,
    discountPercentage: number
  ): boolean {
    // Validar que precio con descuento = precio original - descuento
    const expectedCampaignPrice = Math.round((originalPrice - discountAmount) * 100) / 100
    if (Math.abs(campaignPrice - expectedCampaignPrice) > 0.01) {
      return false
    }

    // Validar que porcentaje = (descuento / precio original) * 100
    const expectedPercentage = Math.round((discountAmount / originalPrice) * 100)
    if (discountPercentage !== expectedPercentage) {
      return false
    }

    // Validar que el precio con descuento sea menor al original
    if (campaignPrice >= originalPrice) {
      return false
    }

    // Validar que los valores sean positivos
    if (originalPrice <= 0 || campaignPrice < 0 || discountAmount < 0 || discountPercentage < 0) {
      return false
    }

    return true
  }

  /**
   * Calcula descuentos para múltiples productos
   * 
   * @param products - Lista de productos
   * @param rules - Reglas de descuento
   * @returns Lista de productos con descuentos calculados
   */
  calculateBatchDiscounts(
    products: Product[],
    rules: DiscountRules
  ): Array<{
    product: Product
    originalPrice: number
    campaignPrice: number
    discountAmount: number
    discountPercentage: number
    ruleApplied: DiscountRule | null
  }> {
    return products.map(product => ({
      product,
      ...this.calculateProductDiscount(product, rules),
    }))
  }

  /**
   * Calcula estadísticas de descuentos para un conjunto de productos
   * 
   * @param products - Lista de productos con descuentos calculados
   * @returns Estadísticas agregadas
   */
  calculateDiscountStatistics(
    products: Array<{
      originalPrice: number
      campaignPrice: number
      discountAmount: number
      discountPercentage: number
    }>
  ): {
    totalProducts: number
    totalOriginalPrice: number
    totalCampaignPrice: number
    totalDiscountAmount: number
    averageDiscountPercentage: number
  } {
    if (products.length === 0) {
      return {
        totalProducts: 0,
        totalOriginalPrice: 0,
        totalCampaignPrice: 0,
        totalDiscountAmount: 0,
        averageDiscountPercentage: 0,
      }
    }

    const totalOriginalPrice = products.reduce((sum, p) => sum + p.originalPrice, 0)
    const totalCampaignPrice = products.reduce((sum, p) => sum + p.campaignPrice, 0)
    const totalDiscountAmount = products.reduce((sum, p) => sum + p.discountAmount, 0)
    const averageDiscountPercentage = Math.round(
      products.reduce((sum, p) => sum + p.discountPercentage, 0) / products.length
    )

    return {
      totalProducts: products.length,
      totalOriginalPrice: Math.round(totalOriginalPrice * 100) / 100,
      totalCampaignPrice: Math.round(totalCampaignPrice * 100) / 100,
      totalDiscountAmount: Math.round(totalDiscountAmount * 100) / 100,
      averageDiscountPercentage,
    }
  }
}

/**
 * Instancia singleton del calculador de descuentos
 */
export const discountCalculator = new DiscountCalculator()

export default discountCalculator
