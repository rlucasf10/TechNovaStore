/**
 * Property-Based Tests para validación de FrontendConfig
 * 
 * Implementa tests basados en propiedades para validar la estructura
 * de la configuración de frontend de campañas.
 * 
 * **Feature: campaign-manager-service, Property 32: Frontend Config Structure**
 * **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
 */

import fc from 'fast-check'
import { CampaignValidator } from './validators'
import { FrontendConfig, PromoBannerConfig, HeroConfig, DealsSectionConfig } from '../types'

/**
 * Generadores (Arbitraries) para fast-check
 */

/**
 * Genera un mensaje de banner válido con icono y texto
 */
const bannerMessageArbitrary = () => {
  return fc.record({
    icon: fc.stringOf(fc.constantFrom(...'🔥⚡💥🎉🎁✨🌟💰🛒📦'), { minLength: 1, maxLength: 2 }),
    text: fc.string({ minLength: 3, maxLength: 100 })
  })
}

/**
 * Genera configuración de PromoBanner válida
 * Requisito 8.2: Configuración del banner promocional con mensajes e iconos
 */
const validPromoBannerArbitrary = (): fc.Arbitrary<PromoBannerConfig> => {
  return fc.record({
    messages: fc.array(bannerMessageArbitrary(), { minLength: 1, maxLength: 5 }),
    backgroundColor: fc.option(fc.hexaString({ minLength: 6, maxLength: 6 }).map(s => `#${s}`), { nil: undefined })
  })
}

/**
 * Genera configuración de Hero válida
 * Requisito 8.3: Configuración del hero section con título, subtítulo y CTA
 */
const validHeroArbitrary = (): fc.Arbitrary<HeroConfig> => {
  return fc.record({
    title: fc.string({ minLength: 3, maxLength: 100 }),
    subtitle: fc.string({ minLength: 3, maxLength: 200 }),
    ctaText: fc.string({ minLength: 3, maxLength: 50 }),
    backgroundImage: fc.option(fc.webUrl(), { nil: undefined }),
    badge: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined })
  })
}

/**
 * Genera configuración de DealsSection válida
 * Requisito 8.4: Configuración de la sección de ofertas con título, subtítulo y badge
 */
const validDealsSectionArbitrary = (): fc.Arbitrary<DealsSectionConfig> => {
  return fc.record({
    title: fc.string({ minLength: 3, maxLength: 100 }),
    subtitle: fc.string({ minLength: 3, maxLength: 200 }),
    badge: fc.string({ minLength: 1, maxLength: 30 }),
    backgroundColor: fc.option(fc.hexaString({ minLength: 6, maxLength: 6 }).map(s => `#${s}`), { nil: undefined })
  })
}

/**
 * Genera configuración de frontend completa y válida
 */
const validFrontendConfigArbitrary = (): fc.Arbitrary<FrontendConfig> => {
  return fc.record({
    promoBanner: validPromoBannerArbitrary(),
    hero: validHeroArbitrary(),
    dealsSection: validDealsSectionArbitrary(),
    categories: fc.option(fc.array(fc.string({ minLength: 2, maxLength: 30 }), { minLength: 1, maxLength: 10 }), { nil: undefined })
  })
}

/**
 * Genera configuración de frontend con promoBanner inválido o faltante
 */
const invalidPromoBannerConfigArbitrary = (): fc.Arbitrary<Partial<FrontendConfig>> => {
  return fc.oneof(
    // Sin promoBanner
    fc.record({
      hero: validHeroArbitrary(),
      dealsSection: validDealsSectionArbitrary()
    }),
    // Con promoBanner sin mensajes
    fc.record({
      promoBanner: fc.constant({ messages: [] } as PromoBannerConfig),
      hero: validHeroArbitrary(),
      dealsSection: validDealsSectionArbitrary()
    }),
    // Con promoBanner con mensaje sin icono
    fc.record({
      promoBanner: fc.constant({ messages: [{ icon: '', text: 'Texto válido' }] } as PromoBannerConfig),
      hero: validHeroArbitrary(),
      dealsSection: validDealsSectionArbitrary()
    }),
    // Con promoBanner con mensaje sin texto
    fc.record({
      promoBanner: fc.constant({ messages: [{ icon: '🔥', text: '' }] } as PromoBannerConfig),
      hero: validHeroArbitrary(),
      dealsSection: validDealsSectionArbitrary()
    })
  )
}

/**
 * Genera configuración de frontend con hero inválido o faltante
 */
const invalidHeroConfigArbitrary = (): fc.Arbitrary<Partial<FrontendConfig>> => {
  return fc.oneof(
    // Sin hero
    fc.record({
      promoBanner: validPromoBannerArbitrary(),
      dealsSection: validDealsSectionArbitrary()
    }),
    // Con hero sin título
    fc.record({
      promoBanner: validPromoBannerArbitrary(),
      hero: fc.constant({ title: '', subtitle: 'Subtítulo', ctaText: 'CTA' } as HeroConfig),
      dealsSection: validDealsSectionArbitrary()
    }),
    // Con hero sin subtítulo
    fc.record({
      promoBanner: validPromoBannerArbitrary(),
      hero: fc.constant({ title: 'Título', subtitle: '', ctaText: 'CTA' } as HeroConfig),
      dealsSection: validDealsSectionArbitrary()
    }),
    // Con hero sin ctaText
    fc.record({
      promoBanner: validPromoBannerArbitrary(),
      hero: fc.constant({ title: 'Título', subtitle: 'Subtítulo', ctaText: '' } as HeroConfig),
      dealsSection: validDealsSectionArbitrary()
    })
  )
}

/**
 * Genera configuración de frontend con dealsSection inválido o faltante
 */
const invalidDealsSectionConfigArbitrary = (): fc.Arbitrary<Partial<FrontendConfig>> => {
  return fc.oneof(
    // Sin dealsSection
    fc.record({
      promoBanner: validPromoBannerArbitrary(),
      hero: validHeroArbitrary()
    }),
    // Con dealsSection sin título
    fc.record({
      promoBanner: validPromoBannerArbitrary(),
      hero: validHeroArbitrary(),
      dealsSection: fc.constant({ title: '', subtitle: 'Subtítulo', badge: 'BADGE' } as DealsSectionConfig)
    }),
    // Con dealsSection sin subtítulo
    fc.record({
      promoBanner: validPromoBannerArbitrary(),
      hero: validHeroArbitrary(),
      dealsSection: fc.constant({ title: 'Título', subtitle: '', badge: 'BADGE' } as DealsSectionConfig)
    }),
    // Con dealsSection sin badge
    fc.record({
      promoBanner: validPromoBannerArbitrary(),
      hero: validHeroArbitrary(),
      dealsSection: fc.constant({ title: 'Título', subtitle: 'Subtítulo', badge: '' } as DealsSectionConfig)
    })
  )
}

/**
 * Tests de Propiedades para FrontendConfig
 */
describe('FrontendConfig Validation - Property-Based Tests', () => {
  let validator: CampaignValidator

  beforeEach(() => {
    validator = new CampaignValidator()
  })

  /**
   * Feature: campaign-manager-service, Property 32: Frontend Config Structure
   * Validates: Requirements 8.1, 8.2, 8.3, 8.4
   * 
   * Para cualquier campaña creada, el frontend_config debe contener los campos
   * promoBanner, hero y dealsSection con sus subcampos requeridos.
   */
  describe('Property 32: Frontend Config Structure', () => {
    /**
     * Test principal: Configuraciones válidas deben pasar la validación
     * 
     * Para cualquier FrontendConfig con promoBanner (con mensajes válidos),
     * hero (con título, subtítulo y ctaText) y dealsSection (con título, subtítulo y badge),
     * la validación debe ser exitosa.
     */
    it('should accept valid frontend configs with all required fields', () => {
      fc.assert(
        fc.property(
          validFrontendConfigArbitrary(),
          (config) => {
            // Ejecutar validación
            const result = validator.validateFrontendConfig(config)

            // La validación debe ser exitosa
            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)

            // Verificar que la estructura contiene todos los campos requeridos
            expect(config.promoBanner).toBeDefined()
            expect(config.promoBanner.messages).toBeDefined()
            expect(config.promoBanner.messages.length).toBeGreaterThan(0)
            
            expect(config.hero).toBeDefined()
            expect(config.hero.title).toBeDefined()
            expect(config.hero.subtitle).toBeDefined()
            expect(config.hero.ctaText).toBeDefined()
            
            expect(config.dealsSection).toBeDefined()
            expect(config.dealsSection.title).toBeDefined()
            expect(config.dealsSection.subtitle).toBeDefined()
            expect(config.dealsSection.badge).toBeDefined()
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Requisito 8.1: El frontend_config debe incluir la configuración del banner promocional
     * 
     * Para cualquier FrontendConfig sin promoBanner o con promoBanner inválido,
     * la validación debe fallar.
     */
    it('should reject configs without valid promoBanner (Requirement 8.1)', () => {
      fc.assert(
        fc.property(
          invalidPromoBannerConfigArbitrary(),
          (config) => {
            // Ejecutar validación
            const result = validator.validateFrontendConfig(config as FrontendConfig)

            // La validación debe fallar
            expect(result.isValid).toBe(false)
            expect(result.errors.length).toBeGreaterThan(0)
            
            // Debe haber al menos un error relacionado con promoBanner
            const hasPromoBannerError = result.errors.some(
              error => error.toLowerCase().includes('banner') || 
                       error.toLowerCase().includes('mensaje') ||
                       error.toLowerCase().includes('icono') ||
                       error.toLowerCase().includes('texto')
            )
            expect(hasPromoBannerError).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Requisito 8.2: El frontend_config debe incluir la configuración del hero section
     * 
     * Para cualquier FrontendConfig sin hero o con hero inválido,
     * la validación debe fallar.
     */
    it('should reject configs without valid hero section (Requirement 8.2)', () => {
      fc.assert(
        fc.property(
          invalidHeroConfigArbitrary(),
          (config) => {
            // Ejecutar validación
            const result = validator.validateFrontendConfig(config as FrontendConfig)

            // La validación debe fallar
            expect(result.isValid).toBe(false)
            expect(result.errors.length).toBeGreaterThan(0)
            
            // Debe haber al menos un error relacionado con hero
            const hasHeroError = result.errors.some(
              error => error.toLowerCase().includes('hero') || 
                       error.toLowerCase().includes('título') ||
                       error.toLowerCase().includes('subtítulo') ||
                       error.toLowerCase().includes('cta')
            )
            expect(hasHeroError).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Requisito 8.3: El frontend_config debe incluir la configuración de la sección de ofertas
     * 
     * Para cualquier FrontendConfig sin dealsSection o con dealsSection inválido,
     * la validación debe fallar.
     */
    it('should reject configs without valid dealsSection (Requirement 8.3)', () => {
      fc.assert(
        fc.property(
          invalidDealsSectionConfigArbitrary(),
          (config) => {
            // Ejecutar validación
            const result = validator.validateFrontendConfig(config as FrontendConfig)

            // La validación debe fallar
            expect(result.isValid).toBe(false)
            expect(result.errors.length).toBeGreaterThan(0)
            
            // Debe haber al menos un error relacionado con dealsSection
            const hasDealsSectionError = result.errors.some(
              error => error.toLowerCase().includes('ofertas') || 
                       error.toLowerCase().includes('título') ||
                       error.toLowerCase().includes('subtítulo') ||
                       error.toLowerCase().includes('badge')
            )
            expect(hasDealsSectionError).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Requisito 8.4: El frontend_config debe ser un JSON válido
     * 
     * Para cualquier FrontendConfig válido, debe poder serializarse y
     * deserializarse como JSON sin pérdida de datos.
     */
    it('should ensure frontend config is valid JSON (Requirement 8.4)', () => {
      fc.assert(
        fc.property(
          validFrontendConfigArbitrary(),
          (config) => {
            // Serializar a JSON
            const jsonString = JSON.stringify(config)
            
            // Deserializar de JSON
            const parsed = JSON.parse(jsonString) as FrontendConfig

            // Verificar que la estructura se preserva
            expect(parsed.promoBanner).toBeDefined()
            expect(parsed.promoBanner.messages).toEqual(config.promoBanner.messages)
            
            expect(parsed.hero).toBeDefined()
            expect(parsed.hero.title).toBe(config.hero.title)
            expect(parsed.hero.subtitle).toBe(config.hero.subtitle)
            expect(parsed.hero.ctaText).toBe(config.hero.ctaText)
            
            expect(parsed.dealsSection).toBeDefined()
            expect(parsed.dealsSection.title).toBe(config.dealsSection.title)
            expect(parsed.dealsSection.subtitle).toBe(config.dealsSection.subtitle)
            expect(parsed.dealsSection.badge).toBe(config.dealsSection.badge)

            // Verificar que el JSON deserializado también pasa la validación
            const result = validator.validateFrontendConfig(parsed)
            expect(result.isValid).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test complementario: Verificar que campos opcionales no afectan la validación
     * 
     * Para cualquier FrontendConfig válido con o sin campos opcionales,
     * la validación debe ser exitosa.
     */
    it('should accept configs with optional fields (backgroundColor, backgroundImage, badge, categories)', () => {
      fc.assert(
        fc.property(
          fc.record({
            promoBanner: fc.record({
              messages: fc.array(bannerMessageArbitrary(), { minLength: 1, maxLength: 3 }),
              backgroundColor: fc.option(fc.hexaString({ minLength: 6, maxLength: 6 }).map(s => `#${s}`), { nil: undefined })
            }),
            hero: fc.record({
              title: fc.string({ minLength: 3, maxLength: 50 }),
              subtitle: fc.string({ minLength: 3, maxLength: 100 }),
              ctaText: fc.string({ minLength: 3, maxLength: 30 }),
              backgroundImage: fc.option(fc.webUrl(), { nil: undefined }),
              badge: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined })
            }),
            dealsSection: fc.record({
              title: fc.string({ minLength: 3, maxLength: 50 }),
              subtitle: fc.string({ minLength: 3, maxLength: 100 }),
              badge: fc.string({ minLength: 1, maxLength: 20 }),
              backgroundColor: fc.option(fc.hexaString({ minLength: 6, maxLength: 6 }).map(s => `#${s}`), { nil: undefined })
            }),
            categories: fc.option(fc.array(fc.string({ minLength: 2, maxLength: 20 }), { minLength: 1, maxLength: 5 }), { nil: undefined })
          }),
          (config) => {
            // Ejecutar validación
            const result = validator.validateFrontendConfig(config as FrontendConfig)

            // La validación debe ser exitosa independientemente de los campos opcionales
            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Test complementario: Verificar que múltiples mensajes en promoBanner son válidos
     */
    it('should accept promoBanner with multiple valid messages', () => {
      fc.assert(
        fc.property(
          fc.array(bannerMessageArbitrary(), { minLength: 1, maxLength: 10 }),
          validHeroArbitrary(),
          validDealsSectionArbitrary(),
          (messages, hero, dealsSection) => {
            const config: FrontendConfig = {
              promoBanner: { messages },
              hero,
              dealsSection
            }

            // Ejecutar validación
            const result = validator.validateFrontendConfig(config)

            // La validación debe ser exitosa
            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
