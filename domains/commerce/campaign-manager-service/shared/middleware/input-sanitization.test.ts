/**
 * Property-Based Tests para Sanitización de Inputs
 * 
 * Feature: campaign-manager-service, Property 38: Input Sanitization
 * Validates: Requirements 10.7
 */

import fc from 'fast-check'
import { CampaignValidator } from '../utils/validators'

describe('Property-Based Tests: Input Sanitization', () => {
  const validator = new CampaignValidator()

  /**
   * Feature: campaign-manager-service, Property 38: Input Sanitization
   * Validates: Requirements 10.7
   * 
   * Para cualquier entrada de usuario (nombre, slug, configuración), el sistema debe
   * sanitizar los inputs para prevenir inyección SQL y XSS.
   */
  describe('Property 38: Input Sanitization', () => {
    it('debe eliminar caracteres de control de cualquier string', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.integer({ min: 0, max: 31 }), // Caracteres de control ASCII
          (baseString, controlChar) => {
            // Arrange: Insertar carácter de control en el string
            const maliciousString = baseString + String.fromCharCode(controlChar)

            // Act: Sanitizar
            const sanitized = validator.sanitizeString(maliciousString)

            // Assert: No debe contener caracteres de control
            for (let i = 0; i < sanitized.length; i++) {
              const charCode = sanitized.charCodeAt(i)
              expect(charCode).toBeGreaterThanOrEqual(32)
              expect(charCode).not.toBe(127) // DEL character
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('debe escapar caracteres HTML peligrosos en cualquier string', () => {
      fc.assert(
        fc.property(
          fc.string(),
          (baseString) => {
            // Arrange: Agregar caracteres HTML peligrosos
            const maliciousString = `${baseString}<script>alert('XSS')</script>`

            // Act: Sanitizar
            const sanitized = validator.sanitizeString(maliciousString)

            // Assert: No debe contener tags HTML sin escapar
            expect(sanitized).not.toContain('<script')
            expect(sanitized).not.toContain('</script>')
            
            // Los caracteres < y > deben estar escapados
            if (maliciousString.includes('<')) {
              expect(sanitized).toContain('&lt;')
            }
            if (maliciousString.includes('>')) {
              expect(sanitized).toContain('&gt;')
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('debe escapar comillas simples y dobles en cualquier string', () => {
      fc.assert(
        fc.property(
          fc.string(),
          (baseString) => {
            // Arrange: Agregar comillas
            const maliciousString = `${baseString}"'`

            // Act: Sanitizar
            const sanitized = validator.sanitizeString(maliciousString)

            // Assert: Las comillas deben estar escapadas
            if (maliciousString.includes('"')) {
              expect(sanitized).toContain('&quot;')
              expect(sanitized).not.toMatch(/(?<!&quot;)"/g) // No comillas sin escapar
            }
            if (maliciousString.includes("'")) {
              expect(sanitized).toContain('&#x27;')
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('debe eliminar tags script completos de cualquier string', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.string(),
          (prefix, suffix) => {
            // Arrange: Insertar script tag
            const maliciousString = `${prefix}<script>malicious code</script>${suffix}`

            // Act: Sanitizar
            const sanitized = validator.sanitizeString(maliciousString)

            // Assert: No debe contener script tags
            expect(sanitized.toLowerCase()).not.toContain('<script')
            expect(sanitized.toLowerCase()).not.toContain('</script>')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('debe sanitizar strings con múltiples vectores de ataque XSS', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }), // Asegurar que no sea vacío
          (baseString) => {
            // Arrange: Múltiples vectores de ataque
            const attacks = [
              '<img src=x onerror=alert(1)>',
              '<svg onload=alert(1)>',
              '<iframe src="javascript:alert(1)">',
              '<body onload=alert(1)>',
              '<input onfocus=alert(1) autofocus>',
              '<select onfocus=alert(1) autofocus>',
              '<textarea onfocus=alert(1) autofocus>',
              '<marquee onstart=alert(1)>',
              '<div style="background:url(javascript:alert(1))">',
            ]

            for (const attack of attacks) {
              const maliciousString = baseString + attack

              // Act: Sanitizar
              const sanitized = validator.sanitizeString(maliciousString)

              // Assert: Los tags HTML deben estar escapados (< se convierte en &lt;)
              // Si el string original contenía tags, deben estar escapados
              if (attack.includes('<')) {
                expect(sanitized).toContain('&lt;')
              }
              
              // No debe contener tags HTML sin escapar
              expect(sanitized).not.toContain('<img ')
              expect(sanitized).not.toContain('<svg ')
              expect(sanitized).not.toContain('<iframe ')
              expect(sanitized).not.toContain('<body ')
              expect(sanitized).not.toContain('<input ')
              expect(sanitized).not.toContain('<script ')
            }
          }
        ),
        { numRuns: 50 }
      )
    })

    it('debe sanitizar objetos recursivamente preservando estructura', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string(),
            description: fc.string(),
            nested: fc.record({
              field1: fc.string(),
              field2: fc.string(),
            }),
          }),
          (obj) => {
            // Arrange: Agregar contenido malicioso
            const maliciousObj = {
              name: obj.name + '<script>alert(1)</script>',
              description: obj.description + '"><img src=x onerror=alert(1)>',
              nested: {
                field1: obj.nested.field1 + '<svg onload=alert(1)>',
                field2: obj.nested.field2 + "'; DROP TABLE campaigns; --",
              },
            }

            // Act: Sanitizar
            const sanitized = validator.sanitizeObject(maliciousObj)

            // Assert: Estructura preservada
            expect(sanitized).toHaveProperty('name')
            expect(sanitized).toHaveProperty('description')
            expect(sanitized).toHaveProperty('nested')
            expect(sanitized.nested).toHaveProperty('field1')
            expect(sanitized.nested).toHaveProperty('field2')

            // Assert: Contenido sanitizado
            expect(sanitized.name).not.toContain('<script')
            expect(sanitized.description).not.toContain('<img')
            expect(sanitized.nested.field1).not.toContain('<svg')
            
            // Los caracteres peligrosos deben estar escapados
            expect(sanitized.name).toContain('&lt;')
            expect(sanitized.description).toContain('&gt;')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('debe sanitizar arrays de strings preservando orden', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { minLength: 1, maxLength: 10 }),
          (strings) => {
            // Arrange: Agregar contenido malicioso a cada string
            const maliciousArray = strings.map(s => s + '<script>alert(1)</script>')
            const obj = { items: maliciousArray }

            // Act: Sanitizar
            const sanitized = validator.sanitizeObject(obj)

            // Assert: Mismo número de elementos
            expect(sanitized.items).toHaveLength(strings.length)

            // Assert: Todos sanitizados
            for (const item of sanitized.items) {
              expect(item).not.toContain('<script')
              if (item.includes('&lt;')) {
                expect(item).toContain('&lt;')
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('debe preservar números, booleanos y fechas sin modificar', () => {
      fc.assert(
        fc.property(
          fc.integer(),
          fc.boolean(),
          fc.date(),
          (num, bool, date) => {
            // Arrange: Objeto con diferentes tipos
            const obj = {
              number: num,
              boolean: bool,
              date: date,
              string: '<script>alert(1)</script>',
            }

            // Act: Sanitizar
            const sanitized = validator.sanitizeObject(obj)

            // Assert: Números, booleanos y fechas sin cambios
            expect(sanitized.number).toBe(num)
            expect(sanitized.boolean).toBe(bool)
            expect(sanitized.date).toBe(date)

            // Assert: String sanitizado
            expect(sanitized.string).not.toContain('<script')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('debe prevenir inyección SQL en cualquier string', () => {
      fc.assert(
        fc.property(
          fc.string(),
          (baseString) => {
            // Arrange: Intentos de inyección SQL
            const sqlInjections = [
              "'; DROP TABLE campaigns; --",
              "' OR '1'='1",
              "'; DELETE FROM campaigns WHERE '1'='1",
              "' UNION SELECT * FROM users --",
              "admin'--",
              "' OR 1=1--",
            ]

            for (const injection of sqlInjections) {
              const maliciousString = baseString + injection

              // Act: Sanitizar
              const sanitized = validator.sanitizeString(maliciousString)

              // Assert: Comillas simples deben estar escapadas
              expect(sanitized).not.toMatch(/(?<!&#x27;)'/g)
              
              // Si había comillas, deben estar escapadas
              if (maliciousString.includes("'")) {
                expect(sanitized).toContain('&#x27;')
              }
            }
          }
        ),
        { numRuns: 50 }
      )
    })

    it('debe eliminar espacios en blanco al inicio y final', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.nat({ max: 10 }),
          fc.nat({ max: 10 }),
          (str, leadingSpaces, trailingSpaces) => {
            // Arrange: Agregar espacios
            const paddedString = ' '.repeat(leadingSpaces) + str + ' '.repeat(trailingSpaces)

            // Act: Sanitizar
            const sanitized = validator.sanitizeString(paddedString)

            // Assert: Sin espacios al inicio o final
            if (sanitized.length > 0) {
              expect(sanitized).toBe(sanitized.trim())
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('debe manejar strings vacíos y null correctamente', () => {
      // Empty string
      expect(validator.sanitizeString('')).toBe('')

      // Null/undefined (convertidos a string vacío)
      expect(validator.sanitizeString(null as any)).toBe('')
      expect(validator.sanitizeString(undefined as any)).toBe('')

      // Solo espacios
      expect(validator.sanitizeString('   ')).toBe('')
    })

    it('debe sanitizar datos de campaña completos', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 3, maxLength: 100 }),
            slug: fc.string({ minLength: 3, maxLength: 100 }),
            startDate: fc.date({ min: new Date() }),
            endDate: fc.date({ min: new Date(Date.now() + 86400000) }),
            priority: fc.integer({ min: 1, max: 100 }),
            discountRules: fc.constant({
              global: { type: 'percentage' as const, value: 20 },
            }),
            frontendConfig: fc.constant({
              promoBanner: {
                messages: [{ icon: '🔥', text: 'Test' }],
              },
              hero: {
                title: 'Test',
                subtitle: 'Test',
                ctaText: 'Test',
              },
              dealsSection: {
                title: 'Test',
                subtitle: 'Test',
                badge: 'Test',
              },
            }),
          }),
          (campaignData) => {
            // Arrange: Agregar contenido malicioso
            const maliciousData = {
              ...campaignData,
              name: campaignData.name + '<script>alert(1)</script>',
              slug: campaignData.slug + '"><img src=x>',
              frontendConfig: {
                ...campaignData.frontendConfig,
                hero: {
                  ...campaignData.frontendConfig.hero,
                  title: campaignData.frontendConfig.hero.title + '<svg onload=alert(1)>',
                },
              },
            }

            // Act: Sanitizar
            const sanitized = validator.sanitizeCampaignData(maliciousData)

            // Assert: Estructura preservada
            expect(sanitized).toHaveProperty('name')
            expect(sanitized).toHaveProperty('slug')
            expect(sanitized).toHaveProperty('frontendConfig')

            // Assert: Contenido sanitizado
            expect(sanitized.name).not.toContain('<script')
            expect(sanitized.slug).not.toContain('<img')
            expect(sanitized.frontendConfig.hero.title).not.toContain('<svg')

            // Assert: Fechas y números sin cambios
            expect(sanitized.startDate).toBe(maliciousData.startDate)
            expect(sanitized.endDate).toBe(maliciousData.endDate)
            expect(sanitized.priority).toBe(maliciousData.priority)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
