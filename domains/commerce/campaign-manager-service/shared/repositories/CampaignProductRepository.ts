/**
 * CampaignProductRepository - Repositorio para productos en campaña
 * 
 * Implementa el patrón Repository para abstraer el acceso a datos de productos
 * con descuento aplicado durante una campaña.
 * 
 * Requirements: 3.5, 4.4
 */

import { v4 as uuidv4 } from 'uuid'
import { database } from '../utils/database'
import { logger } from '../utils/logger'
import { CampaignProduct } from '../models/CampaignProduct'
import {
  CampaignProduct as ICampaignProduct,
  CreateCampaignProductData
} from '../types'

/**
 * Interfaz del repositorio de productos en campaña
 */
export interface ICampaignProductRepository {
  create(data: CreateCampaignProductData): Promise<CampaignProduct>
  createBatch(data: CreateCampaignProductData[]): Promise<CampaignProduct[]>
  findByCampaignId(campaignId: string): Promise<CampaignProduct[]>
  findByProductId(productId: string): Promise<CampaignProduct[]>
  findByCampaignAndProduct(campaignId: string, productId: string): Promise<CampaignProduct | null>
  deleteByCampaignId(campaignId: string): Promise<number>
  countByCampaignId(campaignId: string): Promise<number>
  updateUnitsSold(id: string, unitsSold: number): Promise<CampaignProduct>
}

/**
 * Implementación del repositorio de productos en campaña con PostgreSQL
 */
export class CampaignProductRepository implements ICampaignProductRepository {
  /**
   * Crea un nuevo registro de producto en campaña
   * 
   * Requirement 3.5: Registrar en campaign_products cada producto con descuento
   * 
   * @param data - Datos del producto en campaña
   * @returns Producto en campaña creado
   */
  async create(data: CreateCampaignProductData): Promise<CampaignProduct> {
    const id = uuidv4()
    const now = new Date()

    const query = `
      INSERT INTO campaign_products (
        id, campaign_id, product_id, original_price, campaign_price,
        discount_percentage, discount_amount, campaign_stock, units_sold, applied_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      )
      RETURNING *
    `

    const params = [
      id,
      data.campaignId,
      data.productId,
      data.originalPrice,
      data.campaignPrice,
      data.discountPercentage,
      data.discountAmount,
      data.campaignStock || null,
      0, // units_sold inicial
      now
    ]

    try {
      const result = await database.query(query, params)
      const campaignProduct = this.mapRowToCampaignProduct(result.rows[0])

      logger.debug('Producto en campaña creado', {
        id,
        campaignId: data.campaignId,
        productId: data.productId,
        discountPercentage: data.discountPercentage
      })

      return campaignProduct
    } catch (error) {
      logger.error('Error al crear producto en campaña', {
        error: error instanceof Error ? error.message : 'Unknown error',
        data
      })
      throw error
    }
  }

  /**
   * Crea múltiples registros de productos en campaña en una sola transacción
   * 
   * @param data - Array de datos de productos en campaña
   * @returns Array de productos en campaña creados
   */
  async createBatch(data: CreateCampaignProductData[]): Promise<CampaignProduct[]> {
    if (data.length === 0) {
      return []
    }

    const now = new Date()
    const results: CampaignProduct[] = []

    try {
      await database.transaction(async (client) => {
        for (const item of data) {
          const id = uuidv4()

          const query = `
            INSERT INTO campaign_products (
              id, campaign_id, product_id, original_price, campaign_price,
              discount_percentage, discount_amount, campaign_stock, units_sold, applied_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
            )
            RETURNING *
          `

          const params = [
            id,
            item.campaignId,
            item.productId,
            item.originalPrice,
            item.campaignPrice,
            item.discountPercentage,
            item.discountAmount,
            item.campaignStock || null,
            0,
            now
          ]

          const result = await client.query(query, params)
          results.push(this.mapRowToCampaignProduct(result.rows[0]))
        }
      })

      logger.info('Lote de productos en campaña creado', {
        count: results.length,
        campaignId: data[0]?.campaignId
      })

      return results
    } catch (error) {
      logger.error('Error al crear lote de productos en campaña', {
        error: error instanceof Error ? error.message : 'Unknown error',
        count: data.length
      })
      throw error
    }
  }

  /**
   * Obtiene todos los productos de una campaña
   * 
   * @param campaignId - ID de la campaña
   * @returns Lista de productos en campaña
   */
  async findByCampaignId(campaignId: string): Promise<CampaignProduct[]> {
    const query = `
      SELECT * FROM campaign_products 
      WHERE campaign_id = $1
      ORDER BY applied_at DESC
    `

    try {
      const result = await database.query(query, [campaignId])
      return result.rows.map(row => this.mapRowToCampaignProduct(row))
    } catch (error) {
      logger.error('Error al obtener productos por campaña', {
        error: error instanceof Error ? error.message : 'Unknown error',
        campaignId
      })
      throw error
    }
  }

  /**
   * Obtiene todas las campañas en las que participa un producto
   * 
   * @param productId - ID del producto
   * @returns Lista de registros de producto en campaña
   */
  async findByProductId(productId: string): Promise<CampaignProduct[]> {
    const query = `
      SELECT * FROM campaign_products 
      WHERE product_id = $1
      ORDER BY applied_at DESC
    `

    try {
      const result = await database.query(query, [productId])
      return result.rows.map(row => this.mapRowToCampaignProduct(row))
    } catch (error) {
      logger.error('Error al obtener campañas por producto', {
        error: error instanceof Error ? error.message : 'Unknown error',
        productId
      })
      throw error
    }
  }

  /**
   * Busca un registro específico de producto en campaña
   * 
   * @param campaignId - ID de la campaña
   * @param productId - ID del producto
   * @returns Producto en campaña o null
   */
  async findByCampaignAndProduct(
    campaignId: string,
    productId: string
  ): Promise<CampaignProduct | null> {
    const query = `
      SELECT * FROM campaign_products 
      WHERE campaign_id = $1 AND product_id = $2
    `

    try {
      const result = await database.query(query, [campaignId, productId])

      if (result.rows.length === 0) {
        return null
      }

      return this.mapRowToCampaignProduct(result.rows[0])
    } catch (error) {
      logger.error('Error al buscar producto en campaña', {
        error: error instanceof Error ? error.message : 'Unknown error',
        campaignId,
        productId
      })
      throw error
    }
  }

  /**
   * Elimina todos los registros de productos de una campaña
   * 
   * Requirement 4.4: Eliminar registros de campaign_products asociados
   * 
   * @param campaignId - ID de la campaña
   * @returns Número de registros eliminados
   */
  async deleteByCampaignId(campaignId: string): Promise<number> {
    const query = 'DELETE FROM campaign_products WHERE campaign_id = $1'

    try {
      const result = await database.query(query, [campaignId])
      const deletedCount = result.rowCount || 0

      logger.info('Productos de campaña eliminados', {
        campaignId,
        deletedCount
      })

      return deletedCount
    } catch (error) {
      logger.error('Error al eliminar productos de campaña', {
        error: error instanceof Error ? error.message : 'Unknown error',
        campaignId
      })
      throw error
    }
  }

  /**
   * Cuenta el número de productos en una campaña
   * 
   * @param campaignId - ID de la campaña
   * @returns Número de productos
   */
  async countByCampaignId(campaignId: string): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM campaign_products WHERE campaign_id = $1'

    try {
      const result = await database.query(query, [campaignId])
      return parseInt(result.rows[0].count, 10)
    } catch (error) {
      logger.error('Error al contar productos de campaña', {
        error: error instanceof Error ? error.message : 'Unknown error',
        campaignId
      })
      throw error
    }
  }

  /**
   * Actualiza las unidades vendidas de un producto en campaña
   * 
   * @param id - ID del registro
   * @param unitsSold - Nuevas unidades vendidas
   * @returns Producto en campaña actualizado
   */
  async updateUnitsSold(id: string, unitsSold: number): Promise<CampaignProduct> {
    const query = `
      UPDATE campaign_products 
      SET units_sold = $1
      WHERE id = $2
      RETURNING *
    `

    try {
      const result = await database.query(query, [unitsSold, id])

      if (result.rows.length === 0) {
        throw new Error(`Producto en campaña con ID ${id} no encontrado`)
      }

      return this.mapRowToCampaignProduct(result.rows[0])
    } catch (error) {
      logger.error('Error al actualizar unidades vendidas', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id,
        unitsSold
      })
      throw error
    }
  }

  /**
   * Obtiene estadísticas agregadas de productos en una campaña
   * 
   * @param campaignId - ID de la campaña
   * @returns Estadísticas agregadas
   */
  async getStatsByCampaignId(campaignId: string): Promise<{
    totalProducts: number
    totalUnitsSold: number
    totalRevenue: number
    averageDiscount: number
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_products,
        COALESCE(SUM(units_sold), 0) as total_units_sold,
        COALESCE(SUM(campaign_price * units_sold), 0) as total_revenue,
        COALESCE(AVG(discount_percentage), 0) as average_discount
      FROM campaign_products 
      WHERE campaign_id = $1
    `

    try {
      const result = await database.query(query, [campaignId])
      const row = result.rows[0]

      return {
        totalProducts: parseInt(row.total_products, 10),
        totalUnitsSold: parseInt(row.total_units_sold, 10),
        totalRevenue: parseFloat(row.total_revenue),
        averageDiscount: parseFloat(row.average_discount)
      }
    } catch (error) {
      logger.error('Error al obtener estadísticas de campaña', {
        error: error instanceof Error ? error.message : 'Unknown error',
        campaignId
      })
      throw error
    }
  }

  /**
   * Mapea una fila de la base de datos a un objeto CampaignProduct
   * 
   * @param row - Fila de la base de datos
   * @returns Instancia de CampaignProduct
   */
  private mapRowToCampaignProduct(row: any): CampaignProduct {
    return CampaignProduct.fromDatabase({
      id: row.id,
      campaignId: row.campaign_id,
      productId: row.product_id,
      originalPrice: parseFloat(row.original_price),
      campaignPrice: parseFloat(row.campaign_price),
      discountPercentage: parseFloat(row.discount_percentage),
      discountAmount: parseFloat(row.discount_amount),
      campaignStock: row.campaign_stock ? parseInt(row.campaign_stock, 10) : undefined,
      unitsSold: parseInt(row.units_sold, 10),
      appliedAt: new Date(row.applied_at)
    })
  }
}

// Exportar instancia singleton
export const campaignProductRepository = new CampaignProductRepository()
