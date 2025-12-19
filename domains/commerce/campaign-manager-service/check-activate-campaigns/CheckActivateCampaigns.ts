/**
 * CheckActivateCampaigns - Caso de uso para verificar y activar campañas automáticamente
 * 
 * Este caso de uso es ejecutado por el scheduler (cron job) para detectar campañas
 * que deben activarse según su fecha de inicio, aplicar sus descuentos automáticamente
 * y enviar notificaciones al equipo.
 * 
 * Requirements: 5.1, 5.2, 5.5, 5.6, 5.7
 */

import { logger } from '../shared/utils/logger'
import { CampaignRepository } from '../shared/repositories/CampaignRepository'
import { ApplyCampaignDiscounts } from '../apply-campaign-discounts/ApplyCampaignDiscounts'
import { NotificationServiceClient } from '../shared/clients/NotificationServiceClient'
import { Campaign } from '../shared/types'

/**
 * Output del proceso de verificación y activación
 */
export interface CheckActivateOutput {
  /** Número de campañas detectadas para activación */
  campaignsDetected: number
  
  /** Número de campañas activadas exitosamente */
  campaignsActivated: number
  
  /** Número de campañas que fallaron al activarse */
  campaignsFailed: number
  
  /** Detalles de cada campaña procesada */
  details: Array<{
    campaignId: string
    campaignName: string
    success: boolean
    productsAffected?: number
    error?: string
    retries?: number
  }>
  
  /** Tiempo total de procesamiento en segundos */
  processingTime: number
}

/**
 * Opciones de configuración para el caso de uso
 */
export interface CheckActivateOptions {
  /** Número máximo de reintentos en caso de fallo (default: 3) */
  maxRetries?: number
  
  /** Delay base para backoff exponencial en ms (default: 1000) */
  retryBaseDelay?: number
}

/**
 * Caso de uso: Verificar y activar campañas automáticamente
 * 
 * Implementa la lógica completa para:
 * 1. Buscar campañas pendientes de activación (start_date <= now, is_active = false)
 * 2. Aplicar descuentos automáticamente para cada campaña
 * 3. Registrar en logs cada activación
 * 4. Enviar notificaciones al equipo
 * 5. Implementar reintentos (hasta 3 veces) en caso de fallo
 * 
 * Requirements: 5.1, 5.2, 5.5, 5.6, 5.7
 */
export class CheckActivateCampaigns {
  private readonly maxRetries: number
  private readonly retryBaseDelay: number

  constructor(
    private campaignRepository: CampaignRepository,
    private applyDiscounts: ApplyCampaignDiscounts,
    private notificationClient: NotificationServiceClient,
    options: CheckActivateOptions = {}
  ) {
    this.maxRetries = options.maxRetries ?? 3
    this.retryBaseDelay = options.retryBaseDelay ?? 1000
  }

  /**
   * Ejecuta el caso de uso
   * 
   * Requirement 5.1: Ejecutar verificación de campañas pendientes de activación
   * 
   * @returns Resultado de la verificación y activación
   */
  async execute(): Promise<CheckActivateOutput> {
    const startTime = Date.now()
    const now = new Date()

    logger.info('Iniciando verificación de campañas pendientes de activación', {
      timestamp: now.toISOString()
    })

    try {
      // Requirement 5.2: Detectar campañas que deben activarse
      const pendingCampaigns = await this.findPendingCampaigns(now)

      if (pendingCampaigns.length === 0) {
        logger.info('No se encontraron campañas pendientes de activación')
        
        return {
          campaignsDetected: 0,
          campaignsActivated: 0,
          campaignsFailed: 0,
          details: [],
          processingTime: (Date.now() - startTime) / 1000
        }
      }

      logger.info('Campañas pendientes de activación detectadas', {
        count: pendingCampaigns.length,
        campaigns: pendingCampaigns.map(c => ({
          id: c.id,
          name: c.name,
          startDate: c.startDate,
          priority: c.priority
        }))
      })

      // Procesar cada campaña
      const results = await this.processCampaigns(pendingCampaigns)

      const processingTime = (Date.now() - startTime) / 1000

      // Requirement 5.5: Registrar en logs cada activación
      logger.info('Verificación de activación completada', {
        campaignsDetected: pendingCampaigns.length,
        campaignsActivated: results.filter(r => r.success).length,
        campaignsFailed: results.filter(r => !r.success).length,
        processingTime
      })

      return {
        campaignsDetected: pendingCampaigns.length,
        campaignsActivated: results.filter(r => r.success).length,
        campaignsFailed: results.filter(r => !r.success).length,
        details: results,
        processingTime
      }
    } catch (error) {
      logger.error('Error crítico en verificación de activación', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      throw error
    }
  }

  /**
   * Busca campañas pendientes de activación
   * 
   * Requirement 5.2: Detectar campañas que deben activarse
   * (start_date <= now, is_active = false, discounts_applied = false)
   * 
   * @param now - Fecha y hora actual
   * @returns Lista de campañas pendientes
   */
  private async findPendingCampaigns(now: Date): Promise<Campaign[]> {
    try {
      const campaigns = await this.campaignRepository.findPendingActivation(now)
      
      logger.debug('Búsqueda de campañas pendientes completada', {
        count: campaigns.length,
        timestamp: now.toISOString()
      })

      return campaigns
    } catch (error) {
      logger.error('Error al buscar campañas pendientes de activación', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Procesa todas las campañas pendientes
   * 
   * @param campaigns - Lista de campañas a procesar
   * @returns Resultados del procesamiento
   */
  private async processCampaigns(
    campaigns: Campaign[]
  ): Promise<Array<{
    campaignId: string
    campaignName: string
    success: boolean
    productsAffected?: number
    error?: string
    retries?: number
  }>> {
    const results: Array<{
      campaignId: string
      campaignName: string
      success: boolean
      productsAffected?: number
      error?: string
      retries?: number
    }> = []

    // Procesar campañas en orden de prioridad (ya vienen ordenadas del repositorio)
    for (const campaign of campaigns) {
      const result = await this.activateCampaignWithRetry(campaign)
      results.push(result)
    }

    return results
  }

  /**
   * Activa una campaña con reintentos en caso de fallo
   * 
   * Requirement 5.7: Reintentar operación hasta 3 veces antes de notificar error
   * 
   * @param campaign - Campaña a activar
   * @returns Resultado de la activación
   */
  private async activateCampaignWithRetry(
    campaign: Campaign
  ): Promise<{
    campaignId: string
    campaignName: string
    success: boolean
    productsAffected?: number
    error?: string
    retries?: number
  }> {
    let lastError: Error | null = null
    let retryCount = 0

    // Requirement 5.7: Reintentar hasta maxRetries veces
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // Requirement 5.2: Aplicar descuentos automáticamente
        const result = await this.applyDiscounts.execute({
          campaignId: campaign.id
        })

        // Requirement 5.5: Registrar en logs cada activación exitosa
        logger.info('Campaña activada exitosamente', {
          campaignId: campaign.id,
          campaignName: campaign.name,
          productsAffected: result.productsAffected,
          averageDiscount: result.averageDiscountPercentage,
          attempt: attempt + 1,
          retries: retryCount
        })

        // Requirement 5.6: Enviar notificación cuando campaña se activa
        await this.sendActivationNotification(
          campaign,
          result.productsAffected,
          result.averageDiscountPercentage
        )

        return {
          campaignId: campaign.id,
          campaignName: campaign.name,
          success: true,
          productsAffected: result.productsAffected,
          retries: retryCount
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        retryCount++

        // Si no es el último intento, esperar antes de reintentar
        if (attempt < this.maxRetries) {
          const delay = this.calculateBackoffDelay(attempt)
          
          logger.warn('Error al activar campaña, reintentando', {
            campaignId: campaign.id,
            campaignName: campaign.name,
            attempt: attempt + 1,
            maxRetries: this.maxRetries,
            nextRetryIn: delay,
            error: lastError.message
          })

          await this.sleep(delay)
        }
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    // Requirement 5.5: Registrar en logs el fallo
    logger.error('Campaña falló al activarse después de todos los reintentos', {
      campaignId: campaign.id,
      campaignName: campaign.name,
      retries: retryCount,
      error: lastError?.message,
      stack: lastError?.stack
    })

    // Requirement 5.6: Enviar notificación de error
    await this.sendErrorNotification(campaign, lastError!)

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      success: false,
      error: lastError?.message || 'Unknown error',
      retries: retryCount
    }
  }

  /**
   * Calcula el delay para backoff exponencial
   * 
   * @param attempt - Número de intento (0-indexed)
   * @returns Delay en milisegundos
   */
  private calculateBackoffDelay(attempt: number): number {
    // Backoff exponencial: baseDelay * 2^attempt
    // Ejemplo: 1000ms, 2000ms, 4000ms, 8000ms
    return this.retryBaseDelay * Math.pow(2, attempt)
  }

  /**
   * Espera un tiempo determinado
   * 
   * @param ms - Milisegundos a esperar
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Envía notificación de activación exitosa
   * 
   * Requirement 5.6: Enviar notificaciones cuando campaña se activa
   * 
   * @param campaign - Campaña activada
   * @param productsAffected - Número de productos afectados
   * @param averageDiscount - Porcentaje promedio de descuento
   */
  private async sendActivationNotification(
    campaign: Campaign,
    productsAffected: number,
    averageDiscount: number
  ): Promise<void> {
    try {
      await this.notificationClient.sendCampaignActivated(
        campaign,
        productsAffected,
        averageDiscount
      )

      logger.debug('Notificación de activación enviada', {
        campaignId: campaign.id,
        campaignName: campaign.name
      })
    } catch (error) {
      // No lanzar error si la notificación falla - es un servicio auxiliar
      logger.warn('Error al enviar notificación de activación', {
        campaignId: campaign.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Envía notificación de error en activación
   * 
   * Requirement 5.6: Enviar notificaciones cuando hay errores
   * 
   * @param campaign - Campaña que falló
   * @param error - Error que ocurrió
   */
  private async sendErrorNotification(
    campaign: Campaign,
    error: Error
  ): Promise<void> {
    try {
      await this.notificationClient.sendCampaignError(
        campaign,
        error,
        'activation'
      )

      logger.debug('Notificación de error enviada', {
        campaignId: campaign.id,
        campaignName: campaign.name
      })
    } catch (notificationError) {
      // No lanzar error si la notificación falla - es un servicio auxiliar
      logger.warn('Error al enviar notificación de error', {
        campaignId: campaign.id,
        error: notificationError instanceof Error ? notificationError.message : 'Unknown error'
      })
    }
  }
}
