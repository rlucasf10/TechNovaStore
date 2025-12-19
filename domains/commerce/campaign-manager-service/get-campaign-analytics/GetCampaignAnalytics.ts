/**
 * GetCampaignAnalytics - Caso de uso para obtener analytics de una campaña
 * 
 * Calcula y retorna métricas completas de rendimiento de una campaña,
 * incluyendo productos con descuento, descuento promedio, unidades vendidas,
 * ingresos, tasa de conversión y ROI.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { CampaignRepository } from '../shared/repositories/CampaignRepository'
import { CampaignProductRepository } from '../shared/repositories/CampaignProductRepository'
import { CampaignAnalyticsRepository } from '../shared/repositories/CampaignAnalyticsRepository'
import { logger } from '../shared/utils/logger'
import { AggregatedMetrics, CampaignAnalytics } from '../shared/types'

/**
 * Input para obtener analytics de una campaña
 */
export interface GetCampaignAnalyticsInput {
  /** ID de la campaña */
  campaignId: string
}

/**
 * Output con las métricas de la campaña
 */
export interface GetCampaignAnalyticsOutput {
  /** ID de la campaña */
  campaignId: string
  
  /** Nombre de la campaña */
  campaignName: string
  
  /** Fecha de inicio de la campaña */
  startDate: Date
  
  /** Fecha de fin de la campaña */
  endDate: Date
  
  /** Indica si la campaña está activa */
  isActive: boolean
  
  /** Métricas agregadas de la campaña */
  metrics: {
    /** Requirement 9.1: Número de productos con descuento aplicado */
    productsWithDiscount: number
    
    /** Requirement 9.2: Descuento promedio aplicado en la campaña */
    averageDiscountPercentage: number
    
    /** Requirement 9.3: Número de unidades vendidas durante la campaña */
    unitsSold: number
    
    /** Requirement 9.4: Ingresos generados durante la campaña */
    revenue: number
    
    /** Total de visualizaciones */
    totalViews: number
    
    /** Total de clics */
    totalClicks: number
    
    /** Total de conversiones */
    totalConversions: number
    
    /** Requirement 9.5: Tasa de conversión comparada con el promedio */
    conversionRate: number
    
    /** Requirement 9.5: ROI (Return on Investment) de la campaña */
    roi: number
    
    /** Descuento total otorgado en euros */
    totalDiscountGiven: number
  }
  
  /** Métricas diarias de la campaña */
  dailyMetrics: Array<{
    date: Date
    views: number
    clicks: number
    conversions: number
    revenue: number
    conversionRate: number
  }>
  
  /** Productos más vendidos durante la campaña */
  topProducts: Array<{
    productId: string
    unitsSold: number
    revenue: number
    discountPercentage: number
  }>
}

/**
 * Caso de uso GetCampaignAnalytics
 * 
 * Obtiene y calcula todas las métricas de rendimiento de una campaña,
 * incluyendo métricas agregadas, métricas diarias y productos más vendidos.
 */
export class GetCampaignAnalytics {
  constructor(
    private campaignRepository: CampaignRepository,
    private campaignProductRepository: CampaignProductRepository,
    private campaignAnalyticsRepository: CampaignAnalyticsRepository
  ) {}

  /**
   * Ejecuta el caso de uso
   * 
   * @param input - Datos de entrada con el ID de la campaña
   * @returns Métricas completas de la campaña
   * @throws Error si la campaña no existe
   */
  async execute(input: GetCampaignAnalyticsInput): Promise<GetCampaignAnalyticsOutput> {
    const { campaignId } = input

    logger.info('Obteniendo analytics de campaña', { campaignId })

    // 1. Verificar que la campaña existe
    const campaign = await this.campaignRepository.findById(campaignId)
    
    if (!campaign) {
      logger.error('Campaña no encontrada', { campaignId })
      throw new Error(`Campaña con ID ${campaignId} no encontrada`)
    }

    // 2. Obtener métricas agregadas de analytics
    const aggregatedMetrics = await this.campaignAnalyticsRepository.getAggregatedMetrics(campaignId)

    // 3. Obtener estadísticas de productos
    const productStats = await this.campaignProductRepository.getStatsByCampaignId(campaignId)

    // 4. Obtener métricas diarias
    const dailyAnalytics = await this.campaignAnalyticsRepository.findByCampaignId(campaignId)

    // 5. Obtener productos más vendidos
    const topProducts = await this.getTopProducts(campaignId)

    // 6. Calcular descuento total otorgado
    const totalDiscountGiven = await this.calculateTotalDiscountGiven(campaignId)

    // 7. Calcular ROI: (Ingresos - Descuentos) / Descuentos * 100
    const roi = totalDiscountGiven > 0
      ? ((aggregatedMetrics.totalRevenue - totalDiscountGiven) / totalDiscountGiven) * 100
      : 0

    // 8. Formatear métricas diarias
    const formattedDailyMetrics = dailyAnalytics.map(day => ({
      date: day.date,
      views: day.views,
      clicks: day.clicks,
      conversions: day.conversions,
      revenue: day.revenue,
      conversionRate: day.clicks > 0 ? (day.conversions / day.clicks) * 100 : 0
    }))

    const output: GetCampaignAnalyticsOutput = {
      campaignId: campaign.id,
      campaignName: campaign.name,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      isActive: campaign.isActive,
      metrics: {
        productsWithDiscount: productStats.totalProducts,
        averageDiscountPercentage: productStats.averageDiscount,
        unitsSold: productStats.totalUnitsSold,
        revenue: aggregatedMetrics.totalRevenue,
        totalViews: aggregatedMetrics.totalViews,
        totalClicks: aggregatedMetrics.totalClicks,
        totalConversions: aggregatedMetrics.totalConversions,
        conversionRate: aggregatedMetrics.conversionRate,
        roi,
        totalDiscountGiven
      },
      dailyMetrics: formattedDailyMetrics,
      topProducts
    }

    logger.info('Analytics de campaña obtenidos exitosamente', {
      campaignId,
      productsWithDiscount: output.metrics.productsWithDiscount,
      revenue: output.metrics.revenue,
      roi: output.metrics.roi
    })

    return output
  }

  /**
   * Obtiene los productos más vendidos de una campaña
   * 
   * @param campaignId - ID de la campaña
   * @returns Lista de productos ordenados por unidades vendidas (descendente)
   */
  private async getTopProducts(campaignId: string): Promise<Array<{
    productId: string
    unitsSold: number
    revenue: number
    discountPercentage: number
  }>> {
    const products = await this.campaignProductRepository.findByCampaignId(campaignId)

    // Filtrar productos con ventas y ordenar por unidades vendidas
    const productsWithSales = products
      .filter(p => p.unitsSold > 0)
      .map(p => ({
        productId: p.productId,
        unitsSold: p.unitsSold,
        revenue: p.calculateRevenue(),
        discountPercentage: p.discountPercentage
      }))
      .sort((a, b) => b.unitsSold - a.unitsSold)

    // Retornar top 10
    return productsWithSales.slice(0, 10)
  }

  /**
   * Calcula el descuento total otorgado en la campaña
   * 
   * @param campaignId - ID de la campaña
   * @returns Descuento total en euros
   */
  private async calculateTotalDiscountGiven(campaignId: string): Promise<number> {
    const products = await this.campaignProductRepository.findByCampaignId(campaignId)

    return products.reduce((total, product) => {
      return total + product.calculateTotalDiscount()
    }, 0)
  }
}
