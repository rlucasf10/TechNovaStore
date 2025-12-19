/**
 * Property-Based Tests para Campaign Model
 * 
 * Estos tests verifican las propiedades de corrección del modelo Campaign
 * usando property-based testing con fast-check.
 */

import fc from 'fast-check'
import { Campaign } from './Campaign'
import {
  CreateCampaignData,
  DiscountRule,
  DiscountRules,
  FrontendConfig
} from '../types'

/**
 * Generadores (Arbitraries) para property-based testing
 */

/**
 * Genera una regla de descuento válida
 */
function discountRuleArbitrary(): fc.Arbitrary<DiscountRule> {
  return fc.oneof(
    // Descuento porcentual
    fc.record({
      type: fc.constant('percentage' as const),
      value: fc.integer({ min: 1, max: 99 }),
      maxDiscount: fc.option(fc.float({ min: 1, max: 1000, noNaN: true }), { nil: undefined }),
      minPurchase: fc.option(fc.float({ min: 1, max: 500, noNaN: true }), { nil: undefined })
    }),
    // Descuento fijo
    fc.record({
      type: fc.constant('fixed' as const),
      value: fc.float({ min: 1, max: 500, noNaN: true }),
      minPurchase: fc.option(fc.float({ min: 1, max: 500, noNaN: true }), { nil: undefined })
    })
  )
}

/**
 * Genera reglas de descuento válidas
 * Siempre incluye al menos una regla global para garantizar validez
 */
function discountRulesArbitrary(): fc.Arbitrary<DiscountRules> {
  // Siempre generar una regla global para garantizar que hay al menos una regla válida
  return fc.record({
    global: discountRuleArbitrary(), // Siempre presente para garantizar validez
    categories: fc.option(
      fc.dictionary(
        fc.string({ minLength: 3, maxLength: 50 }),
        discountRuleArbitrary(),
        { minKeys: 1 } // Al menos una categoría si se incluye
      ),
      { nil: undefined }
    ),
    products: fc.option(
      fc.dictionary(
        fc.uuid(),
        discountRuleArbitrary(),
        { minKeys: 1 } // Al menos un producto si se incluye
      ),
      { nil: undefined }
    )
  })
}

/**
 * Genera configuración de frontend válida
 * Simplificado para evitar problemas con filtros de fast-check
 */
function frontendConfigArbitrary(): fc.Arbitrary<FrontendConfig> {
  // Usar valores constantes válidos para evitar problemas de validación
  return fc.constant({
    promoBanner: {
      messages: [{ icon: '🔥', text: 'Oferta especial de prueba' }]
    },
    hero: {
      title: 'Titulo de campaña',
      subtitle: 'Subtitulo de campaña',
      ctaText: 'Ver ofertas'
    },
    dealsSection: {
      title: 'Ofertas especiales',
      subtitle: 'Las mejores ofertas',
      badge: 'OFERTA'
    }
  } as FrontendConfig)
}

/**
 * Genera datos válidos para crear una campaña
 */
function createCampaignDataArbitrary(): fc.Arbitrary<CreateCampaignData> {
  // Usar fechas bien en el futuro para evitar problemas de timing
  const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  
  // Usar generadores más simples que garantizan datos válidos
  return fc.record({
    // Generar nombres alfanuméricos válidos usando stringOf
    name: fc.stringOf(
      fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'),
      { minLength: 5, maxLength: 50 }
    ).map(s => 'Campaign ' + s),
    
    // Generar slugs válidos
    slug: fc.stringOf(
      fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'),
      { minLength: 5, maxLength: 30 }
    ).map(s => 'slug-' + s),
    
    // Fechas bien en el futuro para evitar problemas de timing
    startDate: fc.date({ min: oneDayFromNow, max: oneYearFromNow }),
    endDate: fc.date({ min: new Date(oneDayFromNow.getTime() + 86400000), max: oneYearFromNow }),
    priority: fc.integer({ min: 1, max: 100 }),
    discountRules: discountRulesArbitrary(),
    frontendConfig: frontendConfigArbitrary()
  }).filter(data => {
    // Asegurar que endDate sea después de startDate
    return data.endDate > data.startDate
  })
}

/**
 * Property-Based Tests
 */

describe('Campaign Model - Property-Based Tests', () => {
  /**
   * Feature: campaign-manager-service, Property 1: Campaign Creation Persistence
   * Validates: Requirements 1.1
   * 
   * Para cualquier campaña válida creada, todos los campos (nombre, fechas, prioridad, reglas)
   * deben persistir correctamente y ser recuperables.
   */
  it('Property 1: created campaigns should persist all fields correctly', () => {
    fc.assert(
      fc.property(
        createCampaignDataArbitrary(),
        (campaignData) => {
          // Arrange & Act
          const campaign = Campaign.create(campaignData)

          // Assert - Verificar que todos los campos se persisten correctamente
          expect(campaign.name).toBe(campaignData.name)
          expect(campaign.slug).toBe(campaignData.slug)
          expect(campaign.startDate).toEqual(campaignData.startDate)
          expect(campaign.endDate).toEqual(campaignData.endDate)
          expect(campaign.priority).toBe(campaignData.priority)
          expect(campaign.discountRules).toEqual(campaignData.discountRules)
          expect(campaign.frontendConfig).toEqual(campaignData.frontendConfig)
          
          // Verificar valores por defecto
          expect(campaign.isActive).toBe(false)
          expect(campaign.discountsApplied).toBe(false)
          expect(campaign.appliedAt).toBeUndefined()
          expect(campaign.deactivatedAt).toBeUndefined()
          expect(campaign.createdAt).toBeInstanceOf(Date)
          expect(campaign.updatedAt).toBeInstanceOf(Date)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 2: Valid campaign data should always pass validation
   * 
   * Para cualquier campaña generada con datos válidos, la validación debe ser exitosa.
   */
  it('Property 2: valid campaign data should always pass validation', () => {
    fc.assert(
      fc.property(
        createCampaignDataArbitrary(),
        (campaignData) => {
          // Act
          const result = Campaign.validate(campaignData)

          // Assert - Si falla, mostrar los errores para debug
          if (!result.isValid) {
            console.log('Validation errors:', result.errors)
            console.log('Campaign data:', JSON.stringify(campaignData, null, 2))
          }
          expect(result.isValid).toBe(true)
          expect(result.errors).toHaveLength(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 3: Campaign with start date >= end date should fail validation
   * 
   * Para cualquier campaña donde la fecha de inicio sea mayor o igual a la fecha de fin,
   * la validación debe fallar.
   */
  it('Property 3: campaign with start date >= end date should fail validation', () => {
    fc.assert(
      fc.property(
        createCampaignDataArbitrary(),
        (campaignData) => {
          // Arrange - Invertir las fechas para que startDate >= endDate
          const invalidData = {
            ...campaignData,
            startDate: campaignData.endDate,
            endDate: campaignData.startDate
          }

          // Act
          const result = Campaign.validate(invalidData)

          // Assert
          expect(result.isValid).toBe(false)
          expect(result.errors.some(e => e.includes('fecha de inicio debe ser anterior'))).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 4: Campaign with invalid percentage should fail validation
   * 
   * Para cualquier campaña con un porcentaje de descuento fuera del rango 1-99,
   * la validación debe fallar.
   */
  it('Property 4: campaign with invalid percentage should fail validation', () => {
    fc.assert(
      fc.property(
        createCampaignDataArbitrary(),
        fc.integer({ min: -100, max: 200 }).filter(n => n < 1 || n > 99),
        (campaignData, invalidPercentage) => {
          // Arrange - Crear regla con porcentaje inválido
          const invalidData: CreateCampaignData = {
            ...campaignData,
            discountRules: {
              global: {
                type: 'percentage',
                value: invalidPercentage
              }
            }
          }

          // Act
          const result = Campaign.validate(invalidData)

          // Assert
          expect(result.isValid).toBe(false)
          expect(result.errors.some(e => e.includes('debe estar entre 1 y 99'))).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 5: Campaign with negative fixed discount should fail validation
   * 
   * Para cualquier campaña con un descuento fijo negativo o cero,
   * la validación debe fallar.
   */
  it('Property 5: campaign with negative or zero fixed discount should fail validation', () => {
    fc.assert(
      fc.property(
        createCampaignDataArbitrary(),
        fc.float({ min: -1000, max: 0, noNaN: true }),
        (campaignData, invalidAmount) => {
          // Arrange - Crear regla con descuento fijo inválido
          const invalidData: CreateCampaignData = {
            ...campaignData,
            discountRules: {
              global: {
                type: 'fixed',
                value: invalidAmount
              }
            }
          }

          // Act
          const result = Campaign.validate(invalidData)

          // Assert
          expect(result.isValid).toBe(false)
          expect(result.errors.some(e => e.includes('debe ser un número positivo'))).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 6: Campaign activation/deactivation should update state correctly
   * 
   * Para cualquier campaña, activar y desactivar debe actualizar el estado correctamente.
   */
  it('Property 6: campaign activation/deactivation should update state correctly', () => {
    fc.assert(
      fc.property(
        createCampaignDataArbitrary(),
        (campaignData) => {
          // Arrange
          const campaign = Campaign.create(campaignData)
          const initialUpdatedAt = campaign.updatedAt

          // Act - Activar
          campaign.activate()

          // Assert - Verificar activación
          expect(campaign.isActive).toBe(true)
          expect(campaign.updatedAt.getTime()).toBeGreaterThanOrEqual(initialUpdatedAt.getTime())

          // Act - Desactivar
          const activatedUpdatedAt = campaign.updatedAt
          campaign.deactivate()

          // Assert - Verificar desactivación
          expect(campaign.isActive).toBe(false)
          expect(campaign.deactivatedAt).toBeInstanceOf(Date)
          expect(campaign.updatedAt.getTime()).toBeGreaterThanOrEqual(activatedUpdatedAt.getTime())
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 7: Campaign should correctly identify when it should activate
   * 
   * Para cualquier campaña, shouldActivate debe retornar true solo cuando:
   * - No está activa
   * - La fecha de inicio ha llegado
   * - La fecha de fin no ha pasado
   */
  it('Property 7: campaign should correctly identify when it should activate', () => {
    fc.assert(
      fc.property(
        createCampaignDataArbitrary(),
        (campaignData) => {
          // Arrange
          const campaign = Campaign.create(campaignData)
          
          // Test con fecha antes del inicio
          const beforeStart = new Date(campaign.startDate.getTime() - 1000)
          expect(campaign.shouldActivate(beforeStart)).toBe(false)
          
          // Test con fecha durante la campaña
          const duringCampaign = new Date(
            (campaign.startDate.getTime() + campaign.endDate.getTime()) / 2
          )
          expect(campaign.shouldActivate(duringCampaign)).toBe(true)
          
          // Test con fecha después del fin
          const afterEnd = new Date(campaign.endDate.getTime() + 1000)
          expect(campaign.shouldActivate(afterEnd)).toBe(false)
          
          // Test cuando ya está activa
          campaign.activate()
          expect(campaign.shouldActivate(duringCampaign)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 8: Campaign should correctly identify when it should deactivate
   * 
   * Para cualquier campaña activa, shouldDeactivate debe retornar true solo cuando
   * la fecha de fin ha pasado.
   */
  it('Property 8: campaign should correctly identify when it should deactivate', () => {
    fc.assert(
      fc.property(
        createCampaignDataArbitrary(),
        (campaignData) => {
          // Arrange
          const campaign = Campaign.create(campaignData)
          campaign.activate()
          
          // Test con fecha durante la campaña
          const duringCampaign = new Date(
            (campaign.startDate.getTime() + campaign.endDate.getTime()) / 2
          )
          expect(campaign.shouldDeactivate(duringCampaign)).toBe(false)
          
          // Test con fecha después del fin
          const afterEnd = new Date(campaign.endDate.getTime() + 1000)
          expect(campaign.shouldDeactivate(afterEnd)).toBe(true)
          
          // Test cuando no está activa
          campaign.deactivate()
          expect(campaign.shouldDeactivate(afterEnd)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 9: Campaign JSON serialization should be reversible
   * 
   * Para cualquier campaña, serializar a JSON y deserializar debe producir
   * una campaña equivalente.
   */
  it('Property 9: campaign JSON serialization should be reversible', () => {
    fc.assert(
      fc.property(
        createCampaignDataArbitrary(),
        (campaignData) => {
          // Arrange
          const original = Campaign.create(campaignData)
          original.id = 'test-id' // Simular ID de base de datos

          // Act
          const json = original.toJSON()
          const restored = Campaign.fromDatabase(json)

          // Assert
          expect(restored.id).toBe(original.id)
          expect(restored.name).toBe(original.name)
          expect(restored.slug).toBe(original.slug)
          expect(restored.startDate).toEqual(original.startDate)
          expect(restored.endDate).toEqual(original.endDate)
          expect(restored.priority).toBe(original.priority)
          expect(restored.isActive).toBe(original.isActive)
          expect(restored.discountRules).toEqual(original.discountRules)
          expect(restored.frontendConfig).toEqual(original.frontendConfig)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 10: Campaign with empty name should fail validation
   * 
   * Para cualquier campaña con nombre vacío o solo espacios,
   * la validación debe fallar.
   */
  it('Property 10: campaign with empty name should fail validation', () => {
    fc.assert(
      fc.property(
        createCampaignDataArbitrary(),
        fc.string().filter(s => s.trim().length === 0),
        (campaignData, emptyName) => {
          // Arrange
          const invalidData = {
            ...campaignData,
            name: emptyName
          }

          // Act
          const result = Campaign.validate(invalidData)

          // Assert
          expect(result.isValid).toBe(false)
          expect(result.errors.some(e => e.includes('nombre') && e.includes('requerido'))).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})
