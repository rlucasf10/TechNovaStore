/**
 * Property-Based Tests para DiscountCalculator
 * 
 * Implementa tests basados en propiedades para validar la corrección
 * matemática de los cálculos de descuento.
 */

import fc from 'fast-check'
import { DiscountCalculator, Product } from './discount-calculator'
import { DiscountRule, DiscountRules } from '../types'

describe('DiscountCalculator - Property-Based Tests', () => {
  let calculator: DiscountCalculator

  beforeEach(() => {
    calculator = new DiscountCalculator()
  })

  /**
   * Feature: campaign-manager-service, Property 12: Discount Rule Mathematical Validity
   * Validates: Requirements 2.7
   */
  describe('Property 12: Discount Rule Mathematical Validity', () => {
    it('should calculate discounts mathematically correctly for percentage discounts', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 10000, noNaN: true }), // price
          fc.integer({ min: 1, max: 99 }), // percentage
          (price, percentage) => {
            // Arrange
            const rule: DiscountRule = { type: 'percentage', value: percentage }

            // Act
            const result = calculator.calculateDiscount(price, rule)

            // Assert - Validar cálculos matemáticos
            const expectedDiscountAmount = price * (percentage / 100)
            const expectedCampaignPrice = price - expectedDiscountAmount
            const expectedPercentage = Math.round((expectedDiscountAmount / price) * 100)

            // Verificar que el monto del descuento sea correcto (con tolerancia de redondeo)
            const discountAmountDiff = Math.abs(result.amount - expectedDiscountAmount)
            expect(discountAmountDiff).toBeLessThan(0.02) // Tolerancia de 2 centavos por redondeo

            // Verificar que el porcentaje sea correcto
            expect(result.percentage).toBe(expectedPercentage)

            // Verificar que el descuento sea positivo
            expect(result.amount).toBeGreaterThan(0)
            expect(result.percentage).toBeGreaterThan(0)

            // Verificar que el descuento no exceda el precio
            expect(result.amount).toBeLessThanOrEqual(price)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should calculate discounts mathematically correctly for fixed discounts', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 10, max: 10000, noNaN: true }), // price
          fc.float({ min: 1, max: 500, noNaN: true }), // fixed discount
          (price, fixedDiscount) => {
            // Arrange
            const rule: DiscountRule = { type: 'fixed', value: fixedDiscount }

            // Act
            const result = calculator.calculateDiscount(price, rule)

            // Assert - Validar cálculos matemáticos
            const expectedDiscountAmount = Math.min(fixedDiscount, price)
            const expectedPercentage = Math.round((expectedDiscountAmount / price) * 100)

            // Verificar que el monto del descuento sea correcto
            const discountAmountDiff = Math.abs(result.amount - expectedDiscountAmount)
            expect(discountAmountDiff).toBeLessThan(0.02) // Tolerancia de 2 centavos

            // Verificar que el porcentaje sea correcto
            expect(result.percentage).toBe(expectedPercentage)

            // Verificar que el descuento no exceda el precio (con tolerancia de redondeo)
            expect(result.amount).toBeLessThanOrEqual(price + 0.01)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should respect maxDiscount cap for percentage discounts', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1000, max: 10000, noNaN: true }), // price (alto para que el cap sea relevante)
          fc.integer({ min: 30, max: 99 }), // percentage (alto para que el cap sea relevante)
          fc.float({ min: 50, max: 500, noNaN: true }), // maxDiscount
          (price, percentage, maxDiscount) => {
            // Arrange
            const rule: DiscountRule = { 
              type: 'percentage', 
              value: percentage,
              maxDiscount 
            }

            // Act
            const result = calculator.calculateDiscount(price, rule)

            // Assert - Validar que el descuento no exceda el máximo
            expect(result.amount).toBeLessThanOrEqual(maxDiscount + 0.01) // Tolerancia de redondeo

            // Verificar que el descuento sea positivo
            expect(result.amount).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should validate discount calculations using validateDiscountCalculation', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 10000, noNaN: true }), // price
          fc.integer({ min: 1, max: 99 }), // percentage
          (price, percentage) => {
            // Arrange
            const rule: DiscountRule = { type: 'percentage', value: percentage }

            // Act
            const result = calculator.calculateDiscount(price, rule)
            const campaignPrice = price - result.amount

            // Assert - Validar que los cálculos sean matemáticamente correctos
            const isValid = calculator.validateDiscountCalculation(
              price,
              campaignPrice,
              result.amount,
              result.percentage
            )

            expect(isValid).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should calculate product discount with correct mathematical relationships', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            our_price: fc.float({ min: 1, max: 10000, noNaN: true }),
            category: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined })
          }),
          fc.integer({ min: 1, max: 99 }),
          (product, percentage) => {
            // Arrange
            const rules: DiscountRules = {
              global: { type: 'percentage', value: percentage }
            }

            // Act
            const result = calculator.calculateProductDiscount(product, rules)

            // Assert - Validar relaciones matemáticas
            // 1. precio con descuento = precio original - descuento
            const expectedCampaignPrice = Math.round((result.originalPrice - result.discountAmount) * 100) / 100
            expect(Math.abs(result.campaignPrice - expectedCampaignPrice)).toBeLessThan(0.01)

            // 2. porcentaje = (descuento / precio original) * 100
            const expectedPercentage = Math.round((result.discountAmount / result.originalPrice) * 100)
            expect(result.discountPercentage).toBe(expectedPercentage)

            // 3. precio con descuento < precio original
            expect(result.campaignPrice).toBeLessThan(result.originalPrice)

            // 4. valores positivos
            expect(result.originalPrice).toBeGreaterThan(0)
            expect(result.campaignPrice).toBeGreaterThanOrEqual(0)
            expect(result.discountAmount).toBeGreaterThan(0)
            expect(result.discountPercentage).toBeGreaterThan(0)

            // 5. validar usando el método de validación
            const isValid = calculator.validateDiscountCalculation(
              result.originalPrice,
              result.campaignPrice,
              result.discountAmount,
              result.discountPercentage
            )
            expect(isValid).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain mathematical consistency across batch calculations', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 50 }),
              our_price: fc.float({ min: 1, max: 10000, noNaN: true }),
              category: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined })
            }),
            { minLength: 1, maxLength: 50 }
          ),
          fc.integer({ min: 1, max: 99 }),
          (products, percentage) => {
            // Arrange
            const rules: DiscountRules = {
              global: { type: 'percentage', value: percentage }
            }

            // Act
            const results = calculator.calculateBatchDiscounts(products, rules)

            // Assert - Validar que cada resultado sea matemáticamente correcto
            results.forEach(result => {
              const isValid = calculator.validateDiscountCalculation(
                result.originalPrice,
                result.campaignPrice,
                result.discountAmount,
                result.discountPercentage
              )
              expect(isValid).toBe(true)
            })

            // Validar estadísticas agregadas
            const stats = calculator.calculateDiscountStatistics(results)
            expect(stats.totalProducts).toBe(products.length)
            expect(stats.totalOriginalPrice).toBeGreaterThan(0)
            expect(stats.totalCampaignPrice).toBeGreaterThan(0)
            expect(stats.totalDiscountAmount).toBeGreaterThan(0)
            expect(stats.averageDiscountPercentage).toBeGreaterThan(0)
            expect(stats.averageDiscountPercentage).toBeLessThanOrEqual(100)

            // Validar relación: total original = total con descuento + total descuento
            const totalCheck = Math.abs(
              stats.totalOriginalPrice - (stats.totalCampaignPrice + stats.totalDiscountAmount)
            )
            expect(totalCheck).toBeLessThan(0.1) // Tolerancia por redondeos acumulados
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Feature: campaign-manager-service, Property 6: Percentage Discount Range Validation
   * Validates: Requirements 2.1
   */
  describe('Property 6: Percentage Discount Range Validation', () => {
    it('should accept percentage discounts between 1 and 99', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 10000, noNaN: true }), // price
          fc.integer({ min: 1, max: 99 }), // valid percentage
          (price, percentage) => {
            // Arrange
            const rule: DiscountRule = { type: 'percentage', value: percentage }

            // Act
            const result = calculator.calculateDiscount(price, rule)

            // Assert - El descuento debe calcularse correctamente
            expect(result.amount).toBeGreaterThan(0)
            expect(result.percentage).toBeGreaterThan(0)
            expect(result.percentage).toBeLessThanOrEqual(99)
            
            // El porcentaje calculado debe estar en el rango válido
            expect(result.percentage).toBeGreaterThanOrEqual(1)
            expect(result.percentage).toBeLessThanOrEqual(99)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should clamp percentage discounts outside valid range', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 10000, noNaN: true }), // price
          fc.oneof(
            fc.integer({ min: -100, max: 0 }), // invalid: <= 0
            fc.integer({ min: 100, max: 200 }) // invalid: >= 100
          ),
          (price, invalidPercentage) => {
            // Arrange
            const rule: DiscountRule = { type: 'percentage', value: invalidPercentage }

            // Act
            const result = calculator.calculateDiscount(price, rule)

            // Assert - El descuento debe estar clampeado al rango válido
            // Si el porcentaje es <= 0, se clampea a 1
            // Si el porcentaje es >= 100, se clampea a 99
            expect(result.percentage).toBeGreaterThanOrEqual(1)
            expect(result.percentage).toBeLessThanOrEqual(99)
            
            // El monto del descuento debe ser válido
            expect(result.amount).toBeGreaterThan(0)
            expect(result.amount).toBeLessThanOrEqual(price)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject percentage values outside 1-99 range in validation', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer({ min: -100, max: 0 }), // invalid: <= 0
            fc.integer({ min: 100, max: 200 }) // invalid: >= 100
          ),
          (invalidPercentage) => {
            // Arrange
            const rule: DiscountRule = { type: 'percentage', value: invalidPercentage }
            const rules: DiscountRules = { global: rule }

            // Act & Assert - El validador debe rechazar estos valores
            // Nota: Esta es una validación a nivel de negocio, no de cálculo
            // El calculador clampea, pero el validador debe rechazar
            const validator = require('./validators').campaignValidator
            const validation = validator.validateDiscountRules(rules)

            // Si el porcentaje está fuera del rango, la validación debe fallar
            if (invalidPercentage < 1 || invalidPercentage > 99) {
              expect(validation.isValid).toBe(false)
              expect(validation.errors.length).toBeGreaterThan(0)
              expect(validation.errors.some((e: string) => 
                e.includes('entre 1 y 99')
              )).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Feature: campaign-manager-service, Property 9: Product-Specific Discount Priority
   * Validates: Requirements 2.4
   */
  describe('Property 9: Product-Specific Discount Priority', () => {
    it('should prioritize product-specific discount over category and global', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            our_price: fc.float({ min: 10, max: 10000, noNaN: true }),
            category: fc.string({ minLength: 1, maxLength: 50 })
          }),
          fc.integer({ min: 10, max: 30 }), // product discount
          fc.integer({ min: 40, max: 60 }), // category discount (diferencia mínima de 10%)
          fc.integer({ min: 70, max: 90 }), // global discount (diferencia mínima de 10%)
          (product, productDiscount, categoryDiscount, globalDiscount) => {
            // Arrange - Definir las tres reglas con diferentes valores bien separados
            const rules: DiscountRules = {
              global: { type: 'percentage', value: globalDiscount },
              categories: {
                [product.category]: { type: 'percentage', value: categoryDiscount }
              },
              products: {
                [product.id]: { type: 'percentage', value: productDiscount }
              }
            }

            // Act
            const applicableRule = calculator.getApplicableRule(product, rules)
            const result = calculator.calculateProductDiscount(product, rules)

            // Assert - Debe aplicarse la regla específica del producto
            expect(applicableRule).not.toBeNull()
            expect(applicableRule?.type).toBe('percentage')
            expect(applicableRule?.value).toBe(productDiscount)
            
            // Verificar que ruleApplied también sea la correcta
            expect(result.ruleApplied).not.toBeNull()
            expect(result.ruleApplied?.value).toBe(productDiscount)
            
            // El descuento calculado debe corresponder a la regla del producto
            const expectedDiscount = product.our_price * (productDiscount / 100)
            const discountDiff = Math.abs(result.discountAmount - expectedDiscount)
            expect(discountDiff).toBeLessThan(0.02)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should prioritize category discount over global when no product-specific discount', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            our_price: fc.float({ min: 10, max: 10000, noNaN: true }),
            category: fc.string({ minLength: 1, maxLength: 50 })
          }),
          fc.integer({ min: 10, max: 40 }), // category discount
          fc.integer({ min: 60, max: 90 }), // global discount (diferencia mínima de 20%)
          (product, categoryDiscount, globalDiscount) => {
            // Arrange - Solo reglas de categoría y global (sin producto específico)
            const rules: DiscountRules = {
              global: { type: 'percentage', value: globalDiscount },
              categories: {
                [product.category]: { type: 'percentage', value: categoryDiscount }
              }
            }

            // Act
            const applicableRule = calculator.getApplicableRule(product, rules)
            const result = calculator.calculateProductDiscount(product, rules)

            // Assert - Debe aplicarse la regla de categoría
            expect(applicableRule).not.toBeNull()
            expect(applicableRule?.type).toBe('percentage')
            expect(applicableRule?.value).toBe(categoryDiscount)
            
            // Verificar que ruleApplied también sea la correcta
            expect(result.ruleApplied).not.toBeNull()
            expect(result.ruleApplied?.value).toBe(categoryDiscount)
            
            // El descuento calculado debe corresponder a la regla de categoría
            const expectedDiscount = product.our_price * (categoryDiscount / 100)
            const discountDiff = Math.abs(result.discountAmount - expectedDiscount)
            expect(discountDiff).toBeLessThan(0.02)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should apply global discount when no product or category discount exists', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            our_price: fc.float({ min: 1, max: 10000, noNaN: true }),
            category: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined })
          }),
          fc.integer({ min: 1, max: 99 }), // global discount
          (product, globalDiscount) => {
            // Arrange - Solo regla global
            const rules: DiscountRules = {
              global: { type: 'percentage', value: globalDiscount }
            }

            // Act
            const applicableRule = calculator.getApplicableRule(product, rules)
            const result = calculator.calculateProductDiscount(product, rules)

            // Assert - Debe aplicarse la regla global
            expect(applicableRule).not.toBeNull()
            expect(applicableRule?.type).toBe('percentage')
            expect(applicableRule?.value).toBe(globalDiscount)
            
            // El descuento calculado debe corresponder a la regla global
            const expectedDiscount = product.our_price * (globalDiscount / 100)
            const discountDiff = Math.abs(result.discountAmount - expectedDiscount)
            expect(discountDiff).toBeLessThan(0.02)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return null rule when no applicable discount exists', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            our_price: fc.float({ min: 1, max: 10000, noNaN: true }),
            category: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined })
          }),
          (product) => {
            // Arrange - Reglas vacías
            const rules: DiscountRules = {}

            // Act
            const applicableRule = calculator.getApplicableRule(product, rules)
            const result = calculator.calculateProductDiscount(product, rules)

            // Assert - No debe haber regla aplicable
            expect(applicableRule).toBeNull()
            expect(result.ruleApplied).toBeNull()
            expect(result.discountAmount).toBe(0)
            expect(result.discountPercentage).toBe(0)
            expect(result.campaignPrice).toBe(result.originalPrice)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Feature: campaign-manager-service, Property 11: Maximum Discount Cap
   * Validates: Requirements 2.6
   */
  describe('Property 11: Maximum Discount Cap', () => {
    it('should never exceed maxDiscount for percentage discounts', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1000, max: 10000, noNaN: true }), // high price
          fc.integer({ min: 50, max: 99 }), // high percentage
          fc.float({ min: 100, max: 1000, noNaN: true }), // maxDiscount
          (price, percentage, maxDiscount) => {
            // Arrange
            const rule: DiscountRule = { 
              type: 'percentage', 
              value: percentage,
              maxDiscount 
            }

            // Act
            const result = calculator.calculateDiscount(price, rule)

            // Assert - El descuento nunca debe exceder el máximo
            expect(result.amount).toBeLessThanOrEqual(maxDiscount + 0.01) // Tolerancia de redondeo
            
            // Si el descuento calculado sin cap sería mayor al máximo,
            // entonces el descuento debe ser exactamente el máximo
            const uncappedDiscount = price * (percentage / 100)
            if (uncappedDiscount > maxDiscount) {
              expect(Math.abs(result.amount - maxDiscount)).toBeLessThan(0.02)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should apply maxDiscount correctly using applyMaxDiscount method', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 10000, noNaN: true }), // discount amount
          fc.float({ min: 1, max: 5000, noNaN: true }), // max discount
          (discountAmount, maxDiscount) => {
            // Act
            const result = calculator.applyMaxDiscount(discountAmount, maxDiscount)

            // Assert - El resultado debe ser el mínimo entre ambos
            expect(result).toBeLessThanOrEqual(maxDiscount)
            expect(result).toBeLessThanOrEqual(discountAmount)
            expect(result).toBe(Math.min(discountAmount, maxDiscount))
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not apply cap when maxDiscount is undefined', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 10000, noNaN: true }), // price
          fc.integer({ min: 1, max: 99 }), // percentage
          (price, percentage) => {
            // Arrange - Sin maxDiscount
            const rule: DiscountRule = { 
              type: 'percentage', 
              value: percentage
            }

            // Act
            const result = calculator.calculateDiscount(price, rule)

            // Assert - El descuento debe ser el porcentaje completo sin cap
            const expectedDiscount = price * (percentage / 100)
            const discountDiff = Math.abs(result.amount - expectedDiscount)
            expect(discountDiff).toBeLessThan(0.02)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain mathematical validity when applying maxDiscount', () => {
      fc.assert(
        fc.property(
          // Usar enteros para evitar problemas de precisión de punto flotante
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            our_price: fc.integer({ min: 1000, max: 10000 }),
            category: fc.constantFrom('portatiles', 'componentes', 'perifericos', 'monitores')
          }),
          fc.integer({ min: 50, max: 99 }), // high percentage
          fc.integer({ min: 100, max: 500 }), // maxDiscount (entero para evitar problemas de precisión)
          (product, percentage, maxDiscount) => {
            // Arrange
            const rules: DiscountRules = {
              global: { 
                type: 'percentage', 
                value: percentage,
                maxDiscount 
              }
            }

            // Act
            const result = calculator.calculateProductDiscount(product, rules)

            // Assert - Validar que los cálculos sean matemáticamente correctos
            const isValid = calculator.validateDiscountCalculation(
              result.originalPrice,
              result.campaignPrice,
              result.discountAmount,
              result.discountPercentage
            )
            expect(isValid).toBe(true)
            
            // El descuento no debe exceder el máximo
            expect(result.discountAmount).toBeLessThanOrEqual(maxDiscount + 0.01)
            
            // El precio con descuento debe ser correcto
            const expectedCampaignPrice = result.originalPrice - result.discountAmount
            expect(Math.abs(result.campaignPrice - expectedCampaignPrice)).toBeLessThan(0.02)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle edge case where maxDiscount equals calculated discount', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 100, max: 10000, noNaN: true }), // price
          fc.integer({ min: 10, max: 50 }), // percentage
          (price, percentage) => {
            // Arrange - maxDiscount exactamente igual al descuento calculado
            const calculatedDiscount = price * (percentage / 100)
            const rule: DiscountRule = { 
              type: 'percentage', 
              value: percentage,
              maxDiscount: calculatedDiscount
            }

            // Act
            const result = calculator.calculateDiscount(price, rule)

            // Assert - El descuento debe ser exactamente el calculado (no afectado por el cap)
            expect(Math.abs(result.amount - calculatedDiscount)).toBeLessThan(0.02)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle very small maxDiscount values', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1000, max: 10000, noNaN: true }), // high price
          fc.integer({ min: 50, max: 99 }), // high percentage
          fc.float({ min: Math.fround(0.01), max: Math.fround(10), noNaN: true }), // very small maxDiscount (usando Math.fround)
          (price, percentage, maxDiscount) => {
            // Arrange
            const rule: DiscountRule = { 
              type: 'percentage', 
              value: percentage,
              maxDiscount 
            }

            // Act
            const result = calculator.calculateDiscount(price, rule)

            // Assert - El descuento debe estar limitado al máximo muy pequeño
            expect(result.amount).toBeLessThanOrEqual(maxDiscount + 0.01)
            expect(result.amount).toBeGreaterThan(0)
            
            // El precio con descuento debe ser casi igual al original
            const campaignPrice = price - result.amount
            expect(campaignPrice).toBeGreaterThan(price - maxDiscount - 0.02)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
