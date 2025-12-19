/**
 * Tests para Campaign Scheduler
 * 
 * Incluye tests unitarios y property-based tests para verificar:
 * - Inicialización correcta de cron jobs
 * - Ejecución de verificaciones de activación y desactivación
 * - Logging de todas las ejecuciones (Property 40)
 * - Manejo de errores
 */

import fc from 'fast-check'
import { CampaignScheduler, SchedulerOptions } from './campaign-scheduler'
import { CheckActivateCampaigns } from '../check-activate-campaigns/CheckActivateCampaigns'
import { CheckDeactivateCampaigns } from '../check-deactivate-campaigns/CheckDeactivateCampaigns'
import { logger } from '../shared/utils/logger'

// Mock del logger
jest.mock('../shared/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}))

// Mock de node-cron
jest.mock('node-cron', () => ({
  schedule: jest.fn((schedule, callback, options) => ({
    stop: jest.fn(),
    start: jest.fn()
  }))
}))

/**
 * Mock de CheckActivateCampaigns
 */
class MockCheckActivateCampaigns {
  private shouldFail = false
  private executionCount = 0

  async execute() {
    this.executionCount++
    
    if (this.shouldFail) {
      throw new Error('Simulated activation check failure')
    }

    return {
      campaignsDetected: 2,
      campaignsActivated: 2,
      campaignsFailed: 0,
      details: [
        {
          campaignId: 'campaign-1',
          campaignName: 'Test Campaign 1',
          success: true,
          productsAffected: 100
        },
        {
          campaignId: 'campaign-2',
          campaignName: 'Test Campaign 2',
          success: true,
          productsAffected: 50
        }
      ],
      processingTime: 1.5
    }
  }

  setFailure(shouldFail: boolean) {
    this.shouldFail = shouldFail
  }

  getExecutionCount() {
    return this.executionCount
  }

  reset() {
    this.executionCount = 0
    this.shouldFail = false
  }
}

/**
 * Mock de CheckDeactivateCampaigns
 */
class MockCheckDeactivateCampaigns {
  private shouldFail = false
  private executionCount = 0

  async execute() {
    this.executionCount++
    
    if (this.shouldFail) {
      throw new Error('Simulated deactivation check failure')
    }

    return {
      campaignsDetected: 1,
      campaignsDeactivated: 1,
      campaignsFailed: 0,
      details: [
        {
          campaignId: 'campaign-3',
          campaignName: 'Test Campaign 3',
          success: true,
          productsRestored: 75
        }
      ],
      processingTime: 1.2
    }
  }

  setFailure(shouldFail: boolean) {
    this.shouldFail = shouldFail
  }

  getExecutionCount() {
    return this.executionCount
  }

  reset() {
    this.executionCount = 0
    this.shouldFail = false
  }
}

describe('CampaignScheduler', () => {
  let scheduler: CampaignScheduler
  let mockCheckActivate: MockCheckActivateCampaigns
  let mockCheckDeactivate: MockCheckDeactivateCampaigns

  beforeEach(() => {
    jest.clearAllMocks()
    mockCheckActivate = new MockCheckActivateCampaigns()
    mockCheckDeactivate = new MockCheckDeactivateCampaigns()
  })

  afterEach(() => {
    if (scheduler) {
      scheduler.stop()
    }
  })

  describe('Unit Tests', () => {
    describe('Inicialización', () => {
      it('debe crear el scheduler con configuración por defecto', () => {
        scheduler = new CampaignScheduler(
          mockCheckActivate as any,
          mockCheckDeactivate as any
        )

        const status = scheduler.getStatus()
        expect(status.activationSchedule).toBe('0 * * * *')
        expect(status.deactivationSchedule).toBe('0 * * * *')
        expect(status.timezone).toBe('Europe/Madrid')
        expect(status.isRunning).toBe(false)
      })

      it('debe crear el scheduler con configuración personalizada', () => {
        const options: SchedulerOptions = {
          activationSchedule: '*/30 * * * *',
          deactivationSchedule: '*/15 * * * *',
          timezone: 'America/New_York',
          runOnStart: false
        }

        scheduler = new CampaignScheduler(
          mockCheckActivate as any,
          mockCheckDeactivate as any,
          options
        )

        const status = scheduler.getStatus()
        expect(status.activationSchedule).toBe('*/30 * * * *')
        expect(status.deactivationSchedule).toBe('*/15 * * * *')
        expect(status.timezone).toBe('America/New_York')
      })
    })

    describe('start', () => {
      it('debe iniciar los cron jobs correctamente', () => {
        scheduler = new CampaignScheduler(
          mockCheckActivate as any,
          mockCheckDeactivate as any
        )

        scheduler.start()

        const status = scheduler.getStatus()
        expect(status.isRunning).toBe(true)
        expect(status.activationJobActive).toBe(true)
        expect(status.deactivationJobActive).toBe(true)

        // Verificar que se registró el inicio en logs
        expect(logger.info).toHaveBeenCalledWith(
          'Iniciando Campaign Scheduler',
          expect.objectContaining({
            activationSchedule: '0 * * * *',
            deactivationSchedule: '0 * * * *'
          })
        )
      })

      it('debe ejecutar verificaciones inmediatamente si runOnStart es true', (done) => {
        scheduler = new CampaignScheduler(
          mockCheckActivate as any,
          mockCheckDeactivate as any,
          { runOnStart: true }
        )

        scheduler.start()

        // Esperar a que se ejecuten las verificaciones
        setTimeout(() => {
          expect(mockCheckActivate.getExecutionCount()).toBeGreaterThan(0)
          expect(mockCheckDeactivate.getExecutionCount()).toBeGreaterThan(0)
          done()
        }, 1500)
      })
    })

    describe('stop', () => {
      it('debe detener los cron jobs correctamente', () => {
        scheduler = new CampaignScheduler(
          mockCheckActivate as any,
          mockCheckDeactivate as any
        )

        scheduler.start()
        scheduler.stop()

        const status = scheduler.getStatus()
        expect(status.isRunning).toBe(false)
        expect(status.activationJobActive).toBe(false)
        expect(status.deactivationJobActive).toBe(false)

        // Verificar que se registró la detención en logs
        expect(logger.info).toHaveBeenCalledWith('Deteniendo Campaign Scheduler')
      })
    })

    describe('triggerActivationCheck', () => {
      it('debe ejecutar verificación de activación manualmente', async () => {
        scheduler = new CampaignScheduler(
          mockCheckActivate as any,
          mockCheckDeactivate as any
        )

        await scheduler.triggerActivationCheck()

        expect(mockCheckActivate.getExecutionCount()).toBe(1)
      })

      it('debe registrar logs al ejecutar verificación manual', async () => {
        scheduler = new CampaignScheduler(
          mockCheckActivate as any,
          mockCheckDeactivate as any
        )

        await scheduler.triggerActivationCheck()

        // Verificar que se registró la ejecución
        expect(logger.info).toHaveBeenCalledWith(
          'Ejecución manual de verificación de activación solicitada'
        )
      })
    })

    describe('triggerDeactivationCheck', () => {
      it('debe ejecutar verificación de desactivación manualmente', async () => {
        scheduler = new CampaignScheduler(
          mockCheckActivate as any,
          mockCheckDeactivate as any
        )

        await scheduler.triggerDeactivationCheck()

        expect(mockCheckDeactivate.getExecutionCount()).toBe(1)
      })

      it('debe registrar logs al ejecutar verificación manual', async () => {
        scheduler = new CampaignScheduler(
          mockCheckActivate as any,
          mockCheckDeactivate as any
        )

        await scheduler.triggerDeactivationCheck()

        // Verificar que se registró la ejecución
        expect(logger.info).toHaveBeenCalledWith(
          'Ejecución manual de verificación de desactivación solicitada'
        )
      })
    })

    describe('Manejo de errores', () => {
      it('debe manejar errores en verificación de activación', async () => {
        mockCheckActivate.setFailure(true)

        scheduler = new CampaignScheduler(
          mockCheckActivate as any,
          mockCheckDeactivate as any
        )

        await scheduler.triggerActivationCheck()

        // Verificar que se registró el error
        expect(logger.error).toHaveBeenCalledWith(
          'Error en ejecución de cron job de activación',
          expect.objectContaining({
            result: 'error',
            error: 'Simulated activation check failure'
          })
        )
      })

      it('debe manejar errores en verificación de desactivación', async () => {
        mockCheckDeactivate.setFailure(true)

        scheduler = new CampaignScheduler(
          mockCheckActivate as any,
          mockCheckDeactivate as any
        )

        await scheduler.triggerDeactivationCheck()

        // Verificar que se registró el error
        expect(logger.error).toHaveBeenCalledWith(
          'Error en ejecución de cron job de desactivación',
          expect.objectContaining({
            result: 'error',
            error: 'Simulated deactivation check failure'
          })
        )
      })
    })
  })

  /**
   * Tests de Propiedades
   */
  describe('Property-Based Tests', () => {
    /**
     * Feature: campaign-manager-service, Property 40: Cron Execution Logging
     * Validates: Requirements 12.3
     * 
     * Para cualquier ejecución del cron job, debe registrarse un log con la fecha/hora,
     * campañas procesadas y resultado de la operación.
     */
    describe('Property 40: Cron Execution Logging', () => {
      it('should log all activation check executions with complete details', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.integer({ min: 1, max: 10 }), // Número de ejecuciones
            async (numExecutions) => {
              // Arrange
              jest.clearAllMocks()
              mockCheckActivate.reset()
              
              scheduler = new CampaignScheduler(
                mockCheckActivate as any,
                mockCheckDeactivate as any
              )

              // Act - Ejecutar múltiples veces
              for (let i = 0; i < numExecutions; i++) {
                await scheduler.triggerActivationCheck()
              }

              // Assert - Verificar que se registraron logs para cada ejecución
              expect(mockCheckActivate.getExecutionCount()).toBe(numExecutions)

              // Verificar que se registró el inicio de cada ejecución
              const startLogs = (logger.info as jest.Mock).mock.calls.filter(
                call => call[0] === 'Iniciando ejecución de cron job de activación'
              )
              expect(startLogs.length).toBe(numExecutions)

              // Verificar que cada log de inicio tiene los campos requeridos
              startLogs.forEach(call => {
                const logData = call[1]
                expect(logData).toHaveProperty('executionId')
                expect(logData).toHaveProperty('timestamp')
                expect(logData).toHaveProperty('schedule')
                expect(logData.executionId).toMatch(/^cron-\d+-[a-z0-9]+$/)
              })

              // Verificar que se registró el resultado de cada ejecución
              const completeLogs = (logger.info as jest.Mock).mock.calls.filter(
                call => call[0] === 'Ejecución de cron job de activación completada'
              )
              expect(completeLogs.length).toBe(numExecutions)

              // Verificar que cada log de resultado tiene los campos requeridos
              completeLogs.forEach(call => {
                const logData = call[1]
                expect(logData).toHaveProperty('executionId')
                expect(logData).toHaveProperty('result')
                expect(logData).toHaveProperty('campaignsDetected')
                expect(logData).toHaveProperty('campaignsActivated')
                expect(logData).toHaveProperty('campaignsFailed')
                expect(logData).toHaveProperty('executionTime')
                expect(logData).toHaveProperty('timestamp')
                expect(logData.result).toBe('success')
                // El tiempo de ejecución puede ser 0 si es muy rápido
                expect(logData.executionTime).toBeGreaterThanOrEqual(0)
              })
            }
          ),
          { numRuns: 50 }
        )
      })

      it('should log all deactivation check executions with complete details', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.integer({ min: 1, max: 10 }), // Número de ejecuciones
            async (numExecutions) => {
              // Arrange
              jest.clearAllMocks()
              mockCheckDeactivate.reset()
              
              scheduler = new CampaignScheduler(
                mockCheckActivate as any,
                mockCheckDeactivate as any
              )

              // Act - Ejecutar múltiples veces
              for (let i = 0; i < numExecutions; i++) {
                await scheduler.triggerDeactivationCheck()
              }

              // Assert - Verificar que se registraron logs para cada ejecución
              expect(mockCheckDeactivate.getExecutionCount()).toBe(numExecutions)

              // Verificar que se registró el inicio de cada ejecución
              const startLogs = (logger.info as jest.Mock).mock.calls.filter(
                call => call[0] === 'Iniciando ejecución de cron job de desactivación'
              )
              expect(startLogs.length).toBe(numExecutions)

              // Verificar que cada log de inicio tiene los campos requeridos
              startLogs.forEach(call => {
                const logData = call[1]
                expect(logData).toHaveProperty('executionId')
                expect(logData).toHaveProperty('timestamp')
                expect(logData).toHaveProperty('schedule')
                expect(logData.executionId).toMatch(/^cron-\d+-[a-z0-9]+$/)
              })

              // Verificar que se registró el resultado de cada ejecución
              const completeLogs = (logger.info as jest.Mock).mock.calls.filter(
                call => call[0] === 'Ejecución de cron job de desactivación completada'
              )
              expect(completeLogs.length).toBe(numExecutions)

              // Verificar que cada log de resultado tiene los campos requeridos
              completeLogs.forEach(call => {
                const logData = call[1]
                expect(logData).toHaveProperty('executionId')
                expect(logData).toHaveProperty('result')
                expect(logData).toHaveProperty('campaignsDetected')
                expect(logData).toHaveProperty('campaignsDeactivated')
                expect(logData).toHaveProperty('campaignsFailed')
                expect(logData).toHaveProperty('executionTime')
                expect(logData).toHaveProperty('timestamp')
                expect(logData.result).toBe('success')
                // El tiempo de ejecución puede ser 0 si es muy rápido
                expect(logData.executionTime).toBeGreaterThanOrEqual(0)
              })
            }
          ),
          { numRuns: 50 }
        )
      })

      it('should log error details when cron job execution fails', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.integer({ min: 1, max: 5 }), // Número de ejecuciones fallidas
            async (numExecutions) => {
              // Arrange
              jest.clearAllMocks()
              mockCheckActivate.reset()
              mockCheckActivate.setFailure(true) // Forzar fallos
              
              scheduler = new CampaignScheduler(
                mockCheckActivate as any,
                mockCheckDeactivate as any
              )

              // Act - Ejecutar múltiples veces con fallos
              for (let i = 0; i < numExecutions; i++) {
                await scheduler.triggerActivationCheck()
              }

              // Assert - Verificar que se registraron logs de error
              const errorLogs = (logger.error as jest.Mock).mock.calls.filter(
                call => call[0] === 'Error en ejecución de cron job de activación'
              )
              expect(errorLogs.length).toBe(numExecutions)

              // Verificar que cada log de error tiene los campos requeridos
              errorLogs.forEach(call => {
                const logData = call[1]
                expect(logData).toHaveProperty('executionId')
                expect(logData).toHaveProperty('result')
                expect(logData).toHaveProperty('error')
                expect(logData).toHaveProperty('stack')
                expect(logData).toHaveProperty('executionTime')
                expect(logData).toHaveProperty('timestamp')
                expect(logData.result).toBe('error')
                expect(logData.error).toBe('Simulated activation check failure')
                // El tiempo de ejecución puede ser 0 si es muy rápido
                expect(logData.executionTime).toBeGreaterThanOrEqual(0)
              })
            }
          ),
          { numRuns: 30 }
        )
      })

      it('should generate unique execution IDs for all cron job runs', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.integer({ min: 5, max: 20 }), // Número de ejecuciones
            async (numExecutions) => {
              // Arrange
              jest.clearAllMocks()
              mockCheckActivate.reset()
              
              scheduler = new CampaignScheduler(
                mockCheckActivate as any,
                mockCheckDeactivate as any
              )

              // Act - Ejecutar múltiples veces
              for (let i = 0; i < numExecutions; i++) {
                await scheduler.triggerActivationCheck()
              }

              // Assert - Recolectar todos los execution IDs únicos de los logs de completado
              const completeLogs = (logger.info as jest.Mock).mock.calls.filter(
                call => call[0] === 'Ejecución de cron job de activación completada'
              )
              const executionIds = completeLogs
                .filter(call => call[1]?.executionId)
                .map(call => call[1].executionId)

              // Verificar que hay un ID por cada ejecución
              expect(executionIds.length).toBe(numExecutions)

              // Verificar que todos los IDs son únicos
              const uniqueIds = new Set(executionIds)
              expect(uniqueIds.size).toBe(numExecutions)

              // Verificar que todos los IDs tienen el formato correcto
              executionIds.forEach(id => {
                expect(id).toMatch(/^cron-\d+-[a-z0-9]+$/)
              })
            }
          ),
          { numRuns: 30 }
        )
      })

      it('should include processing time in all execution logs', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.integer({ min: 1, max: 10 }),
            async (numExecutions) => {
              // Arrange
              jest.clearAllMocks()
              mockCheckActivate.reset()
              
              scheduler = new CampaignScheduler(
                mockCheckActivate as any,
                mockCheckDeactivate as any
              )

              // Act
              for (let i = 0; i < numExecutions; i++) {
                await scheduler.triggerActivationCheck()
              }

              // Assert - Verificar que todos los logs de resultado tienen executionTime
              const completeLogs = (logger.info as jest.Mock).mock.calls.filter(
                call => call[0] === 'Ejecución de cron job de activación completada'
              )

              completeLogs.forEach(call => {
                const logData = call[1]
                expect(logData.executionTime).toBeDefined()
                expect(typeof logData.executionTime).toBe('number')
                // El tiempo de ejecución puede ser 0 si es muy rápido
                expect(logData.executionTime).toBeGreaterThanOrEqual(0)
              })
            }
          ),
          { numRuns: 30 }
        )
      })
    })
  })
})
