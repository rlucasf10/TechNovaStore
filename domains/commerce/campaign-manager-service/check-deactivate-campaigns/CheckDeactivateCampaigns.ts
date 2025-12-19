/**
 * CheckDeactivateCampaigns - Caso de uso para verificar y desactivar campañas automáticamente
 * 
 * Este caso de uso es ejecutado por el scheduler (cron job) para detectar campañas
 * que deben desactivarse según su fecha de fin, remover sus descuentos automáticamente,
 * generar un reporte final y enviar notificaciones al equipo.
 * 
 * Requirements: 5.3, 5.4, 5.5, 5.6, 4.6
 */

import { logger } from '../shared/utils/logger'
import { CampaignRepository } from '../shared/repositories/CampaignRepository'
import { CampaignProductRepository } from '../shared/repositories/CampaignProductRepository'
import { RemoveCampaignDiscounts } from '../remove-campaign-discounts/RemoveCampaignDiscounts'
import { NotificationServiceClient } from '../shared/clients/NotificationServiceClient'
import { Campaign, CampaignReport, AggregatedMetrics } from '../shared/types'

/**
 * Output del proceso de verificación y desactivación
 */
export interface CheckDeactivateOutput {
  /** Número de campañas detectadas para desactivación */
  campaignsDetected: number
  
  /** Número de campañas desactivadas exitosamente */
  campaignsDeactivated: number
  
  /** Número de campañas que fallaron al desactivarse */
  campaignsFailed: number
  
  /** Detalles de cada campaña procesada */
  details: Array<{
    campaignId: string
    campaignName: string
    success: boolean
    productsRestored?: number
    report?: CampaignReport
    error?: string
  }>
  
  /** Tiempo total de procesamiento en segundos */
  processingTime: number
}

/**
 * Caso de uso: Verificar y desactivar campañas automáticamente
 * 
 * Implementa la lógica completa para:
 * 1. Buscar campañas pendientes de desactivación (end_date < now, is_active = true)
 * 2. Remover descuentos automáticamente para cada campaña
 * 3. Generar reporte final con métricas
 * 4. Registrar en logs cada desactivación
 * 5. Enviar notificaciones al equipo
 * 
 * Requirements: 5.3, 5.4, 5.5, 5.6, 4.6
 */
export class CheckDeactivateCampaigns {
  constructor(
    private campaignRepository: CampaignRepository,
    private campaignProductRepository: CampaignProductRepository,
    private removeDiscounts: RemoveCampaignDiscounts,
    private notificationClient: NotificationServiceClient
  ) {}

  /**
   * Ejecuta el caso de uso
   * 
   * Requirement 5.3: Ejecutar verificación de campañas pendientes de desactivación
   * 
   * @returns Resultado de la verificación y desactivación
   */
  async execute(): Promise<CheckDeactivateOutput> {
    const startTime = Date.now()
    const now = new Date()

    logger.info('Iniciando verificación de campañas pendientes de desactivación', {
      timestamp: now.toISOString()
    })

    try {
      // Requirement 5.4: Detectar campañas que deben desactivarse
      const pendingCampaigns = await this.findPendingCampaigns(now)

      if (pendingCampaigns.length === 0) {
        logger.info('No se encontraron campañas pendientes de desactivación')
        
        return {
          campaignsDetected: 0,
          campaignsDeactivated: 0,
          campaignsFailed: 0,
          details: [],
          processingTime: (Date.now() - startTime) / 1000
        }
      }

      logger.info('Campañas pendientes de desactivación detectadas', {
        count: pendingCampaigns.length,
        campaigns: pendingCampaigns.map(c => ({
          id: c.id,
          name: c.name,
          endDate: c.endDate,
          priority: c.priority
        }))
      })

      // Procesar cada campaña
      const results = await this.processCampaigns(pendingCampaigns)

      const processingTime = (Date.now() - startTime) / 1000

      // Requirement 5.5: Registrar en logs cada desactivación
      logger.info('Verificación de desactivación completada', {
        campaignsDetected: pendingCampaigns.length,
        campaignsDeactivated: results.filter(r => r.success).length,
        campaignsFailed: results.filter(r => !r.success).length,
        processingTime
      })

      return {
        campaignsDetected: pendingCampaigns.length,
        campaignsDeactivated: results.filter(r => r.success).length,
        campaignsFailed: results.filter(r => !r.success).length,
        details: results,
        processingTime
      }
    } catch (error) {
      logger.error('Error crítico en verificación de desactivación', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      throw error
    }
  }

  /**
   * Busca campañas pendientes de desactivación
   * 
   * Requirement 5.4: Detectar campañas que deben desactivarse
   * (end_date <= now, is_active = true)
   * 
   * @param now - Fecha y hora actual
   * @returns Lista de campañas pendientes
   */
  private async findPendingCampaigns(now: Date): Promise<Campaign[]> {
    try {
      const campaigns = await this.campaignRepository.findPendingDeactivation(now)
      
      logger.debug('Búsqueda de campañas pendientes completada', {
        count: campaigns.length,
        timestamp: now.toISOString()
      })

      return campaigns
    } catch (error) {
      logger.error('Error al buscar campañas pendientes de desactivación', {
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
    productsRestored?: number
    report?: CampaignReport
    error?: string
  }>> {
    const results: Array<{
      campaignId: string
      campaignName: string
      success: boolean
      productsRestored?: number
      report?: CampaignReport
      error?: string
    }> = []

    // Procesar campañas en orden de prioridad (ya vienen ordenadas del repositorio)
    for (const campaign of campaigns) {
      const result = await this.deactivateCampaign(campaign)
      results.push(result)
    }

    return results
  }

  /**
   * Desactiva una campaña completa
   * 
   * Requirement 5.4: Remover descuentos automáticamente
   * Requirement 4.6: Generar reporte final antes de remover descuentos
   * 
   * @param campaign - Campaña a desactivar
   * @returns Resultado de la desactivación
   */
  private async deactivateCampaign(
    campaign: Campaign
  ): Promise<{
    campaignId: string
    campaignName: string
    success: boolean
    productsRestored?: number
    report?: CampaignReport
    error?: string
  }> {
    try {
      // Requirement 4.6: Generar reporte final antes de remover descuentos
      const report = await this.generateFinalReport(campaign)

      logger.info('Reporte final generado', {
        campaignId: campaign.id,
        campaignName: campaign.name,
        productsWithDiscount: report.metrics.productsWithDiscount,
        totalRevenue: report.metrics.totalRevenue
      })

      // Requirement 5.4: Remover descuentos automáticamente
      const result = await this.removeDiscounts.execute({
        campaignId: campaign.id
      })

      // Actualizar estado de la campaña
      await this.updateCampaignStatus(campaign.id)

      // Requirement 5.5: Registrar en logs cada desactivación exitosa
      logger.info('Campaña desactivada exitosamente', {
        campaignId: campaign.id,
        campaignName: campaign.name,
        productsRestored: result.productsRestored,
        totalRevenue: report.metrics.totalRevenue
      })

      // Requirement 5.6: Enviar notificación cuando campaña se desactiva
      await this.sendDeactivationNotification(campaign, report)

      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        success: true,
        productsRestored: result.productsRestored,
        report
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Requirement 5.5: Registrar en logs el fallo
      logger.error('Campaña falló al desactivarse', {
        campaignId: campaign.id,
        campaignName: campaign.name,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      })

      // Requirement 5.6: Enviar notificación de error
      await this.sendErrorNotification(campaign, error as Error)

      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * Genera el reporte final de la campaña
   * 
   * Requirement 4.6: Generar reporte final con métricas
   * 
   * @param campaign - Campaña para la cual generar el reporte
   * @returns Reporte completo de la campaña
   */
  private async generateFinalReport(campaign: Campaign): Promise<CampaignReport> {
    try {
      // Obtener productos con descuento
      const campaignProducts = await this.campaignProductRepository.findByCampaignId(
        campaign.id
      )

      // Calcular métricas agregadas
      const metrics: AggregatedMetrics = {
        productsWithDiscount: campaignProducts.length,
        averageDiscountPercentage: campaignProducts.length > 0
          ? Math.round(
              campaignProducts.reduce((sum, cp) => sum + cp.discountPercentage, 0) /
              campaignProducts.length
            )
          : 0,
        totalViews: 0, // TODO: Implementar cuando se agregue tracking de analytics
        totalClicks: 0,
        totalConversions: campaignProducts.reduce((sum, cp) => sum + cp.unitsSold, 0),
        totalRevenue: campaignProducts.reduce(
          (sum, cp) => sum + (cp.campaignPrice * cp.unitsSold),
          0
        ),
        conversionRate: 0, // Se calculará cuando tengamos clicks
        roi: 0 // Se calculará cuando tengamos el costo total de descuentos
      }

      // Calcular tasa de conversión
      if (metrics.totalClicks > 0) {
        metrics.conversionRate = (metrics.totalConversions / metrics.totalClicks) * 100
      }

      // Calcular ROI
      const totalDiscountAmount = campaignProducts.reduce(
        (sum, cp) => sum + (cp.discountAmount * cp.unitsSold),
        0
      )
      
      if (totalDiscountAmount > 0) {
        metrics.roi = (metrics.totalRevenue - totalDiscountAmount) / totalDiscountAmount
      }

      // Obtener top productos
      const topProducts = campaignProducts
        .sort((a, b) => b.unitsSold - a.unitsSold)
        .slice(0, 10)
        .map(cp => ({
          productId: cp.productId,
          productName: `Product ${cp.productId}`, // TODO: Obtener nombre real del Product Service
          unitsSold: cp.unitsSold,
          revenue: cp.campaignPrice * cp.unitsSold
        }))

      const report: CampaignReport = {
        campaign,
        metrics,
        topProducts,
        dailyMetrics: [] // TODO: Implementar cuando se agregue tracking diario
      }

      logger.debug('Reporte final generado', {
        campaignId: campaign.id,
        metrics
      })

      return report
    } catch (error) {
      logger.error('Error al generar reporte final', {
        campaignId: campaign.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Actualiza el estado de la campaña después de desactivar
   * 
   * @param campaignId - ID de la campaña
   */
  private async updateCampaignStatus(campaignId: string): Promise<void> {
    await this.campaignRepository.update(campaignId, {
      isActive: false,
      deactivatedAt: new Date()
    })

    logger.info('Estado de campaña actualizado', {
      campaignId,
      isActive: false
    })
  }

  /**
   * Envía notificación de desactivación exitosa
   * 
   * Requirement 5.6: Enviar notificaciones cuando campaña se desactiva
   * 
   * @param campaign - Campaña desactivada
   * @param report - Reporte final de la campaña
   */
  private async sendDeactivationNotification(
    campaign: Campaign,
    report: CampaignReport
  ): Promise<void> {
    try {
      await this.notificationClient.sendCampaignDeactivated(campaign, report)

      logger.debug('Notificación de desactivación enviada', {
        campaignId: campaign.id,
        campaignName: campaign.name
      })
    } catch (error) {
      // No lanzar error si la notificación falla - es un servicio auxiliar
      logger.warn('Error al enviar notificación de desactivación', {
        campaignId: campaign.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Envía notificación de error en desactivación
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
        'deactivation'
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
