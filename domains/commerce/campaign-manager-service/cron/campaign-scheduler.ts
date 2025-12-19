/**
 * Campaign Scheduler - Cron Jobs para activación y desactivación automática
 * 
 * Este módulo implementa los cron jobs que ejecutan automáticamente:
 * 1. Verificación y activación de campañas cada hora
 * 2. Verificación y desactivación de campañas cada hora
 * 
 * Los cron jobs registran cada ejecución en logs para auditoría y monitoreo.
 * Las métricas se exponen para integración con Alertmanager.
 * 
 * Requirements: 5.1, 5.3, 12.3, 16.8
 */

import cron from 'node-cron'
import { logger } from '../shared/utils/logger'
import { CheckActivateCampaigns } from '../check-activate-campaigns/CheckActivateCampaigns'
import { CheckDeactivateCampaigns } from '../check-deactivate-campaigns/CheckDeactivateCampaigns'
import { MetricsCollector } from '../metrics/MetricsCollector'

/**
 * Opciones de configuración para el scheduler
 */
export interface SchedulerOptions {
  /** Expresión cron para activación (default: '0 * * * *' - cada hora) */
  activationSchedule?: string
  
  /** Expresión cron para desactivación (default: '0 * * * *' - cada hora) */
  deactivationSchedule?: string
  
  /** Timezone para los cron jobs (default: 'Europe/Madrid') */
  timezone?: string
  
  /** Ejecutar inmediatamente al iniciar (útil para testing) */
  runOnStart?: boolean
  
  /** Recolector de métricas para Alertmanager (Requirement 16.8) */
  metricsCollector?: MetricsCollector
}

/**
 * Campaign Scheduler
 * 
 * Gestiona los cron jobs para activación y desactivación automática de campañas.
 * Expone métricas para integración con Alertmanager.
 * 
 * Requirements: 5.1, 5.3, 12.3, 16.8
 */
export class CampaignScheduler {
  private activationJob: cron.ScheduledTask | null = null
  private deactivationJob: cron.ScheduledTask | null = null
  private readonly activationSchedule: string
  private readonly deactivationSchedule: string
  private readonly timezone: string
  private readonly runOnStart: boolean
  private metricsCollector?: MetricsCollector

  constructor(
    private checkActivate: CheckActivateCampaigns,
    private checkDeactivate: CheckDeactivateCampaigns,
    options: SchedulerOptions = {}
  ) {
    // Requirement 5.1: Cron job cada hora para activación
    this.activationSchedule = options.activationSchedule || '0 * * * *'
    
    // Requirement 5.3: Cron job cada hora para desactivación
    this.deactivationSchedule = options.deactivationSchedule || '0 * * * *'
    
    this.timezone = options.timezone || 'Europe/Madrid'
    this.runOnStart = options.runOnStart || false
    
    // Requirement 16.8: Recolector de métricas para Alertmanager
    this.metricsCollector = options.metricsCollector
  }

  /**
   * Configura el recolector de métricas para Alertmanager
   * 
   * @param metricsCollector - Instancia del recolector de métricas
   * 
   * Requirement 16.8: Integración con Alertmanager
   */
  setMetricsCollector(metricsCollector: MetricsCollector): void {
    this.metricsCollector = metricsCollector
    logger.info('MetricsCollector configurado en CampaignScheduler')
  }

  /**
   * Inicia los cron jobs
   * 
   * Requirement 5.1: Ejecutar cron job cada hora para verificar campañas pendientes de activación
   * Requirement 5.3: Ejecutar cron job cada hora para verificar campañas pendientes de desactivación
   */
  start(): void {
    logger.info('Iniciando Campaign Scheduler', {
      activationSchedule: this.activationSchedule,
      deactivationSchedule: this.deactivationSchedule,
      timezone: this.timezone,
      runOnStart: this.runOnStart
    })

    // Requirement 5.1: Cron job para activación
    this.activationJob = cron.schedule(
      this.activationSchedule,
      () => this.runActivationCheck(),
      {
        scheduled: true,
        timezone: this.timezone
      }
    )

    // Requirement 5.3: Cron job para desactivación
    this.deactivationJob = cron.schedule(
      this.deactivationSchedule,
      () => this.runDeactivationCheck(),
      {
        scheduled: true,
        timezone: this.timezone
      }
    )

    logger.info('Campaign Scheduler iniciado exitosamente', {
      activationJobScheduled: this.activationJob !== null,
      deactivationJobScheduled: this.deactivationJob !== null
    })

    // Ejecutar inmediatamente si está configurado
    if (this.runOnStart) {
      logger.info('Ejecutando verificaciones iniciales (runOnStart=true)')
      
      // Ejecutar con un pequeño delay para no bloquear el inicio
      setTimeout(() => {
        this.runActivationCheck()
        this.runDeactivationCheck()
      }, 1000)
    }
  }

  /**
   * Detiene los cron jobs
   */
  stop(): void {
    logger.info('Deteniendo Campaign Scheduler')

    if (this.activationJob) {
      this.activationJob.stop()
      this.activationJob = null
      logger.info('Cron job de activación detenido')
    }

    if (this.deactivationJob) {
      this.deactivationJob.stop()
      this.deactivationJob = null
      logger.info('Cron job de desactivación detenido')
    }

    logger.info('Campaign Scheduler detenido exitosamente')
  }

  /**
   * Ejecuta la verificación de activación de campañas
   * 
   * Requirement 12.3: Registrar ejecuciones en logs
   * Requirement 16.8: Registrar métricas para Alertmanager
   */
  private async runActivationCheck(): Promise<void> {
    const executionId = this.generateExecutionId()
    const startTime = Date.now()

    // Requirement 12.3: Registrar inicio de ejecución
    logger.info('Iniciando ejecución de cron job de activación', {
      executionId,
      timestamp: new Date().toISOString(),
      schedule: this.activationSchedule
    })

    try {
      // Ejecutar verificación de activación
      const result = await this.checkActivate.execute()

      const executionTime = (Date.now() - startTime) / 1000

      // Requirement 12.3: Registrar resultado de ejecución
      logger.info('Ejecución de cron job de activación completada', {
        executionId,
        result: 'success',
        campaignsDetected: result.campaignsDetected,
        campaignsActivated: result.campaignsActivated,
        campaignsFailed: result.campaignsFailed,
        executionTime,
        timestamp: new Date().toISOString()
      })

      // Requirement 16.8: Registrar métricas de éxito para Alertmanager
      if (this.metricsCollector) {
        this.metricsCollector.recordCronJobSuccess('activation', executionTime)
      }

      // Log adicional si hubo fallos parciales
      if (result.campaignsFailed > 0) {
        logger.warn('Algunas campañas fallaron al activarse', {
          executionId,
          campaignsFailed: result.campaignsFailed,
          failedCampaigns: result.details
            .filter(d => !d.success)
            .map(d => ({
              campaignId: d.campaignId,
              campaignName: d.campaignName,
              error: d.error
            }))
        })

        // Requirement 16.8: Registrar fallos parciales para Alertmanager
        if (this.metricsCollector) {
          this.metricsCollector.recordCronJobFailure(
            'activation',
            'partial_failure',
            executionTime
          )
        }
      }
    } catch (error) {
      const executionTime = (Date.now() - startTime) / 1000
      const errorType = this.classifyError(error)

      // Requirement 12.3: Registrar error en ejecución
      logger.error('Error en ejecución de cron job de activación', {
        executionId,
        result: 'error',
        errorType,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        executionTime,
        timestamp: new Date().toISOString()
      })

      // Requirement 16.8: Registrar fallo para Alertmanager
      if (this.metricsCollector) {
        this.metricsCollector.recordCronJobFailure('activation', errorType, executionTime)
      }
    }
  }

  /**
   * Ejecuta la verificación de desactivación de campañas
   * 
   * Requirement 12.3: Registrar ejecuciones en logs
   * Requirement 16.8: Registrar métricas para Alertmanager
   */
  private async runDeactivationCheck(): Promise<void> {
    const executionId = this.generateExecutionId()
    const startTime = Date.now()

    // Requirement 12.3: Registrar inicio de ejecución
    logger.info('Iniciando ejecución de cron job de desactivación', {
      executionId,
      timestamp: new Date().toISOString(),
      schedule: this.deactivationSchedule
    })

    try {
      // Ejecutar verificación de desactivación
      const result = await this.checkDeactivate.execute()

      const executionTime = (Date.now() - startTime) / 1000

      // Requirement 12.3: Registrar resultado de ejecución
      logger.info('Ejecución de cron job de desactivación completada', {
        executionId,
        result: 'success',
        campaignsDetected: result.campaignsDetected,
        campaignsDeactivated: result.campaignsDeactivated,
        campaignsFailed: result.campaignsFailed,
        executionTime,
        timestamp: new Date().toISOString()
      })

      // Requirement 16.8: Registrar métricas de éxito para Alertmanager
      if (this.metricsCollector) {
        this.metricsCollector.recordCronJobSuccess('deactivation', executionTime)
      }

      // Log adicional si hubo fallos parciales
      if (result.campaignsFailed > 0) {
        logger.warn('Algunas campañas fallaron al desactivarse', {
          executionId,
          campaignsFailed: result.campaignsFailed,
          failedCampaigns: result.details
            .filter(d => !d.success)
            .map(d => ({
              campaignId: d.campaignId,
              campaignName: d.campaignName,
              error: d.error
            }))
        })

        // Requirement 16.8: Registrar fallos parciales para Alertmanager
        if (this.metricsCollector) {
          this.metricsCollector.recordCronJobFailure(
            'deactivation',
            'partial_failure',
            executionTime
          )
        }
      }
    } catch (error) {
      const executionTime = (Date.now() - startTime) / 1000
      const errorType = this.classifyError(error)

      // Requirement 12.3: Registrar error en ejecución
      logger.error('Error en ejecución de cron job de desactivación', {
        executionId,
        result: 'error',
        errorType,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        executionTime,
        timestamp: new Date().toISOString()
      })

      // Requirement 16.8: Registrar fallo para Alertmanager
      if (this.metricsCollector) {
        this.metricsCollector.recordCronJobFailure('deactivation', errorType, executionTime)
      }
    }
  }

  /**
   * Genera un ID único para cada ejecución de cron job
   * 
   * @returns ID de ejecución único
   */
  private generateExecutionId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    return `cron-${timestamp}-${random}`
  }

  /**
   * Clasifica el tipo de error para métricas de Alertmanager
   * 
   * @param error - Error a clasificar
   * @returns Tipo de error clasificado
   * 
   * Requirement 16.8: Clasificación de errores para Alertmanager
   */
  private classifyError(error: unknown): string {
    if (!(error instanceof Error)) {
      return 'unknown'
    }

    const message = error.message.toLowerCase()
    const name = error.name.toLowerCase()

    // Errores de base de datos
    if (
      message.includes('database') ||
      message.includes('postgresql') ||
      message.includes('connection') ||
      message.includes('query') ||
      name.includes('database')
    ) {
      return 'database_error'
    }

    // Errores del Product Service
    if (
      message.includes('product service') ||
      message.includes('product-service') ||
      message.includes('econnrefused') ||
      message.includes('timeout')
    ) {
      return 'product_service_error'
    }

    // Errores de validación
    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      name.includes('validation')
    ) {
      return 'validation_error'
    }

    // Errores de red
    if (
      message.includes('network') ||
      message.includes('socket') ||
      message.includes('enotfound')
    ) {
      return 'network_error'
    }

    return 'unknown'
  }

  /**
   * Obtiene el estado actual del scheduler
   * 
   * @returns Estado del scheduler
   */
  getStatus(): {
    isRunning: boolean
    activationJobActive: boolean
    deactivationJobActive: boolean
    activationSchedule: string
    deactivationSchedule: string
    timezone: string
  } {
    return {
      isRunning: this.activationJob !== null || this.deactivationJob !== null,
      activationJobActive: this.activationJob !== null,
      deactivationJobActive: this.deactivationJob !== null,
      activationSchedule: this.activationSchedule,
      deactivationSchedule: this.deactivationSchedule,
      timezone: this.timezone
    }
  }

  /**
   * Ejecuta manualmente la verificación de activación (útil para testing)
   */
  async triggerActivationCheck(): Promise<void> {
    logger.info('Ejecución manual de verificación de activación solicitada')
    await this.runActivationCheck()
  }

  /**
   * Ejecuta manualmente la verificación de desactivación (útil para testing)
   */
  async triggerDeactivationCheck(): Promise<void> {
    logger.info('Ejecución manual de verificación de desactivación solicitada')
    await this.runDeactivationCheck()
  }
}

/**
 * Factory function para crear el scheduler con dependencias
 * 
 * @param checkActivate - Caso de uso de activación
 * @param checkDeactivate - Caso de uso de desactivación
 * @param options - Opciones de configuración
 * @returns Instancia del scheduler
 */
export function createCampaignScheduler(
  checkActivate: CheckActivateCampaigns,
  checkDeactivate: CheckDeactivateCampaigns,
  options?: SchedulerOptions
): CampaignScheduler {
  return new CampaignScheduler(checkActivate, checkDeactivate, options)
}
