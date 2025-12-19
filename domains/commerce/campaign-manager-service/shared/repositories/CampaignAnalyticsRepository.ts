/**
 * CampaignAnalyticsRepository - Repositorio para métricas de campañas
 * 
 * Implementa el patrón Repository para abstraer el acceso a datos de analytics
 * de campañas promocionales.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

import { v4 as uuidv4 } from 'uuid'
import { database } from '../utils/database'
import { logger } from '../utils/logger'
import { CampaignAnalytics } from '../models/CampaignAnalytics'
import {
  CampaignAnalytics as ICampaignAnalytics,
  CreateAnalyticsData,
  AggregatedMetrics
} from '../types'

/**
 * Interfaz del repositorio de analytics de campañas
 */
export interface ICampaignAnalyticsRepository {
  create(data: CreateAnalyticsData): Promise<CampaignAnalytics>
  findByCampaignId(campaignId: string): Promise<CampaignAnalytics[]>
  findByDate(campaignId: string, date: Date): Promise<CampaignAnalytics | null>
  updateMetrics(campaignId: string, date: Date, metrics: Partial<{
    views: number
    clicks: number
    conversions: number
    revenue: number
  }>): Promise<CampaignAnalytics>
  getAggregatedMetrics(campaignId: string): Promise<AggregatedMetrics>
  incrementMetric(campaignId: string, date: Date, metric: 'views' | 'clicks' | 'conversions', amount?: number): Promise<void>
  addRevenue(campaignId: string, date: Date, amount: number): Promise<void>
}

/**
 * Implementación del repositorio de analytics con PostgreSQL
 */
export class CampaignAnalyticsRepository implements ICampaignAnalyticsRepository {
  /**
   * Crea un nuevo registro de analytics
   * 
   * @param data - Datos de analytics
   * @returns Analytics creado
   */
  async create(data: CreateAnalyticsData): Promise<CampaignAnalytics> {
    const id = uuidv4()

    const query = `
      INSERT INTO campaign_analytics (
        id, campaign_id, date, views, clicks, conversions, revenue
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7
      )
      RETURNING *
    `

    const params = [
      id,
      data.campaignId,
      data.date,
      data.views || 0,
      data.clicks || 0,
      data.conversions || 0,
      data.revenue || 0
    ]

    try {
      const result = await database.query(query, params)
      const analytics = this.mapRowToAnalytics(result.rows[0])

      logger.debug('Analytics creado', {
        id,
        campaignId: data.campaignId,
        date: data.date
      })

      return analytics
    } catch (error) {
      logger.error('Error al crear analytics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        data
      })
      throw error
    }
  }

  /**
   * Obtiene todos los registros de analytics de una campaña
   * 
   * @param campaignId - ID de la campaña
   * @returns Lista de analytics ordenados por fecha
   */
  async findByCampaignId(campaignId: string): Promise<CampaignAnalytics[]> {
    const query = `
      SELECT * FROM campaign_analytics 
      WHERE campaign_id = $1
      ORDER BY date ASC
    `

    try {
      const result = await database.query(query, [campaignId])
      return result.rows.map(row => this.mapRowToAnalytics(row))
    } catch (error) {
      logger.error('Error al obtener analytics por campaña', {
        error: error instanceof Error ? error.message : 'Unknown error',
        campaignId
      })
      throw error
    }
  }

  /**
   * Obtiene el registro de analytics de una fecha específica
   * 
   * @param campaignId - ID de la campaña
   * @param date - Fecha a buscar
   * @returns Analytics o null
   */
  async findByDate(campaignId: string, date: Date): Promise<CampaignAnalytics | null> {
    // Normalizar la fecha a inicio del día
    const normalizedDate = new Date(date)
    normalizedDate.setHours(0, 0, 0, 0)

    const query = `
      SELECT * FROM campaign_analytics 
      WHERE campaign_id = $1 AND DATE(date) = DATE($2)
    `

    try {
      const result = await database.query(query, [campaignId, normalizedDate])

      if (result.rows.length === 0) {
        return null
      }

      return this.mapRowToAnalytics(result.rows[0])
    } catch (error) {
      logger.error('Error al obtener analytics por fecha', {
        error: error instanceof Error ? error.message : 'Unknown error',
        campaignId,
        date
      })
      throw error
    }
  }

  /**
   * Actualiza las métricas de un día específico
   * 
   * Requirement 9.1-9.4: Registrar y calcular métricas de campaña
   * 
   * @param campaignId - ID de la campaña
   * @param date - Fecha de las métricas
   * @param metrics - Métricas a actualizar
   * @returns Analytics actualizado
   */
  async updateMetrics(
    campaignId: string,
    date: Date,
    metrics: Partial<{
      views: number
      clicks: number
      conversions: number
      revenue: number
    }>
  ): Promise<CampaignAnalytics> {
    // Normalizar la fecha
    const normalizedDate = new Date(date)
    normalizedDate.setHours(0, 0, 0, 0)

    // Verificar si existe el registro
    const existing = await this.findByDate(campaignId, normalizedDate)

    if (!existing) {
      // Crear nuevo registro si no existe
      return this.create({
        campaignId,
        date: normalizedDate,
        ...metrics
      })
    }

    // Actualizar registro existente
    const updates: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (metrics.views !== undefined) {
      updates.push(`views = $${paramIndex++}`)
      params.push(metrics.views)
    }

    if (metrics.clicks !== undefined) {
      updates.push(`clicks = $${paramIndex++}`)
      params.push(metrics.clicks)
    }

    if (metrics.conversions !== undefined) {
      updates.push(`conversions = $${paramIndex++}`)
      params.push(metrics.conversions)
    }

    if (metrics.revenue !== undefined) {
      updates.push(`revenue = $${paramIndex++}`)
      params.push(metrics.revenue)
    }

    if (updates.length === 0) {
      return existing
    }

    params.push(campaignId, normalizedDate)

    const query = `
      UPDATE campaign_analytics 
      SET ${updates.join(', ')}
      WHERE campaign_id = $${paramIndex++} AND DATE(date) = DATE($${paramIndex})
      RETURNING *
    `

    try {
      const result = await database.query(query, params)
      return this.mapRowToAnalytics(result.rows[0])
    } catch (error) {
      logger.error('Error al actualizar métricas', {
        error: error instanceof Error ? error.message : 'Unknown error',
        campaignId,
        date,
        metrics
      })
      throw error
    }
  }

  /**
   * Obtiene métricas agregadas de una campaña
   * 
   * Requirement 9.1: Número de productos con descuento
   * Requirement 9.2: Descuento promedio
   * Requirement 9.3: Unidades vendidas
   * Requirement 9.4: Ingresos generados
   * 
   * @param campaignId - ID de la campaña
   * @returns Métricas agregadas
   */
  async getAggregatedMetrics(campaignId: string): Promise<AggregatedMetrics> {
    // Obtener métricas de analytics
    const analyticsQuery = `
      SELECT 
        COALESCE(SUM(views), 0) as total_views,
        COALESCE(SUM(clicks), 0) as total_clicks,
        COALESCE(SUM(conversions), 0) as total_conversions,
        COALESCE(SUM(revenue), 0) as total_revenue
      FROM campaign_analytics 
      WHERE campaign_id = $1
    `

    // Obtener métricas de productos
    const productsQuery = `
      SELECT 
        COUNT(*) as products_with_discount,
        COALESCE(AVG(discount_percentage), 0) as average_discount,
        COALESCE(SUM(discount_amount * units_sold), 0) as total_discount_given
      FROM campaign_products 
      WHERE campaign_id = $1
    `

    try {
      const [analyticsResult, productsResult] = await Promise.all([
        database.query(analyticsQuery, [campaignId]),
        database.query(productsQuery, [campaignId])
      ])

      const analytics = analyticsResult.rows[0]
      const products = productsResult.rows[0]

      const totalClicks = parseInt(analytics.total_clicks, 10)
      const totalConversions = parseInt(analytics.total_conversions, 10)
      const totalRevenue = parseFloat(analytics.total_revenue)
      const totalDiscountGiven = parseFloat(products.total_discount_given)

      // Calcular tasa de conversión
      const conversionRate = totalClicks > 0 
        ? (totalConversions / totalClicks) * 100 
        : 0

      // Calcular ROI: (Ingresos - Descuentos) / Descuentos * 100
      const roi = totalDiscountGiven > 0 
        ? ((totalRevenue - totalDiscountGiven) / totalDiscountGiven) * 100 
        : 0

      return {
        productsWithDiscount: parseInt(products.products_with_discount, 10),
        averageDiscountPercentage: parseFloat(products.average_discount),
        totalViews: parseInt(analytics.total_views, 10),
        totalClicks,
        totalConversions,
        totalRevenue,
        conversionRate,
        roi
      }
    } catch (error) {
      logger.error('Error al obtener métricas agregadas', {
        error: error instanceof Error ? error.message : 'Unknown error',
        campaignId
      })
      throw error
    }
  }

  /**
   * Incrementa una métrica específica
   * 
   * @param campaignId - ID de la campaña
   * @param date - Fecha
   * @param metric - Métrica a incrementar
   * @param amount - Cantidad a incrementar (por defecto 1)
   */
  async incrementMetric(
    campaignId: string,
    date: Date,
    metric: 'views' | 'clicks' | 'conversions',
    amount: number = 1
  ): Promise<void> {
    const normalizedDate = new Date(date)
    normalizedDate.setHours(0, 0, 0, 0)

    // Usar UPSERT para crear o actualizar
    const query = `
      INSERT INTO campaign_analytics (id, campaign_id, date, ${metric})
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (campaign_id, date) 
      DO UPDATE SET ${metric} = campaign_analytics.${metric} + $4
    `

    try {
      await database.query(query, [uuidv4(), campaignId, normalizedDate, amount])
    } catch (error) {
      // Si falla el UPSERT, intentar actualización manual
      const existing = await this.findByDate(campaignId, normalizedDate)
      
      if (existing) {
        const currentValue = existing[metric]
        await this.updateMetrics(campaignId, normalizedDate, {
          [metric]: currentValue + amount
        })
      } else {
        await this.create({
          campaignId,
          date: normalizedDate,
          [metric]: amount
        })
      }
    }
  }

  /**
   * Añade ingresos a un día específico
   * 
   * @param campaignId - ID de la campaña
   * @param date - Fecha
   * @param amount - Cantidad de ingresos a añadir
   */
  async addRevenue(campaignId: string, date: Date, amount: number): Promise<void> {
    const normalizedDate = new Date(date)
    normalizedDate.setHours(0, 0, 0, 0)

    const query = `
      INSERT INTO campaign_analytics (id, campaign_id, date, revenue)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (campaign_id, date) 
      DO UPDATE SET revenue = campaign_analytics.revenue + $4
    `

    try {
      await database.query(query, [uuidv4(), campaignId, normalizedDate, amount])
    } catch (error) {
      // Fallback manual
      const existing = await this.findByDate(campaignId, normalizedDate)
      
      if (existing) {
        await this.updateMetrics(campaignId, normalizedDate, {
          revenue: existing.revenue + amount
        })
      } else {
        await this.create({
          campaignId,
          date: normalizedDate,
          revenue: amount
        })
      }
    }
  }

  /**
   * Obtiene métricas de un rango de fechas
   * 
   * @param campaignId - ID de la campaña
   * @param startDate - Fecha de inicio
   * @param endDate - Fecha de fin
   * @returns Lista de analytics en el rango
   */
  async findByDateRange(
    campaignId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CampaignAnalytics[]> {
    const query = `
      SELECT * FROM campaign_analytics 
      WHERE campaign_id = $1 
        AND date >= $2 
        AND date <= $3
      ORDER BY date ASC
    `

    try {
      const result = await database.query(query, [campaignId, startDate, endDate])
      return result.rows.map(row => this.mapRowToAnalytics(row))
    } catch (error) {
      logger.error('Error al obtener analytics por rango de fechas', {
        error: error instanceof Error ? error.message : 'Unknown error',
        campaignId,
        startDate,
        endDate
      })
      throw error
    }
  }

  /**
   * Elimina todos los registros de analytics de una campaña
   * 
   * @param campaignId - ID de la campaña
   * @returns Número de registros eliminados
   */
  async deleteByCampaignId(campaignId: string): Promise<number> {
    const query = 'DELETE FROM campaign_analytics WHERE campaign_id = $1'

    try {
      const result = await database.query(query, [campaignId])
      return result.rowCount || 0
    } catch (error) {
      logger.error('Error al eliminar analytics de campaña', {
        error: error instanceof Error ? error.message : 'Unknown error',
        campaignId
      })
      throw error
    }
  }

  /**
   * Mapea una fila de la base de datos a un objeto CampaignAnalytics
   * 
   * @param row - Fila de la base de datos
   * @returns Instancia de CampaignAnalytics
   */
  private mapRowToAnalytics(row: any): CampaignAnalytics {
    return CampaignAnalytics.fromDatabase({
      id: row.id,
      campaignId: row.campaign_id,
      date: new Date(row.date),
      views: parseInt(row.views, 10),
      clicks: parseInt(row.clicks, 10),
      conversions: parseInt(row.conversions, 10),
      revenue: parseFloat(row.revenue)
    })
  }
}

// Exportar instancia singleton
export const campaignAnalyticsRepository = new CampaignAnalyticsRepository()
