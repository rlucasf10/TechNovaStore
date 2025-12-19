/**
 * Property-Based Tests para CalculateDiscount
 * 
 * Implementa tests basados en propiedades para validar el comportamiento
 * del caso de uso CalculateDiscount.
 */

import fc from 'fast-check'
import { CalculateDiscount, InvalidDiscountCalculationError } from './CalculateDiscount'
import { DiscountCalculator, Product } from '../shared/utils/discount-calculator'
import { DiscountRules, DiscountRule } from '../shared/types'

/**
 * Generadores (Arbitraries) para fast-check
 */

/**
 * Genera un producto válido
 * Usa valores enteros para evitar problemas de precisión de punto flotante
 */
const productArbitrary = (): fc.Arbitrary<Product> => {
  return fc.record({
    // Usar UUID para evitar colisiones con propiedades reservadas de JavaScript
    id: fc.uuid(),
    // Usar enteros para evitar problemas de precisión de punto flotante
    our_price: fc.integer({ min: 10, max: 10000 }),
    category: fc.option(
      fc.constantFrom('portatiles', 'componentes', 'perifericos', 'monitores', 'almacenamiento'),
      { nil: undefined }
    )
  })
}

/**
 * Genera una regla de descuento porcentual válida
 * Usa valores enteros para evitar problemas de precisión
 */
const percentageDiscountRuleArbitrary = (): fc.Arbitrary<DiscountRule> => {
  return fc.record({
    type: fc.constant('percentage' as const),
    value: fc.integer({ min: 1, max: 99 }),
    maxDiscount: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined })
  })
}

/**
 * Genera una regla de descuento fijo válida
 * Usa valores enteros para evitar problemas de precisión
 */
const fixedDiscountRuleArbitrary = (): fc.Arbitrary<DiscountRule> => {
  return fc.record({
    type: fc.constant('fixed' as const),
    // Usar valores enteros pequeños para evitar que el descuento sea mayor que el precio
    value: fc.integer({ min: 1, max: 100 })
  })
}

/**
 * Genera cualquier regla de descuento válida
 */
const discountRuleArbitrary = (): fc.Arbitrary<DiscountRule> => {
  return fc.oneof(
    percentageDiscountRuleArbitrary(),
    fixedDiscountRuleArbitrary()
  )
}

/**
 * Genera reglas de descuento con solo descuento global
 */
const globalDiscountRulesArbitrary = (): fc.Arbitrary<DiscountRules> => {
  return fc.record({
    global: discountRuleArbitrary(),
    categories: fc.constant(undefined),
    products: fc.constant(undefined)
  })
}

/**
 * Genera reglas de descuento con descuentos por categoría
 */
const categoryDiscountRulesArbitrary = (): fc.Arbitrary<DiscountRules> => {
  return fc.record({
    global: fc.option(discountRuleArbitrary(), { nil: undefined }),
    categories: fc.dictionary(
      fc.constantFrom('portatiles', 'componentes', 'perifericos', 'monitores', 'almacenamiento'),
      discountRuleArbitrary(),
      { minKeys: 1, maxKeys: 5 }
    ),
    products: fc.constant(undefined)
  })
}

/**
 * Genera reglas de descuento con descuentos específicos por producto
 */
const productDiscountRulesArbitrary = (): fc.Arbitrary<DiscountRules> => {
  return fc.record({
    global: fc.option(discountRuleArbitrary(), { nil: undefined }),
    categories: fc.option(
      fc.dictionary(
        fc.constantFrom('portatiles', 'componentes', 'perifericos', 'monitores', 'almacenamiento'),
        discountRuleArbitrary(),
        { maxKeys: 3 }
      ),
      { nil: undefined }
    ),
    // Usar UUID para evitar colisiones con propiedades reservadas de JavaScript
    products: fc.dictionary(
      fc.uuid(),
      discountRuleArbitrary(),
      { minKeys: 1, maxKeys: 10 }
    )
  })
}

/**
 * Genera reglas de descuento completas (cualquier combinación)
 */
const discountRulesArbitrary = (): fc.Arbitrary<DiscountRules> => {
  return fc.oneof(
    globalDiscountRulesArbitrary(),
    categoryDiscountRulesArbitrary(),
    productDiscountRulesArbitrary()
  )
}

/**
 * Tests de Propiedades
 */
describe('CalculateDiscount - Property-Based Tests', () => {
  let calculateDiscount: CalculateDiscount
  let discountCalculator: DiscountCalculator

  beforeEach(() => {
    discountCalculator = new DiscountCalculator()
    calculateDiscount = new CalculateDiscount(discountCalculator)
  })

  /**
   * Feature: campaign-manager-service, Property 14: Discount Calculation Correctness
   * Validates: Requirements 3.3
   * 
   * Para cualquier producto con descuento aplicado, el precio con descuento
   * y el porcentaje de descuento deben calcularse correctamente según la regla aplicada.
   */
  describe('Property 14: Discount Calculation Correctness', () => {
    it('should calculate discount correctly for percentage rules', () => {
      fc.assert(
        fc.property(
          productArbitrary(),
          percentageDiscountRuleArbitrary(),
          (product, rule) => {
            // Arrange
            const discountRules: DiscountRules = { global: rule }

            // Act
            const result = calculateDiscount.execute({ product, discountRules })

            // Assert - Verificar que el cálculo es matemáticamente correcto
            const expectedDiscountAmount = product.our_price * (rule.value / 100)
            const cappedDiscountAmount = rule.maxDiscount 
              ? Math.min(expectedDiscountAmount, rule.maxDiscount)
              : expectedDiscountAmount
            
            const expectedCampaignPrice = product.our_price - cappedDiscountAmount
            const expectedPercentage = Math.round((cappedDiscountAmount / product.our_price) * 100)

            // Verificar precio original
            expect(result.originalPrice).toBe(product.our_price)

            // Verificar precio con descuento (con tolerancia de 0.01 por redondeo)
            expect(Math.abs(result.campaignPrice - expectedCampaignPrice)).toBeLessThanOrEqual(0.01)

            // Verificar monto de descuento (con tolerancia de 0.01 por redondeo)
            expect(Math.abs(result.discountAmount - cappedDiscountAmount)).toBeLessThanOrEqual(0.01)

            // Verificar porcentaje de descuento
            expect(result.discountPercentage).toBe(expectedPercentage)

            // Verificar que el precio con descuento es menor al original
            expect(result.campaignPrice).toBeLessThan(result.originalPrice)

            // Verificar que la regla aplicada es la correcta
            expect(result.ruleApplied).toEqual(rule)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should calculate discount correctly for fixed amount rules', () => {
      fc.assert(
        fc.property(
          productArbitrary(),
          fixedDiscountRuleArbitrary(),
          (product, rule) => {
            // Arrange
            const discountRules: DiscountRules = { global: rule }

            // Act
            const result = calculateDiscount.execute({ product, discountRules })

            // Assert - Verificar que el cálculo es matemáticamente correcto
            const expectedDiscountAmount = Math.min(rule.value, product.our_price)
            const expectedCampaignPrice = product.our_price - expectedDiscountAmount
            const expectedPercentage = Math.round((expectedDiscountAmount / product.our_price) * 100)

            // Verificar precio original
            expect(result.originalPrice).toBe(product.our_price)

            // Verificar precio con descuento (con tolerancia de 0.01 por redondeo)
            expect(Math.abs(result.campaignPrice - expectedCampaignPrice)).toBeLessThanOrEqual(0.01)

            // Verificar monto de descuento (con tolerancia de 0.01 por redondeo)
            expect(Math.abs(result.discountAmount - expectedDiscountAmount)).toBeLessThanOrEqual(0.01)

            // Verificar porcentaje de descuento
            expect(result.discountPercentage).toBe(expectedPercentage)

            // Verificar que el precio con descuento es menor o igual al original
            expect(result.campaignPrice).toBeLessThanOrEqual(result.originalPrice)

            // Verificar que la regla aplicada es la correcta
            expect(result.ruleApplied).toEqual(rule)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should respect maximum discount cap for percentage rules', () => {
      fc.assert(
        fc.property(
          // Usar producto con precio mínimo más alto para evitar casos límite
          fc.record({
            id: fc.uuid(),
            our_price: fc.integer({ min: 100, max: 10000 }),
            category: fc.constantFrom('portatiles', 'componentes', 'perifericos', 'monitores', 'almacenamiento')
          }),
          fc.integer({ min: 50, max: 99 }), // Alto porcentaje
          fc.integer({ min: 1, max: 50 }), // Descuento máximo bajo (entero para evitar problemas de precisión)
          (product, percentage, maxDiscount) => {
            // Arrange
            const rule: DiscountRule = {
              type: 'percentage',
              value: percentage,
              maxDiscount
            }
            const discountRules: DiscountRules = { global: rule }

            // Act
            const result = calculateDiscount.execute({ product, discountRules })

            // Assert - El descuento no debe exceder el máximo
            expect(result.discountAmount).toBeLessThanOrEqual(maxDiscount + 0.01) // +0.01 por redondeo

            // Verificar que el cálculo sigue siendo matemáticamente correcto
            const expectedCampaignPrice = product.our_price - result.discountAmount
            expect(Math.abs(result.campaignPrice - expectedCampaignPrice)).toBeLessThanOrEqual(0.01)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return zero discount when no rules apply', () => {
      fc.assert(
        fc.property(
          productArbitrary(),
          (product) => {
            // Arrange - Reglas vacías
            const discountRules: DiscountRules = {}

            // Act
            const result = calculateDiscount.execute({ product, discountRules })

            // Assert - No debe haber descuento
            expect(result.originalPrice).toBe(product.our_price)
            expect(result.campaignPrice).toBe(product.our_price)
            expect(result.discountAmount).toBe(0)
            expect(result.discountPercentage).toBe(0)
            expect(result.ruleApplied).toBeNull()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should prioritize product-specific discount over category and global', () => {
      fc.assert(
        fc.property(
          productArbitrary().filter(p => p.category !== undefined),
          discountRuleArbitrary(),
          discountRuleArbitrary(),
          discountRuleArbitrary(),
          (product, productRule, categoryRule, globalRule) => {
            // Arrange - Reglas en todos los niveles
            const discountRules: DiscountRules = {
              global: globalRule,
              categories: { [product.category!]: categoryRule },
              products: { [product.id]: productRule }
            }

            // Act
            const result = calculateDiscount.execute({ product, discountRules })

            // Assert - Debe aplicar la regla específica del producto
            expect(result.ruleApplied).toEqual(productRule)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should prioritize category discount over global when no product-specific rule exists', () => {
      fc.assert(
        fc.property(
          productArbitrary().filter(p => p.category !== undefined),
          discountRuleArbitrary(),
          discountRuleArbitrary(),
          (product, categoryRule, globalRule) => {
            // Arrange - Solo reglas de categoría y global
            const discountRules: DiscountRules = {
              global: globalRule,
              categories: { [product.category!]: categoryRule }
            }

            // Act
            const result = calculateDiscount.execute({ product, discountRules })

            // Assert - Debe aplicar la regla de categoría
            expect(result.ruleApplied).toEqual(categoryRule)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should apply global discount when no specific or category rules exist', () => {
      fc.assert(
        fc.property(
          productArbitrary(),
          discountRuleArbitrary(),
          (product, globalRule) => {
            // Arrange - Solo regla global
            const discountRules: DiscountRules = {
              global: globalRule
            }

            // Act
            const result = calculateDiscount.execute({ product, discountRules })

            // Assert - Debe aplicar la regla global
            expect(result.ruleApplied).toEqual(globalRule)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain mathematical correctness: campaignPrice = originalPrice - discountAmount', () => {
      fc.assert(
        fc.property(
          productArbitrary(),
          discountRulesArbitrary(),
          (product, discountRules) => {
            // Act
            const result = calculateDiscount.execute({ product, discountRules })

            // Assert - Verificar la ecuación fundamental
            const calculatedCampaignPrice = result.originalPrice - result.discountAmount
            expect(Math.abs(result.campaignPrice - calculatedCampaignPrice)).toBeLessThanOrEqual(0.01)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain mathematical correctness: discountPercentage = (discountAmount / originalPrice) * 100', () => {
      fc.assert(
        fc.property(
          productArbitrary(),
          discountRulesArbitrary(),
          (product, discountRules) => {
            // Act
            const result = calculateDiscount.execute({ product, discountRules })

            // Assert - Verificar el cálculo del porcentaje
            if (result.discountAmount > 0) {
              const calculatedPercentage = Math.round((result.discountAmount / result.originalPrice) * 100)
              expect(result.discountPercentage).toBe(calculatedPercentage)
            } else {
              expect(result.discountPercentage).toBe(0)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should never produce negative prices or discounts', () => {
      fc.assert(
        fc.property(
          productArbitrary(),
          discountRulesArbitrary(),
          (product, discountRules) => {
            // Act
            const result = calculateDiscount.execute({ product, discountRules })

            // Assert - Todos los valores deben ser no negativos
            expect(result.originalPrice).toBeGreaterThanOrEqual(0)
            expect(result.campaignPrice).toBeGreaterThanOrEqual(0)
            expect(result.discountAmount).toBeGreaterThanOrEqual(0)
            expect(result.discountPercentage).toBeGreaterThanOrEqual(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should calculate batch discounts correctly for multiple products', () => {
      fc.assert(
        fc.property(
          fc.array(productArbitrary(), { minLength: 1, maxLength: 50 }),
          discountRulesArbitrary(),
          (products, discountRules) => {
            // Act
            const results = calculateDiscount.executeBatch(products, discountRules)

            // Assert
            expect(results).toHaveLength(products.length)

            // Verificar que cada resultado es correcto
            results.forEach((result, index) => {
              const product = products[index]
              expect(result.originalPrice).toBe(product.our_price)

              // Verificar corrección matemática
              const calculatedCampaignPrice = result.originalPrice - result.discountAmount
              expect(Math.abs(result.campaignPrice - calculatedCampaignPrice)).toBeLessThanOrEqual(0.01)
            })
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  /**
   * Tests adicionales para casos edge
   */
  describe('Edge Cases', () => {
    it('should reject products with invalid prices', () => {
      const invalidProduct: Product = {
        id: 'test-product',
        our_price: 0,
        category: 'portatiles'
      }

      const discountRules: DiscountRules = {
        global: { type: 'percentage', value: 20 }
      }

      expect(() => {
        calculateDiscount.execute({ product: invalidProduct, discountRules })
      }).toThrow(InvalidDiscountCalculationError)
    })

    it('should handle products without category correctly', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 10000, noNaN: true }),
          discountRuleArbitrary(),
          (price, globalRule) => {
            // Arrange - Producto sin categoría
            const product: Product = {
              id: 'test-product',
              our_price: price,
              category: undefined
            }

            const discountRules: DiscountRules = {
              global: globalRule,
              categories: { 'portatiles': { type: 'percentage', value: 50 } }
            }

            // Act
            const result = calculateDiscount.execute({ product, discountRules })

            // Assert - Debe aplicar la regla global (no la de categoría)
            expect(result.ruleApplied).toEqual(globalRule)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle percentage discount of 99% correctly', () => {
      const product: Product = {
        id: 'test-product',
        our_price: 1000,
        category: 'portatiles'
      }

      const discountRules: DiscountRules = {
        global: { type: 'percentage', value: 99 }
      }

      const result = calculateDiscount.execute({ product, discountRules })

      expect(result.discountPercentage).toBe(99)
      expect(result.discountAmount).toBeCloseTo(990, 2)
      expect(result.campaignPrice).toBeCloseTo(10, 2)
    })

    it('should handle fixed discount larger than product price', () => {
      const product: Product = {
        id: 'test-product',
        our_price: 50,
        category: 'perifericos'
      }

      const discountRules: DiscountRules = {
        global: { type: 'fixed', value: 100 } // Descuento mayor al precio
      }

      const result = calculateDiscount.execute({ product, discountRules })

      // El descuento debe limitarse al precio del producto
      expect(result.discountAmount).toBeLessThanOrEqual(product.our_price)
      expect(result.campaignPrice).toBeGreaterThanOrEqual(0)
    })
  })
})
