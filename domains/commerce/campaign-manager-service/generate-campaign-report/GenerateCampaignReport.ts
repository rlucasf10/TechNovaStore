/**
 * GenerateCampaignReport - Caso de uso para generar reporte final de campaña
 * 
 * Genera un reporte completo con todas las métricas de una campaña,
 * incluyendo productos más vendidos, métricas diarias y resumen ejecutivo.
 * Este reporte se genera típicamente cuando una campaña finaliza.
 * 
 * Requirements: 4.6, 9.6
 */

import { GetCampaignAnalytics, GetCampaignAnalyticsOutput } from '../get-campaign-analytics/GetCampaignAnalytics'
import { CampaignRepository } from '../shared/repositories/CampaignRepository'
import { CampaignProductRepository } from '../shared/repositories/CampaignProductRepository'
import { CampaignAnalyticsRepository } from '../shared/repositories/CampaignAnalyticsRepository'
import { logger } from '../shared/utils/logger'
import { CampaignReport } from '../shared/types'

/**
 * Input para generar reporte de campaña
 */
export interface GenerateCampaignReportInput {
  /** ID de la campaña */
  campaignId: string
}

/**
 * Output con el reporte completo de la campaña
 */
export interface GenerateCampaignReportOutput {
  /** Reporte completo de la campaña */
  report: CampaignReport
  
  /** Resumen ejecutivo en texto */
  executiveSummary: string
  
  /** Fecha de generación del reporte */
  generatedAt: Date
}

/**
 * Caso de uso GenerateCampaignReport
 * 
 * Genera un reporte final completo de una campaña con todas sus métricas,
 * productos más vendidos y un resumen ejecutivo en texto.
 * 
 * Requirement 4.6: Generar reporte final antes de remover descuentos
 * Requirement 9.6: Generar reporte final con todas las métricas
 */
export class GenerateCampaignReport {
  private getCampaignAnalytics: GetCampaignAnalytics

  constructor(
    private campaignRepository: CampaignRepository,
    private campaignProductRepository: CampaignProductRepository,
    private campaignAnalyticsRepository: CampaignAnalyticsRepository
  ) {
    this.getCampaignAnalytics = new GetCampaignAnalytics(
      campaignRepository,
      campaignProductRepository,
      campaignAnalyticsRepository
    )
  }

  /**
   * Ejecuta el caso de uso
   * 
   * @param input - Datos de entrada con el ID de la campaña
   * @returns Reporte completo de la campaña
   * @throws Error si la campaña no existe
   */
  async execute(input: GenerateCampaignReportInput): Promise<GenerateCampaignReportOutput> {
    const { campaignId } = input

    logger.info('Generando reporte de campaña', { campaignId })

    // 1. Obtener la campaña
    const campaign = await this.campaignRepository.findById(campaignId)
    
    if (!campaign) {
      logger.error('Campaña no encontrada', { campaignId })
      throw new Error(`Campaña con ID ${campaignId} no encontrada`)
    }

    // 2. Obtener analytics completos usando GetCampaignAnalytics
    const analytics = await this.getCampaignAnalytics.execute({ campaignId })

    // 3. Obtener información detallada de productos más vendidos
    const topProductsWithDetails = await this.getTopProductsWithDetails(analytics.topProducts)

    // 4. Construir el reporte
    const report: CampaignReport = {
      campaign: campaign.toJSON(),
      metrics: {
        productsWithDiscount: analytics.metrics.productsWithDiscount,
        averageDiscountPercentage: analytics.metrics.averageDiscountPercentage,
        totalViews: analytics.metrics.totalViews,
        totalClicks: analytics.metrics.totalClicks,
        totalConversions: analytics.metrics.totalConversions,
        totalRevenue: analytics.metrics.revenue,
        conversionRate: analytics.metrics.conversionRate,
        roi: analytics.metrics.roi
      },
      topProducts: topProductsWithDetails,
      dailyMetrics: analytics.dailyMetrics.map(day => ({
        id: '', // No necesario para el reporte
        campaignId,
        date: day.date,
        views: day.views,
        clicks: day.clicks,
        conversions: day.conversions,
        revenue: day.revenue
      }))
    }

    // 5. Generar resumen ejecutivo
    const executiveSummary = this.generateExecutiveSummary(campaign.name, analytics)

    const output: GenerateCampaignReportOutput = {
      report,
      executiveSummary,
      generatedAt: new Date()
    }

    logger.info('Reporte de campaña generado exitosamente', {
      campaignId,
      campaignName: campaign.name,
      productsWithDiscount: analytics.metrics.productsWithDiscount,
      totalRevenue: analytics.metrics.revenue,
      roi: analytics.metrics.roi
    })

    return output
  }

  /**
   * Obtiene información detallada de los productos más vendidos
   * 
   * @param topProducts - Lista de productos más vendidos
   * @returns Lista con información detallada de productos
   */
  private async getTopProductsWithDetails(
    topProducts: Array<{
      productId: string
      unitsSold: number
      revenue: number
      discountPercentage: number
    }>
  ): Promise<Array<{
    productId: string
    productName: string
    unitsSold: number
    revenue: number
  }>> {
    // Por ahora retornamos los productos con un nombre genérico
    // En una implementación completa, se consultaría el Product Service
    // para obtener los nombres reales de los productos
    return topProducts.map(product => ({
      productId: product.productId,
      productName: `Producto ${product.productId}`, // Placeholder
      unitsSold: product.unitsSold,
      revenue: product.revenue
    }))
  }

  /**
   * Genera un resumen ejecutivo en texto de la campaña
   * 
   * @param campaignName - Nombre de la campaña
   * @param analytics - Analytics de la campaña
   * @returns Resumen ejecutivo en texto
   */
  private generateExecutiveSummary(
    campaignName: string,
    analytics: GetCampaignAnalyticsOutput
  ): string {
    const {
      productsWithDiscount,
      averageDiscountPercentage,
      unitsSold,
      revenue,
      totalViews,
      totalClicks,
      totalConversions,
      conversionRate,
      roi,
      totalDiscountGiven
    } = analytics.metrics

    const duration = this.calculateDuration(analytics.startDate, analytics.endDate)
    const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0

    const summary = `
REPORTE EJECUTIVO - CAMPAÑA: ${campaignName}
${'='.repeat(60)}

PERÍODO DE LA CAMPAÑA
Fecha de inicio: ${this.formatDate(analytics.startDate)}
Fecha de fin: ${this.formatDate(analytics.endDate)}
Duración: ${duration} días
Estado: ${analytics.isActive ? 'Activa' : 'Finalizada'}

RESUMEN DE PRODUCTOS
Productos con descuento: ${productsWithDiscount}
Descuento promedio aplicado: ${averageDiscountPercentage.toFixed(2)}%
Descuento total otorgado: €${totalDiscountGiven.toFixed(2)}

MÉTRICAS DE ENGAGEMENT
Visualizaciones totales: ${totalViews.toLocaleString()}
Clics totales: ${totalClicks.toLocaleString()}
Tasa de clics (CTR): ${ctr.toFixed(2)}%

MÉTRICAS DE VENTAS
Unidades vendidas: ${unitsSold.toLocaleString()}
Conversiones totales: ${totalConversions.toLocaleString()}
Tasa de conversión: ${conversionRate.toFixed(2)}%
Ingresos generados: €${revenue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

RETORNO DE INVERSIÓN (ROI)
ROI: ${roi.toFixed(2)}%
Interpretación: ${this.interpretROI(roi)}

PRODUCTOS MÁS VENDIDOS
${this.formatTopProducts(analytics.topProducts)}

CONCLUSIÓN
${this.generateConclusion(analytics)}

${'='.repeat(60)}
Reporte generado el: ${this.formatDate(new Date())}
    `.trim()

    return summary
  }

  /**
   * Calcula la duración de la campaña en días
   * 
   * @param startDate - Fecha de inicio
   * @param endDate - Fecha de fin
   * @returns Duración en días
   */
  private calculateDuration(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  /**
   * Formatea una fecha en formato legible
   * 
   * @param date - Fecha a formatear
   * @returns Fecha formateada
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Interpreta el ROI y genera un mensaje descriptivo
   * 
   * @param roi - ROI en porcentaje
   * @returns Interpretación del ROI
   */
  private interpretROI(roi: number): string {
    if (roi > 200) {
      return 'Excelente - La campaña generó más del triple de los descuentos otorgados'
    } else if (roi > 100) {
      return 'Muy bueno - La campaña generó más del doble de los descuentos otorgados'
    } else if (roi > 50) {
      return 'Bueno - La campaña fue rentable con un retorno positivo'
    } else if (roi > 0) {
      return 'Moderado - La campaña fue rentable pero con margen ajustado'
    } else if (roi === 0) {
      return 'Punto de equilibrio - Los ingresos igualaron los descuentos otorgados'
    } else {
      return 'Negativo - Los descuentos otorgados superaron los ingresos generados'
    }
  }

  /**
   * Formatea la lista de productos más vendidos
   * 
   * @param topProducts - Lista de productos más vendidos
   * @returns Texto formateado con los productos
   */
  private formatTopProducts(
    topProducts: Array<{
      productId: string
      unitsSold: number
      revenue: number
      discountPercentage: number
    }>
  ): string {
    if (topProducts.length === 0) {
      return 'No se registraron ventas durante la campaña'
    }

    return topProducts
      .slice(0, 5) // Top 5 para el resumen
      .map((product, index) => {
        return `${index + 1}. Producto ${product.productId}
   - Unidades vendidas: ${product.unitsSold}
   - Ingresos: €${product.revenue.toFixed(2)}
   - Descuento aplicado: ${product.discountPercentage}%`
      })
      .join('\n\n')
  }

  /**
   * Genera una conclusión basada en las métricas
   * 
   * @param analytics - Analytics de la campaña
   * @returns Conclusión en texto
   */
  private generateConclusion(analytics: GetCampaignAnalyticsOutput): string {
    const { conversionRate, roi, unitsSold } = analytics.metrics

    const conclusions: string[] = []

    // Evaluar tasa de conversión
    if (conversionRate > 20) {
      conclusions.push('La tasa de conversión fue excelente, superando el 20%.')
    } else if (conversionRate > 10) {
      conclusions.push('La tasa de conversión fue buena, superando el 10%.')
    } else if (conversionRate > 5) {
      conclusions.push('La tasa de conversión fue moderada, en línea con el promedio del sector.')
    } else if (conversionRate > 0) {
      conclusions.push('La tasa de conversión fue baja, sugiriendo oportunidades de mejora.')
    } else {
      conclusions.push('No se registraron conversiones durante la campaña.')
    }

    // Evaluar ROI
    if (roi > 100) {
      conclusions.push('El ROI fue muy positivo, indicando una campaña altamente rentable.')
    } else if (roi > 0) {
      conclusions.push('El ROI fue positivo, la campaña generó beneficios.')
    } else if (roi === 0) {
      conclusions.push('La campaña alcanzó el punto de equilibrio.')
    } else {
      conclusions.push('El ROI fue negativo, sugiriendo revisar la estrategia de descuentos.')
    }

    // Evaluar volumen de ventas
    if (unitsSold > 1000) {
      conclusions.push('El volumen de ventas fue muy alto.')
    } else if (unitsSold > 100) {
      conclusions.push('El volumen de ventas fue satisfactorio.')
    } else if (unitsSold > 0) {
      conclusions.push('El volumen de ventas fue bajo.')
    }

    return conclusions.join(' ')
  }
}
