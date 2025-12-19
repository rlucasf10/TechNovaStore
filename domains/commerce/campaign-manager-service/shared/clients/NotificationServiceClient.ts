/**
 * Cliente para comunicación con el Notification Service
 * 
 * Implementa métodos para enviar notificaciones relacionadas con campañas,
 * como activación, desactivación y errores.
 * También crea notificaciones de promociones para los usuarios.
 */

import axios, { AxiosInstance } from 'axios'
import http from 'http'
import { config } from '../../config'
import { Campaign, CampaignReport } from '../types'
import { logger } from '../utils/logger'

/**
 * Datos para notificación de campaña activada
 */
interface CampaignActivatedData {
  campaignId: string
  campaignName: string
  startDate: Date
  endDate: Date
  productsAffected: number
  averageDiscount: number
}

/**
 * Datos para notificación de campaña desactivada
 */
interface CampaignDeactivatedData {
  campaignId: string
  campaignName: string
  startDate: Date
  endDate: Date
  totalRevenue: number
  totalConversions: number
  productsAffected: number
}

/**
 * Datos para notificación de error en campaña
 */
interface CampaignErrorData {
  campaignId: string
  campaignName: string
  operation: 'activation' | 'deactivation' | 'discount_application' | 'discount_removal'
  errorMessage: string
  errorStack?: string
  timestamp: Date
}

/**
 * Cliente HTTP para Notification Service
 * 
 * Proporciona métodos para enviar notificaciones al equipo
 * sobre eventos importantes relacionados con campañas.
 */
export class NotificationServiceClient {
  private client: AxiosInstance

  constructor(baseURL: string = config.notificationServiceUrl) {
    this.client = axios.create({
      baseURL,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  /**
   * Envía notificación cuando una campaña se activa automáticamente
   * 
   * Notifica al equipo que una campaña ha sido activada por el scheduler,
   * incluyendo información sobre productos afectados y descuentos aplicados.
   * 
   * @param campaign - Campaña que fue activada
   * @param productsAffected - Número de productos con descuento aplicado
   * @param averageDiscount - Porcentaje promedio de descuento
   */
  async sendCampaignActivated(
    campaign: Campaign,
    productsAffected: number = 0,
    averageDiscount: number = 0
  ): Promise<void> {
    try {
      const data: CampaignActivatedData = {
        campaignId: campaign.id,
        campaignName: campaign.name,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        productsAffected,
        averageDiscount
      }

      // Por ahora, usar el endpoint genérico de order-confirmation
      // En el futuro, el Notification Service debería tener un endpoint específico
      await this.client.post('/api/notifications/order-confirmation', {
        recipient: 'admin@technovastore.com',
        subject: `✅ Campaña Activada: ${campaign.name}`,
        data: {
          title: 'Campaña Activada Automáticamente',
          message: `La campaña "${campaign.name}" ha sido activada exitosamente.`,
          details: {
            'ID de Campaña': campaign.id,
            'Nombre': campaign.name,
            'Fecha de Inicio': campaign.startDate.toISOString(),
            'Fecha de Fin': campaign.endDate.toISOString(),
            'Productos Afectados': productsAffected.toString(),
            'Descuento Promedio': `${averageDiscount.toFixed(2)}%`,
            'Prioridad': campaign.priority.toString()
          }
        }
      })

      logger.info('Notificación de activación enviada', {
        campaignId: campaign.id,
        campaignName: campaign.name,
        service: 'NotificationService'
      })
    } catch (error) {
      // No lanzar error si la notificación falla - es un servicio auxiliar
      logger.error('Error al enviar notificación de activación', {
        campaignId: campaign.id,
        campaignName: campaign.name,
        service: 'NotificationService',
        error: error instanceof Error ? error.message : 'Error desconocido'
      })
    }
  }

  /**
   * Envía notificación cuando una campaña se desactiva automáticamente
   * 
   * Notifica al equipo que una campaña ha finalizado, incluyendo
   * un resumen de métricas y resultados.
   * 
   * @param campaign - Campaña que fue desactivada
   * @param report - Reporte final con métricas de la campaña
   */
  async sendCampaignDeactivated(
    campaign: Campaign,
    report: CampaignReport
  ): Promise<void> {
    try {
      const data: CampaignDeactivatedData = {
        campaignId: campaign.id,
        campaignName: campaign.name,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        totalRevenue: report.metrics.totalRevenue,
        totalConversions: report.metrics.totalConversions,
        productsAffected: report.metrics.productsWithDiscount
      }

      // Por ahora, usar el endpoint genérico de order-confirmation
      await this.client.post('/api/notifications/order-confirmation', {
        recipient: 'admin@technovastore.com',
        subject: `🏁 Campaña Finalizada: ${campaign.name}`,
        data: {
          title: 'Campaña Desactivada Automáticamente',
          message: `La campaña "${campaign.name}" ha finalizado. Aquí está el resumen:`,
          details: {
            'ID de Campaña': campaign.id,
            'Nombre': campaign.name,
            'Duración': `${campaign.startDate.toLocaleDateString()} - ${campaign.endDate.toLocaleDateString()}`,
            'Productos con Descuento': report.metrics.productsWithDiscount.toString(),
            'Descuento Promedio': `${report.metrics.averageDiscountPercentage.toFixed(2)}%`,
            'Total de Conversiones': report.metrics.totalConversions.toString(),
            'Ingresos Totales': `€${report.metrics.totalRevenue.toFixed(2)}`,
            'Tasa de Conversión': `${report.metrics.conversionRate.toFixed(2)}%`,
            'ROI': `${report.metrics.roi.toFixed(2)}x`
          }
        }
      })

      logger.info('Notificación de desactivación enviada', {
        campaignId: campaign.id,
        campaignName: campaign.name,
        service: 'NotificationService'
      })
    } catch (error) {
      // No lanzar error si la notificación falla - es un servicio auxiliar
      logger.error('Error al enviar notificación de desactivación', {
        campaignId: campaign.id,
        campaignName: campaign.name,
        service: 'NotificationService',
        error: error instanceof Error ? error.message : 'Error desconocido'
      })
    }
  }

  /**
   * Envía notificación cuando ocurre un error en una operación de campaña
   * 
   * Notifica al equipo sobre errores críticos que requieren atención,
   * como fallos en la aplicación o remoción de descuentos.
   * 
   * @param campaign - Campaña donde ocurrió el error
   * @param error - Error que ocurrió
   * @param operation - Operación que falló
   */
  async sendCampaignError(
    campaign: Campaign,
    error: Error,
    operation: 'activation' | 'deactivation' | 'discount_application' | 'discount_removal'
  ): Promise<void> {
    try {
      const operationNames = {
        activation: 'Activación',
        deactivation: 'Desactivación',
        discount_application: 'Aplicación de Descuentos',
        discount_removal: 'Remoción de Descuentos'
      }

      const data: CampaignErrorData = {
        campaignId: campaign.id,
        campaignName: campaign.name,
        operation,
        errorMessage: error.message,
        errorStack: error.stack,
        timestamp: new Date()
      }

      // Por ahora, usar el endpoint genérico de order-confirmation
      await this.client.post('/api/notifications/order-confirmation', {
        recipient: 'admin@technovastore.com',
        subject: `🚨 Error en Campaña: ${campaign.name}`,
        data: {
          title: `Error en ${operationNames[operation]}`,
          message: `Ha ocurrido un error al procesar la campaña "${campaign.name}".`,
          details: {
            'ID de Campaña': campaign.id,
            'Nombre': campaign.name,
            'Operación': operationNames[operation],
            'Error': error.message,
            'Timestamp': new Date().toISOString(),
            'Stack Trace': error.stack?.substring(0, 500) || 'No disponible'
          }
        }
      })

      logger.info('Notificación de error enviada', {
        campaignId: campaign.id,
        campaignName: campaign.name,
        service: 'NotificationService'
      })
    } catch (notificationError) {
      // No lanzar error si la notificación falla - es un servicio auxiliar
      logger.error('Error al enviar notificación de error', {
        campaignId: campaign.id,
        campaignName: campaign.name,
        service: 'NotificationService',
        error: notificationError instanceof Error ? notificationError.message : 'Error desconocido'
      })
    }
  }

  /**
   * Verifica si el Notification Service está disponible
   * 
   * @returns true si el servicio responde correctamente
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health')
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Envía notificación de promoción a todos los usuarios activos
   * 
   * Crea una notificación en la base de datos para que aparezca
   * en el dashboard de cada usuario cuando hay una nueva promoción.
   * 
   * @param campaign - Campaña/promoción activa
   * @param userIds - Lista de IDs de usuarios a notificar
   */
  async notifyUsersAboutPromotion(
    campaign: Campaign,
    userIds: string[]
  ): Promise<void> {
    const discountText = this.getDiscountText(campaign)
    
    for (const userId of userIds) {
      try {
        await this.createUserNotification({
          user_id: userId,
          type: 'promotion',
          title: `🎉 ${campaign.name}`,
          message: `¡Nueva promoción disponible! ${discountText}. Válida hasta el ${campaign.endDate.toLocaleDateString('es-ES')}.`,
          action_url: `/ofertas?campaign=${campaign.slug}`
        })
      } catch (error) {
        logger.error('Error notificando usuario sobre promoción', {
          userId,
          campaignId: campaign.id,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }

    logger.info('Notificación de promoción enviada a usuarios', {
      campaignId: campaign.id,
      campaignName: campaign.name,
      usersNotified: userIds.length,
      service: 'NotificationService'
    })
  }

  /**
   * Envía notificación de promoción a un usuario específico
   */
  async notifyUserAboutPromotion(
    userId: string,
    campaign: Campaign
  ): Promise<void> {
    const discountText = this.getDiscountText(campaign)
    
    await this.createUserNotification({
      user_id: userId,
      type: 'promotion',
      title: `🎉 ${campaign.name}`,
      message: `¡Nueva promoción disponible! ${discountText}. Válida hasta el ${campaign.endDate.toLocaleDateString('es-ES')}.`,
      action_url: `/ofertas?campaign=${campaign.slug}`
    })
  }

  /**
   * Genera texto descriptivo del descuento
   */
  private getDiscountText(campaign: Campaign): string {
    const rules = campaign.discountRules
    // Verificar si hay descuento global
    if (rules.global) {
      if (rules.global.type === 'percentage') {
        return `${rules.global.value}% de descuento`
      } else if (rules.global.type === 'fixed') {
        return `${rules.global.value}€ de descuento`
      }
    }
    return 'Descuentos especiales'
  }

  /**
   * Crea una notificación de usuario en la base de datos
   */
  private async createUserNotification(data: {
    user_id: string
    type: 'order' | 'shipping' | 'payment' | 'system' | 'promotion'
    title: string
    message: string
    action_url?: string
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = new URL(config.notificationServiceUrl)
      const postData = JSON.stringify(data)

      const options: http.RequestOptions = {
        hostname: url.hostname,
        port: url.port || 3000,
        path: '/api/notifications/user',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 5000
      }

      const req = http.request(options, (res) => {
        let responseData = ''
        res.on('data', (chunk) => { responseData += chunk })
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve()
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`))
          }
        })
      })

      req.on('error', reject)
      req.on('timeout', () => {
        req.destroy()
        reject(new Error('Request timeout'))
      })

      req.write(postData)
      req.end()
    })
  }
}

// Exportar instancia singleton
export const notificationServiceClient = new NotificationServiceClient()
