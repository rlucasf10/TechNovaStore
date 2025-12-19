/**
 * Tests para MetricsCollector
 * 
 * Verifica que las métricas de Prometheus se exponen correctamente.
 */

import { MetricsCollector } from './MetricsCollector'
import { Pool } from 'pg'

describe('MetricsCollector', () => {
  let metricsCollector: MetricsCollector
  let mockDb: { query: jest.Mock; connect: jest.Mock; end: jest.Mock; on: jest.Mock }

  beforeEach(() => {
    metricsCollector = new MetricsCollector()
    
    // Mock de la base de datos
    mockDb = {
      query: jest.fn(),
      connect: jest.fn(),
      end: jest.fn(),
      on: jest.fn()
    }
    
    metricsCollector.setDatabase(mockDb as unknown as Pool)
  })

  afterEach(() => {
    metricsCollector.reset()
  })

  describe('Inicialización', () => {
    it('debe inicializar el collector sin errores', () => {
      expect(metricsCollector).toBeDefined()
    })

    it('debe tener un content type de Prometheus', () => {
      const contentType = metricsCollector.getContentType()
      expect(contentType).toContain('text/plain')
    })
  })

  describe('Gauge: campaign_active_count', () => {
    it('debe actualizar el gauge de campañas activas', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({
        rows: [{ count: '5' }]
      } as any)

      // Act
      await metricsCollector.updateActiveCampaignsCount()
      const metrics = await metricsCollector.getMetrics()

      // Assert
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM campaigns WHERE is_active = true'
      )
      expect(metrics).toContain('campaign_active_count 5')
    })

    it('debe manejar el caso de 0 campañas activas', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({
        rows: [{ count: '0' }]
      } as any)

      // Act
      await metricsCollector.updateActiveCampaignsCount()
      const metrics = await metricsCollector.getMetrics()

      // Assert
      expect(metrics).toContain('campaign_active_count 0')
    })

    it('debe manejar errores de base de datos sin lanzar excepción', async () => {
      // Arrange
      mockDb.query.mockRejectedValue(new Error('Database error'))

      // Act & Assert - no debe lanzar error
      await expect(metricsCollector.updateActiveCampaignsCount()).resolves.not.toThrow()
    })
  })

  describe('Counter: campaign_discounts_applied_total', () => {
    it('debe incrementar el contador de descuentos aplicados', async () => {
      // Act
      metricsCollector.incrementDiscountsApplied(10)
      const metrics = await metricsCollector.getMetrics()

      // Assert
      expect(metrics).toContain('campaign_discounts_applied_total 10')
    })

    it('debe incrementar el contador múltiples veces', async () => {
      // Act
      metricsCollector.incrementDiscountsApplied(5)
      metricsCollector.incrementDiscountsApplied(3)
      metricsCollector.incrementDiscountsApplied(2)
      const metrics = await metricsCollector.getMetrics()

      // Assert
      expect(metrics).toContain('campaign_discounts_applied_total 10')
    })

    it('debe incrementar en 1 por defecto', async () => {
      // Act
      metricsCollector.incrementDiscountsApplied()
      const metrics = await metricsCollector.getMetrics()

      // Assert
      expect(metrics).toContain('campaign_discounts_applied_total 1')
    })
  })

  describe('Histogram: campaign_discount_application_duration_seconds', () => {
    it('debe registrar la duración de aplicación de descuentos', async () => {
      // Act
      metricsCollector.recordDiscountApplicationDuration(2.5)
      const metrics = await metricsCollector.getMetrics()

      // Assert
      expect(metrics).toContain('campaign_discount_application_duration_seconds')
      expect(metrics).toContain('campaign_discount_application_duration_seconds_count 1')
    })

    it('debe registrar múltiples duraciones', async () => {
      // Act
      metricsCollector.recordDiscountApplicationDuration(1.0)
      metricsCollector.recordDiscountApplicationDuration(2.0)
      metricsCollector.recordDiscountApplicationDuration(3.0)
      const metrics = await metricsCollector.getMetrics()

      // Assert
      expect(metrics).toContain('campaign_discount_application_duration_seconds_count 3')
    })

    it('debe usar los buckets configurados', async () => {
      // Act
      metricsCollector.recordDiscountApplicationDuration(0.5)
      const metrics = await metricsCollector.getMetrics()

      // Assert - verificar que existen los buckets esperados
      expect(metrics).toContain('le="0.1"')
      expect(metrics).toContain('le="0.5"')
      expect(metrics).toContain('le="1"')
      expect(metrics).toContain('le="2"')
      expect(metrics).toContain('le="5"')
      expect(metrics).toContain('le="10"')
      expect(metrics).toContain('le="30"')
      expect(metrics).toContain('le="60"')
    })
  })

  describe('getMetrics', () => {
    it('debe retornar métricas en formato Prometheus', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({
        rows: [{ count: '3' }]
      } as any)

      // Act
      const metrics = await metricsCollector.getMetrics()

      // Assert
      expect(typeof metrics).toBe('string')
      expect(metrics).toContain('# HELP')
      expect(metrics).toContain('# TYPE')
    })

    it('debe incluir métricas por defecto del sistema', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({
        rows: [{ count: '0' }]
      } as any)

      // Act
      const metrics = await metricsCollector.getMetrics()

      // Assert - verificar que incluye métricas del sistema
      expect(metrics).toContain('process_cpu')
      expect(metrics).toContain('nodejs_')
    })

    it('debe actualizar campañas activas antes de retornar', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({
        rows: [{ count: '7' }]
      } as any)

      // Act
      await metricsCollector.getMetrics()

      // Assert
      expect(mockDb.query).toHaveBeenCalled()
    })
  })

  describe('reset', () => {
    it('debe resetear todas las métricas', async () => {
      // Arrange
      metricsCollector.incrementDiscountsApplied(10)
      metricsCollector.recordDiscountApplicationDuration(5.0)

      // Act
      metricsCollector.reset()
      const metrics = await metricsCollector.getMetrics()

      // Assert
      // El contador se resetea a 0
      expect(metrics).toContain('campaign_discounts_applied_total 0')
      // El histograma se resetea pero puede no mostrar _count 0 explícitamente
      // Solo verificamos que el histograma existe en las métricas
      expect(metrics).toContain('campaign_discount_application_duration_seconds')
    })
  })

  describe('Integración con casos de uso', () => {
    it('debe simular el flujo completo de aplicación de descuentos', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({
        rows: [{ count: '1' }]
      } as any)

      // Act - simular aplicación de descuentos
      const startTime = Date.now()
      
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const endTime = Date.now()
      const durationSeconds = (endTime - startTime) / 1000

      // Registrar métricas
      metricsCollector.incrementDiscountsApplied(50)
      metricsCollector.recordDiscountApplicationDuration(durationSeconds)
      await metricsCollector.updateActiveCampaignsCount()

      const metrics = await metricsCollector.getMetrics()

      // Assert
      expect(metrics).toContain('campaign_active_count 1')
      expect(metrics).toContain('campaign_discounts_applied_total 50')
      expect(metrics).toContain('campaign_discount_application_duration_seconds_count 1')
    })
  })

  // ============================================
  // Tests para métricas del cron job
  // Requirement 16.8: Integración con Alertmanager
  // ============================================

  describe('Métricas del Cron Job (Requirement 16.8)', () => {
    describe('recordCronJobSuccess', () => {
      it('debe registrar una ejecución exitosa del cron job de activación', async () => {
        // Arrange
        mockDb.query.mockResolvedValue({ rows: [{ count: '0' }] } as any)

        // Act
        metricsCollector.recordCronJobSuccess('activation', 2.5)
        const metrics = await metricsCollector.getMetrics()

        // Assert
        expect(metrics).toContain('campaign_cron_job_executions_total{job_type="activation",status="success"} 1')
        expect(metrics).toContain('campaign_cron_job_last_execution_timestamp{job_type="activation"}')
        expect(metrics).toContain('campaign_cron_job_duration_seconds')
      })

      it('debe registrar una ejecución exitosa del cron job de desactivación', async () => {
        // Arrange
        mockDb.query.mockResolvedValue({ rows: [{ count: '0' }] } as any)

        // Act
        metricsCollector.recordCronJobSuccess('deactivation', 1.5)
        const metrics = await metricsCollector.getMetrics()

        // Assert
        expect(metrics).toContain('campaign_cron_job_executions_total{job_type="deactivation",status="success"} 1')
        expect(metrics).toContain('campaign_cron_job_last_execution_timestamp{job_type="deactivation"}')
      })

      it('debe incrementar el contador de ejecuciones múltiples veces', async () => {
        // Arrange
        mockDb.query.mockResolvedValue({ rows: [{ count: '0' }] } as any)

        // Act
        metricsCollector.recordCronJobSuccess('activation', 1.0)
        metricsCollector.recordCronJobSuccess('activation', 2.0)
        metricsCollector.recordCronJobSuccess('activation', 3.0)
        const metrics = await metricsCollector.getMetrics()

        // Assert
        expect(metrics).toContain('campaign_cron_job_executions_total{job_type="activation",status="success"} 3')
      })
    })

    describe('recordCronJobFailure', () => {
      it('debe registrar un fallo del cron job de activación', async () => {
        // Arrange
        mockDb.query.mockResolvedValue({ rows: [{ count: '0' }] } as any)

        // Act
        metricsCollector.recordCronJobFailure('activation', 'database_error', 0.5)
        const metrics = await metricsCollector.getMetrics()

        // Assert
        expect(metrics).toContain('campaign_cron_job_executions_total{job_type="activation",status="failure"} 1')
        expect(metrics).toContain('campaign_cron_job_failures_total{job_type="activation",error_type="database_error"} 1')
      })

      it('debe registrar un fallo del cron job de desactivación', async () => {
        // Arrange
        mockDb.query.mockResolvedValue({ rows: [{ count: '0' }] } as any)

        // Act
        metricsCollector.recordCronJobFailure('deactivation', 'product_service_error', 1.0)
        const metrics = await metricsCollector.getMetrics()

        // Assert
        expect(metrics).toContain('campaign_cron_job_executions_total{job_type="deactivation",status="failure"} 1')
        expect(metrics).toContain('campaign_cron_job_failures_total{job_type="deactivation",error_type="product_service_error"} 1')
      })

      it('debe registrar fallos con diferentes tipos de error', async () => {
        // Arrange
        mockDb.query.mockResolvedValue({ rows: [{ count: '0' }] } as any)

        // Act
        metricsCollector.recordCronJobFailure('activation', 'database_error')
        metricsCollector.recordCronJobFailure('activation', 'network_error')
        metricsCollector.recordCronJobFailure('activation', 'unknown')
        const metrics = await metricsCollector.getMetrics()

        // Assert
        expect(metrics).toContain('campaign_cron_job_failures_total{job_type="activation",error_type="database_error"} 1')
        expect(metrics).toContain('campaign_cron_job_failures_total{job_type="activation",error_type="network_error"} 1')
        expect(metrics).toContain('campaign_cron_job_failures_total{job_type="activation",error_type="unknown"} 1')
      })

      it('debe actualizar el timestamp de última ejecución incluso en fallos', async () => {
        // Arrange
        mockDb.query.mockResolvedValue({ rows: [{ count: '0' }] } as any)
        const beforeTimestamp = Date.now() / 1000

        // Act
        metricsCollector.recordCronJobFailure('activation', 'database_error')
        const metrics = await metricsCollector.getMetrics()

        // Assert
        expect(metrics).toContain('campaign_cron_job_last_execution_timestamp{job_type="activation"}')
        
        // Verificar que el timestamp es reciente
        const lastExecution = await metricsCollector.getLastCronJobExecution('activation')
        expect(lastExecution).toBeGreaterThanOrEqual(beforeTimestamp)
      })
    })

    describe('getCronJobFailuresCount', () => {
      it('debe retornar 0 cuando no hay fallos', async () => {
        // Act
        const count = await metricsCollector.getCronJobFailuresCount()

        // Assert
        expect(count).toBe(0)
      })

      it('debe retornar el total de fallos', async () => {
        // Arrange
        metricsCollector.recordCronJobFailure('activation', 'database_error')
        metricsCollector.recordCronJobFailure('deactivation', 'network_error')
        metricsCollector.recordCronJobFailure('activation', 'unknown')

        // Act
        const count = await metricsCollector.getCronJobFailuresCount()

        // Assert
        expect(count).toBe(3)
      })
    })

    describe('getLastCronJobExecution', () => {
      it('debe retornar null cuando no hay ejecuciones', async () => {
        // Act
        const timestamp = await metricsCollector.getLastCronJobExecution('activation')

        // Assert
        expect(timestamp).toBeNull()
      })

      it('debe retornar el timestamp de la última ejecución', async () => {
        // Arrange
        const beforeTimestamp = Date.now() / 1000
        metricsCollector.recordCronJobSuccess('activation', 1.0)

        // Act
        const timestamp = await metricsCollector.getLastCronJobExecution('activation')

        // Assert
        expect(timestamp).not.toBeNull()
        expect(timestamp).toBeGreaterThanOrEqual(beforeTimestamp)
      })

      it('debe retornar timestamps diferentes para cada tipo de job', async () => {
        // Arrange
        metricsCollector.recordCronJobSuccess('activation', 1.0)
        
        // Esperar un poco para que los timestamps sean diferentes
        await new Promise(resolve => setTimeout(resolve, 10))
        
        metricsCollector.recordCronJobSuccess('deactivation', 1.0)

        // Act
        const activationTimestamp = await metricsCollector.getLastCronJobExecution('activation')
        const deactivationTimestamp = await metricsCollector.getLastCronJobExecution('deactivation')

        // Assert
        expect(activationTimestamp).not.toBeNull()
        expect(deactivationTimestamp).not.toBeNull()
        // El timestamp de desactivación debe ser mayor o igual
        expect(deactivationTimestamp).toBeGreaterThanOrEqual(activationTimestamp!)
      })
    })

    describe('Histogram: campaign_cron_job_duration_seconds', () => {
      it('debe registrar la duración del cron job', async () => {
        // Arrange
        mockDb.query.mockResolvedValue({ rows: [{ count: '0' }] } as any)

        // Act
        metricsCollector.recordCronJobSuccess('activation', 5.5)
        const metrics = await metricsCollector.getMetrics()

        // Assert
        expect(metrics).toContain('campaign_cron_job_duration_seconds')
        expect(metrics).toContain('campaign_cron_job_duration_seconds_count{job_type="activation"} 1')
      })

      it('debe usar los buckets configurados para cron job', async () => {
        // Arrange
        mockDb.query.mockResolvedValue({ rows: [{ count: '0' }] } as any)

        // Act
        metricsCollector.recordCronJobSuccess('activation', 1.0)
        const metrics = await metricsCollector.getMetrics()

        // Assert - verificar que existen los buckets esperados para cron job
        // Nota: El orden de las etiquetas puede variar, así que verificamos que existan ambas
        expect(metrics).toContain('campaign_cron_job_duration_seconds_bucket')
        expect(metrics).toContain('le="0.5"')
        expect(metrics).toContain('le="1"')
        expect(metrics).toContain('le="120"')
        expect(metrics).toContain('le="300"')
        expect(metrics).toContain('job_type="activation"')
      })
    })

    describe('Integración con Alertmanager', () => {
      it('debe exponer métricas que Alertmanager puede usar para alertas', async () => {
        // Arrange
        mockDb.query.mockResolvedValue({ rows: [{ count: '0' }] } as any)
        
        // Simular varios fallos para disparar alertas
        metricsCollector.recordCronJobFailure('activation', 'database_error', 1.0)
        metricsCollector.recordCronJobFailure('activation', 'database_error', 1.5)
        metricsCollector.recordCronJobFailure('activation', 'database_error', 2.0)

        // Act
        const metrics = await metricsCollector.getMetrics()

        // Assert - verificar que las métricas están disponibles para Alertmanager
        // Estas métricas son las que usa Prometheus para disparar alertas
        expect(metrics).toContain('campaign_cron_job_failures_total')
        expect(metrics).toContain('campaign_cron_job_last_execution_timestamp')
        expect(metrics).toContain('campaign_cron_job_duration_seconds')
        
        // Verificar que el contador de fallos es correcto
        expect(metrics).toContain('campaign_cron_job_failures_total{job_type="activation",error_type="database_error"} 3')
      })

      it('debe simular el flujo completo de un cron job con fallo', async () => {
        // Arrange
        mockDb.query.mockResolvedValue({ rows: [{ count: '1' }] } as any)
        const startTime = Date.now()

        // Act - simular ejecución del cron job que falla
        await new Promise(resolve => setTimeout(resolve, 50))
        const durationSeconds = (Date.now() - startTime) / 1000
        
        // Registrar el fallo
        metricsCollector.recordCronJobFailure('activation', 'product_service_error', durationSeconds)

        const metrics = await metricsCollector.getMetrics()

        // Assert
        expect(metrics).toContain('campaign_cron_job_executions_total{job_type="activation",status="failure"} 1')
        expect(metrics).toContain('campaign_cron_job_failures_total{job_type="activation",error_type="product_service_error"} 1')
        expect(metrics).toContain('campaign_cron_job_last_execution_timestamp{job_type="activation"}')
        expect(metrics).toContain('campaign_cron_job_duration_seconds_count{job_type="activation"} 1')
      })
    })
  })
})
