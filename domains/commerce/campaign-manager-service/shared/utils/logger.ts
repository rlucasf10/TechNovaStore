/**
 * Logger Utility - Campaign Manager Service
 * 
 * Proporciona logging estructurado en formato JSON para integración con ELK stack.
 * Implementa los requisitos 12.4, 12.7 y 16.9.
 * 
 * Características:
 * - Formato JSON estructurado para Logstash/Elasticsearch
 * - Campos específicos para campañas (campaignId, operation, productsAffected)
 * - Niveles de log: DEBUG, INFO, WARN, ERROR
 * - Contexto enriquecido para trazabilidad
 */

import winston from 'winston'
import os from 'os'

/**
 * Tipos de operaciones de campaña para logging estructurado
 */
export type CampaignOperation = 
  | 'campaign_created'
  | 'campaign_updated'
  | 'campaign_deleted'
  | 'campaign_activated'
  | 'campaign_deactivated'
  | 'discounts_applied'
  | 'discounts_removed'
  | 'cron_execution'
  | 'analytics_generated'
  | 'report_generated'
  | 'validation_error'
  | 'integration_error'

/**
 * Interfaz para metadatos de log de campaña
 */
export interface CampaignLogMeta {
  campaignId?: string
  campaignName?: string
  operation?: CampaignOperation
  productsAffected?: number
  discountAmount?: number
  duration?: number
  userId?: string
  error?: string
  stack?: string
  [key: string]: any
}

/**
 * Formato personalizado para logs estructurados JSON (ELK Stack)
 * Incluye todos los campos necesarios para indexación en Elasticsearch
 */
const elkFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.errors({ stack: true }),
  winston.format((info) => {
    // Añadir campos estándar para ELK
    return {
      ...info,
      hostname: os.hostname(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.SERVICE_VERSION || '1.0.0',
    }
  })(),
  winston.format.json()
)

/**
 * Formato para desarrollo (más legible en consola)
 */
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    return `${timestamp} [${level}] [${service}]: ${message} ${metaStr}`
  })
)

/**
 * Determina el nivel de log según el entorno
 */
const getLogLevel = (): string => {
  const env = process.env.NODE_ENV || 'development'
  const logLevel = process.env.LOG_LEVEL

  if (logLevel) {
    return logLevel
  }

  switch (env) {
    case 'production':
      return 'info'
    case 'test':
      return 'error'
    default:
      return 'debug'
  }
}

/**
 * Crea el logger de Winston con configuración para ELK Stack
 */
const createLogger = (): winston.Logger => {
  const isProduction = process.env.NODE_ENV === 'production'
  const isTest = process.env.NODE_ENV === 'test'

  const transports: winston.transport[] = []

  // Console transport - siempre JSON en producción para ELK
  if (!isTest) {
    transports.push(
      new winston.transports.Console({
        format: isProduction ? elkFormat : developmentFormat,
      })
    )
  }

  return winston.createLogger({
    level: getLogLevel(),
    defaultMeta: {
      service: 'campaign-manager-service',
    },
    transports,
  })
}

/**
 * Instancia singleton del logger
 */
export const logger = createLogger()

/**
 * Logger con contexto adicional
 * 
 * @param context - Contexto adicional para los logs
 * @returns Logger con el contexto añadido
 */
export const createContextLogger = (context: Record<string, any>) => {
  return logger.child(context)
}

/**
 * Clase helper para logging de operaciones de campaña
 * Proporciona métodos específicos para cada tipo de operación
 */
export class CampaignLogger {
  private contextLogger: winston.Logger

  constructor(context?: Record<string, any>) {
    this.contextLogger = context ? logger.child(context) : logger
  }

  /**
   * Log de creación de campaña
   */
  campaignCreated(campaignId: string, campaignName: string, userId?: string): void {
    this.contextLogger.info('Campaña creada exitosamente', {
      operation: 'campaign_created' as CampaignOperation,
      campaignId,
      campaignName,
      userId,
      event: 'campaign_lifecycle',
    })
  }

  /**
   * Log de actualización de campaña
   */
  campaignUpdated(campaignId: string, campaignName: string, changes: string[], userId?: string): void {
    this.contextLogger.info('Campaña actualizada', {
      operation: 'campaign_updated' as CampaignOperation,
      campaignId,
      campaignName,
      changes,
      userId,
      event: 'campaign_lifecycle',
    })
  }

  /**
   * Log de eliminación de campaña
   */
  campaignDeleted(campaignId: string, campaignName: string, userId?: string): void {
    this.contextLogger.info('Campaña eliminada', {
      operation: 'campaign_deleted' as CampaignOperation,
      campaignId,
      campaignName,
      userId,
      event: 'campaign_lifecycle',
    })
  }

  /**
   * Log de activación de campaña
   */
  campaignActivated(campaignId: string, campaignName: string, productsAffected: number, automatic: boolean = false): void {
    this.contextLogger.info('Campaña activada', {
      operation: 'campaign_activated' as CampaignOperation,
      campaignId,
      campaignName,
      productsAffected,
      automatic,
      event: 'campaign_lifecycle',
    })
  }

  /**
   * Log de desactivación de campaña
   */
  campaignDeactivated(campaignId: string, campaignName: string, productsAffected: number, automatic: boolean = false): void {
    this.contextLogger.info('Campaña desactivada', {
      operation: 'campaign_deactivated' as CampaignOperation,
      campaignId,
      campaignName,
      productsAffected,
      automatic,
      event: 'campaign_lifecycle',
    })
  }

  /**
   * Log de aplicación de descuentos
   */
  discountsApplied(
    campaignId: string, 
    campaignName: string, 
    productsAffected: number, 
    totalDiscountAmount: number,
    duration: number
  ): void {
    this.contextLogger.info('Descuentos aplicados', {
      operation: 'discounts_applied' as CampaignOperation,
      campaignId,
      campaignName,
      productsAffected,
      totalDiscountAmount,
      duration,
      event: 'discount_operation',
    })
  }

  /**
   * Log de remoción de descuentos
   */
  discountsRemoved(
    campaignId: string, 
    campaignName: string, 
    productsRestored: number,
    duration: number
  ): void {
    this.contextLogger.info('Descuentos removidos', {
      operation: 'discounts_removed' as CampaignOperation,
      campaignId,
      campaignName,
      productsRestored,
      duration,
      event: 'discount_operation',
    })
  }

  /**
   * Log de ejecución de cron job
   */
  cronExecution(
    jobType: 'activation' | 'deactivation',
    campaignsProcessed: number,
    success: boolean,
    duration: number,
    errors?: string[]
  ): void {
    const level = success ? 'info' : 'warn'
    this.contextLogger.log(level, `Cron job de ${jobType} ejecutado`, {
      operation: 'cron_execution' as CampaignOperation,
      jobType,
      campaignsProcessed,
      success,
      duration,
      errors,
      event: 'cron_job',
    })
  }

  /**
   * Log de generación de analytics
   */
  analyticsGenerated(campaignId: string, campaignName: string, metrics: Record<string, any>): void {
    this.contextLogger.info('Analytics generados', {
      operation: 'analytics_generated' as CampaignOperation,
      campaignId,
      campaignName,
      metrics,
      event: 'analytics',
    })
  }

  /**
   * Log de generación de reporte
   */
  reportGenerated(campaignId: string, campaignName: string, reportType: string): void {
    this.contextLogger.info('Reporte generado', {
      operation: 'report_generated' as CampaignOperation,
      campaignId,
      campaignName,
      reportType,
      event: 'report',
    })
  }

  /**
   * Log de error de validación
   */
  validationError(message: string, details: Record<string, any>, campaignId?: string): void {
    this.contextLogger.warn('Error de validación', {
      operation: 'validation_error' as CampaignOperation,
      campaignId,
      validationMessage: message,
      details,
      event: 'validation',
    })
  }

  /**
   * Log de error de integración con servicios externos
   */
  integrationError(
    serviceName: string, 
    operation: string, 
    error: Error, 
    campaignId?: string,
    retryAttempt?: number
  ): void {
    this.contextLogger.error('Error de integración', {
      operation: 'integration_error' as CampaignOperation,
      serviceName,
      integrationOperation: operation,
      campaignId,
      retryAttempt,
      error: error.message,
      stack: error.stack,
      event: 'integration',
    })
  }

  /**
   * Log genérico de debug
   */
  debug(message: string, meta?: CampaignLogMeta): void {
    this.contextLogger.debug(message, meta)
  }

  /**
   * Log genérico de info
   */
  info(message: string, meta?: CampaignLogMeta): void {
    this.contextLogger.info(message, meta)
  }

  /**
   * Log genérico de warning
   */
  warn(message: string, meta?: CampaignLogMeta): void {
    this.contextLogger.warn(message, meta)
  }

  /**
   * Log genérico de error
   */
  error(message: string, error?: Error, meta?: CampaignLogMeta): void {
    this.contextLogger.error(message, {
      ...meta,
      error: error?.message,
      stack: error?.stack,
    })
  }
}

/**
 * Instancia singleton del CampaignLogger
 */
export const campaignLogger = new CampaignLogger()

export default logger
