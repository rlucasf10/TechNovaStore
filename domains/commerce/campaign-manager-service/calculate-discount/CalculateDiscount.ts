/**
 * CalculateDiscount Use Case
 * 
 * Caso de uso para calcular el descuento aplicable a un producto según las reglas de una campaña.
 * 
 * Implementa los requisitos:
 * - 2.1: Soportar descuentos de tipo porcentaje (1-99%)
 * - 2.2: Soportar descuentos de tipo cantidad fija
 * - 2.3: Aplicar descuento por categoría a todos los productos de esa categoría
 * - 2.4: Priorizar descuento específico del producto sobre categoría o global
 * - 2.5: Aplicar descuento global a productos sin descuento específico o de categoría
 * - 2.6: Permitir definir descuento máximo en euros para descuentos porcentuales
 * - 2.7: Validar que las reglas de descuento sean matemáticamente correctas
 * - 3.3: Calcular precio con descuento y porcentaje de descuento
 */

import { DiscountCalculator, Product } from '../shared/utils/discount-calculator'
import { DiscountRules, DiscountRule } from '../shared/types'
import { logger } from '../shared/utils/logger'

/**
 * Input para el caso de uso CalculateDiscount
 */
export interface CalculateDiscountInput {
  /** Producto al que calcular el descuento */
  product: Product
  
  /** Reglas de descuento de la campaña */
  discountRules: DiscountRules
}

/**
 * Output del caso de uso CalculateDiscount
 */
export interface CalculateDiscountOutput {
  /** Precio original del producto */
  originalPrice: number
  
  /** Precio del producto con el descuento aplicado */
  campaignPrice: number
  
  /** Monto del descuento en euros */
  discountAmount: number
  
  /** Porcentaje de descuento aplicado (1-99) */
  discountPercentage: number
  
  /** Regla de descuento que fue aplicada (null si no hay descuento) */
  ruleApplied: DiscountRule | null
}

/**
 * Error personalizado para cálculo de descuento inválido
 */
export class InvalidDiscountCalculationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidDiscountCalculationError'
  }
}

/**
 * Caso de uso para calcular descuentos en productos
 * 
 * Este caso de uso encapsula la lógica de negocio para determinar
 * qué descuento aplicar a un producto según las reglas de una campaña,
 * respetando la prioridad: producto > categoría > global.
 */
export class CalculateDiscount {
  private discountCalculator: DiscountCalculator

  constructor(discountCalculator?: DiscountCalculator) {
    this.discountCalculator = discountCalculator || new DiscountCalculator()
  }

  /**
   * Ejecuta el caso de uso de cálculo de descuento
   * 
   * @param input - Producto y reglas de descuento
   * @returns Cálculo completo del descuento con precios y porcentajes
   * @throws {InvalidDiscountCalculationError} Si el cálculo resulta en valores inválidos
   */
  execute(input: CalculateDiscountInput): CalculateDiscountOutput {
    const { product, discountRules } = input

    logger.debug('Calculando descuento para producto', {
      operation: 'calculate_discount',
      productId: product.id,
      productPrice: product.our_price,
      productCategory: product.category,
      hasGlobalRule: !!discountRules.global,
      hasCategoryRules: !!discountRules.categories,
      hasProductRules: !!discountRules.products
    })

    try {
      // Validar que el precio del producto sea válido
      if (product.our_price <= 0) {
        logger.warn('Producto con precio inválido', {
          operation: 'calculate_discount',
          productId: product.id,
          price: product.our_price
        })
        throw new InvalidDiscountCalculationError(
          `El producto ${product.id} tiene un precio inválido: ${product.our_price}`
        )
      }

      // Paso 1: Determinar regla aplicable (Requisitos 2.3, 2.4, 2.5)
      // Prioridad: producto > categoría > global
      const applicableRule = this.discountCalculator.getApplicableRule(product, discountRules)

      // Si no hay regla aplicable, retornar sin descuento
      if (!applicableRule) {
        logger.debug('No hay regla de descuento aplicable para el producto', {
          operation: 'calculate_discount',
          productId: product.id
        })

        return {
          originalPrice: product.our_price,
          campaignPrice: product.our_price,
          discountAmount: 0,
          discountPercentage: 0,
          ruleApplied: null
        }
      }

      // Paso 2: Calcular descuento según tipo (Requisitos 2.1, 2.2, 2.6)
      const result = this.discountCalculator.calculateProductDiscount(product, discountRules)

      // Paso 3: Validar que el cálculo sea matemáticamente correcto (Requisito 2.7)
      const isValid = this.discountCalculator.validateDiscountCalculation(
        result.originalPrice,
        result.campaignPrice,
        result.discountAmount,
        result.discountPercentage
      )

      if (!isValid) {
        logger.error('Cálculo de descuento matemáticamente incorrecto', {
          operation: 'calculate_discount',
          productId: product.id,
          originalPrice: result.originalPrice,
          campaignPrice: result.campaignPrice,
          discountAmount: result.discountAmount,
          discountPercentage: result.discountPercentage
        })
        throw new InvalidDiscountCalculationError(
          'El cálculo de descuento resultó en valores matemáticamente incorrectos'
        )
      }

      // Registrar cálculo exitoso
      logger.debug('Descuento calculado exitosamente', {
        operation: 'calculate_discount',
        productId: product.id,
        originalPrice: result.originalPrice,
        campaignPrice: result.campaignPrice,
        discountAmount: result.discountAmount,
        discountPercentage: result.discountPercentage,
        ruleType: applicableRule.type,
        ruleValue: applicableRule.value
      })

      return {
        originalPrice: result.originalPrice,
        campaignPrice: result.campaignPrice,
        discountAmount: result.discountAmount,
        discountPercentage: result.discountPercentage,
        ruleApplied: result.ruleApplied
      }
    } catch (error) {
      // Si es un error conocido, re-lanzarlo
      if (error instanceof InvalidDiscountCalculationError) {
        throw error
      }

      // Para errores desconocidos, registrar y re-lanzar
      logger.error('Error al calcular descuento', {
        operation: 'calculate_discount',
        productId: product.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })

      throw error
    }
  }

  /**
   * Calcula descuentos para múltiples productos
   * 
   * @param products - Lista de productos
   * @param discountRules - Reglas de descuento de la campaña
   * @returns Lista de cálculos de descuento para cada producto
   */
  executeBatch(
    products: Product[],
    discountRules: DiscountRules
  ): CalculateDiscountOutput[] {
    logger.info('Calculando descuentos para lote de productos', {
      operation: 'calculate_discount_batch',
      productCount: products.length
    })

    const results = products.map(product => 
      this.execute({ product, discountRules })
    )

    const productsWithDiscount = results.filter(r => r.discountAmount > 0).length
    const totalDiscountAmount = results.reduce((sum, r) => sum + r.discountAmount, 0)
    const averageDiscountPercentage = productsWithDiscount > 0
      ? Math.round(
          results
            .filter(r => r.discountAmount > 0)
            .reduce((sum, r) => sum + r.discountPercentage, 0) / productsWithDiscount
        )
      : 0

    logger.info('Descuentos calculados para lote', {
      operation: 'calculate_discount_batch',
      totalProducts: products.length,
      productsWithDiscount,
      totalDiscountAmount: Math.round(totalDiscountAmount * 100) / 100,
      averageDiscountPercentage
    })

    return results
  }
}
