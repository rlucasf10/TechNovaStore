/**
 * CampaignRepository - Repositorio para gestión de campañas
 * 
 * Implementa el patrón Repository para abstraer el acceso a datos de campañas.
 * Proporciona operaciones CRUD y consultas especializadas.
 * 
 * Requirements: 1.1, 1.5, 5.2, 5.4
 */

import { PoolClient } from 'pg'
import { v4 as uuidv4 } from 'uuid'
import { database } from '../utils/database'
import { logger } from '../utils/logger'
import { Campaign } from '../models/Campaign'
import {
  Campaign as ICampaign,
  CreateCampaignData,
  CampaignFilters,
  DiscountRules,
  FrontendConfig
} from '../types'

/**
 * Interfaz del repositorio de campañas
 */
export interface ICampaignRepository {
  create(data: CreateCampaignData): Promise<Campaign>
  findById(id: string): Promise<Campaign | null>
  findBySlug(slug: string): Promise<Campaign | null>
  findByName(name: string): Promise<Campaign | null>
  findAll(filters?: CampaignFilters): Promise<Campaign[]>
  findActive(): Promise<Campaign[]>
  findPendingActivation(now: Date): Promise<Campaign[]>
  findPendingDeactivation(now: Date): Promise<Campaign[]>
  update(id: string, data: Partial<ICampaign>): Promise<Campaign>
  delete(id: string): Promise<void>
}

/**
 * Implementación del repositorio de campañas con PostgreSQL
 */
export class CampaignRepository implements ICampaignRepository {
  /**
   * Crea una nueva campaña en la base de datos
   * 
   * Requirement 1.1: Almacenar campaña con nombre, fechas, prioridad y reglas
   * 
   * @param data - Datos de la campaña a crear
   * @returns Campaña creada
   */
  async create(data: CreateCampaignData): Promise<Campaign> {
    const id = uuidv4()
    const now = new Date()

    const query = `
      INSERT INTO campaigns (
        id, name, slug, start_date, end_date, priority, is_active,
        discount_rules, frontend_config, discounts_applied,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      )
      RETURNING *
    `

    const params = [
      id,
      data.name,
      data.slug,
      data.startDate,
      data.endDate,
      data.priority,
      false, // is_active por defecto
      JSON.stringify(data.discountRules),
      JSON.stringify(data.frontendConfig),
      false, // discounts_applied por defecto
      now,
      now
    ]

    try {
      const result = await database.query(query, params)
      const campaign = this.mapRowToCampaign(result.rows[0])

      logger.info('Campaña creada exitosamente', {
        campaignId: id,
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate
      })

      return campaign
    } catch (error) {
      logger.error('Error al crear campaña', {
        error: error instanceof Error ? error.message : 'Unknown error',
        data
      })
      throw error
    }
  }

  /**
   * Busca una campaña por su ID
   * 
   * @param id - ID de la campaña
   * @returns Campaña encontrada o null
   */
  async findById(id: string): Promise<Campaign | null> {
    const query = 'SELECT * FROM campaigns WHERE id = $1'

    try {
      const result = await database.query(query, [id])

      if (result.rows.length === 0) {
        return null
      }

      return this.mapRowToCampaign(result.rows[0])
    } catch (error) {
      logger.error('Error al buscar campaña por ID', {
        error: error instanceof Error ? error.message : 'Unknown error',
        campaignId: id
      })
      throw error
    }
  }

  /**
   * Busca una campaña por su slug
   * 
   * @param slug - Slug de la campaña
   * @returns Campaña encontrada o null
   */
  async findBySlug(slug: string): Promise<Campaign | null> {
    const query = 'SELECT * FROM campaigns WHERE slug = $1'

    try {
      const result = await database.query(query, [slug])

      if (result.rows.length === 0) {
        return null
      }

      return this.mapRowToCampaign(result.rows[0])
    } catch (error) {
      logger.error('Error al buscar campaña por slug', {
        error: error instanceof Error ? error.message : 'Unknown error',
        slug
      })
      throw error
    }
  }

  /**
   * Busca una campaña por su nombre
   * 
   * @param name - Nombre de la campaña
   * @returns Campaña encontrada o null
   */
  async findByName(name: string): Promise<Campaign | null> {
    const query = 'SELECT * FROM campaigns WHERE name = $1'

    try {
      const result = await database.query(query, [name])

      if (result.rows.length === 0) {
        return null
      }

      return this.mapRowToCampaign(result.rows[0])
    } catch (error) {
      logger.error('Error al buscar campaña por nombre', {
        error: error instanceof Error ? error.message : 'Unknown error',
        name
      })
      throw error
    }
  }

  /**
   * Obtiene todas las campañas con filtros opcionales
   * 
   * Requirement 1.5: Retornar campañas ordenadas por prioridad descendente
   * 
   * @param filters - Filtros opcionales
   * @returns Lista de campañas
   */
  async findAll(filters?: CampaignFilters): Promise<Campaign[]> {
    let query = 'SELECT * FROM campaigns WHERE 1=1'
    const params: any[] = []
    let paramIndex = 1

    // Aplicar filtros
    if (filters) {
      if (filters.isActive !== undefined) {
        query += ` AND is_active = $${paramIndex++}`
        params.push(filters.isActive)
      }

      if (filters.startDateFrom) {
        query += ` AND start_date >= $${paramIndex++}`
        params.push(filters.startDateFrom)
      }

      if (filters.startDateTo) {
        query += ` AND start_date <= $${paramIndex++}`
        params.push(filters.startDateTo)
      }

      if (filters.endDateFrom) {
        query += ` AND end_date >= $${paramIndex++}`
        params.push(filters.endDateFrom)
      }

      if (filters.endDateTo) {
        query += ` AND end_date <= $${paramIndex++}`
        params.push(filters.endDateTo)
      }

      if (filters.minPriority !== undefined) {
        query += ` AND priority >= $${paramIndex++}`
        params.push(filters.minPriority)
      }
    }

    // Ordenamiento - por defecto por prioridad descendente (Requirement 1.5)
    const orderBy = filters?.orderBy || 'priority'
    const orderDirection = filters?.orderDirection || 'DESC'
    const validOrderColumns = ['priority', 'startDate', 'endDate', 'createdAt']
    const columnMap: Record<string, string> = {
      priority: 'priority',
      startDate: 'start_date',
      endDate: 'end_date',
      createdAt: 'created_at'
    }

    if (validOrderColumns.includes(orderBy)) {
      query += ` ORDER BY ${columnMap[orderBy]} ${orderDirection}`
    } else {
      query += ' ORDER BY priority DESC'
    }

    // Paginación
    if (filters?.limit) {
      query += ` LIMIT $${paramIndex++}`
      params.push(filters.limit)
    }

    if (filters?.offset) {
      query += ` OFFSET $${paramIndex++}`
      params.push(filters.offset)
    }

    try {
      const result = await database.query(query, params)
      return result.rows.map(row => this.mapRowToCampaign(row))
    } catch (error) {
      logger.error('Error al obtener campañas', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters
      })
      throw error
    }
  }

  /**
   * Obtiene todas las campañas activas ordenadas por prioridad
   * 
   * @returns Lista de campañas activas
   */
  async findActive(): Promise<Campaign[]> {
    const query = `
      SELECT * FROM campaigns 
      WHERE is_active = true 
      ORDER BY priority DESC
    `

    try {
      const result = await database.query(query)
      return result.rows.map(row => this.mapRowToCampaign(row))
    } catch (error) {
      logger.error('Error al obtener campañas activas', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Obtiene campañas pendientes de activación
   * 
   * Requirement 5.2: Detectar campañas que deben activarse
   * 
   * @param now - Fecha actual
   * @returns Lista de campañas pendientes de activación
   */
  async findPendingActivation(now: Date): Promise<Campaign[]> {
    const query = `
      SELECT * FROM campaigns 
      WHERE is_active = false 
        AND discounts_applied = false
        AND start_date <= $1 
        AND end_date > $1
      ORDER BY priority DESC
    `

    try {
      const result = await database.query(query, [now])
      return result.rows.map(row => this.mapRowToCampaign(row))
    } catch (error) {
      logger.error('Error al obtener campañas pendientes de activación', {
        error: error instanceof Error ? error.message : 'Unknown error',
        now
      })
      throw error
    }
  }

  /**
   * Obtiene campañas pendientes de desactivación
   * 
   * Requirement 5.4: Detectar campañas que deben desactivarse
   * 
   * @param now - Fecha actual
   * @returns Lista de campañas pendientes de desactivación
   */
  async findPendingDeactivation(now: Date): Promise<Campaign[]> {
    const query = `
      SELECT * FROM campaigns 
      WHERE is_active = true 
        AND end_date <= $1
      ORDER BY priority DESC
    `

    try {
      const result = await database.query(query, [now])
      return result.rows.map(row => this.mapRowToCampaign(row))
    } catch (error) {
      logger.error('Error al obtener campañas pendientes de desactivación', {
        error: error instanceof Error ? error.message : 'Unknown error',
        now
      })
      throw error
    }
  }

  /**
   * Actualiza una campaña existente
   * 
   * @param id - ID de la campaña
   * @param data - Datos a actualizar
   * @returns Campaña actualizada
   */
  async update(id: string, data: Partial<ICampaign>): Promise<Campaign> {
    const updates: string[] = []
    const params: any[] = []
    let paramIndex = 1

    // Construir query dinámicamente
    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      params.push(data.name)
    }

    if (data.slug !== undefined) {
      updates.push(`slug = $${paramIndex++}`)
      params.push(data.slug)
    }

    if (data.startDate !== undefined) {
      updates.push(`start_date = $${paramIndex++}`)
      params.push(data.startDate)
    }

    if (data.endDate !== undefined) {
      updates.push(`end_date = $${paramIndex++}`)
      params.push(data.endDate)
    }

    if (data.priority !== undefined) {
      updates.push(`priority = $${paramIndex++}`)
      params.push(data.priority)
    }

    if (data.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`)
      params.push(data.isActive)
    }

    if (data.discountRules !== undefined) {
      updates.push(`discount_rules = $${paramIndex++}`)
      params.push(JSON.stringify(data.discountRules))
    }

    if (data.frontendConfig !== undefined) {
      updates.push(`frontend_config = $${paramIndex++}`)
      params.push(JSON.stringify(data.frontendConfig))
    }

    if (data.discountsApplied !== undefined) {
      updates.push(`discounts_applied = $${paramIndex++}`)
      params.push(data.discountsApplied)
    }

    if (data.appliedAt !== undefined) {
      updates.push(`applied_at = $${paramIndex++}`)
      params.push(data.appliedAt)
    }

    if (data.deactivatedAt !== undefined) {
      updates.push(`deactivated_at = $${paramIndex++}`)
      params.push(data.deactivatedAt)
    }

    // Siempre actualizar updated_at
    updates.push(`updated_at = $${paramIndex++}`)
    params.push(new Date())

    // Agregar ID al final
    params.push(id)

    const query = `
      UPDATE campaigns 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    try {
      const result = await database.query(query, params)

      if (result.rows.length === 0) {
        throw new Error(`Campaña con ID ${id} no encontrada`)
      }

      const campaign = this.mapRowToCampaign(result.rows[0])

      logger.info('Campaña actualizada exitosamente', {
        campaignId: id,
        updatedFields: Object.keys(data)
      })

      return campaign
    } catch (error) {
      logger.error('Error al actualizar campaña', {
        error: error instanceof Error ? error.message : 'Unknown error',
        campaignId: id,
        data
      })
      throw error
    }
  }

  /**
   * Elimina una campaña
   * 
   * @param id - ID de la campaña a eliminar
   */
  async delete(id: string): Promise<void> {
    const query = 'DELETE FROM campaigns WHERE id = $1'

    try {
      const result = await database.query(query, [id])

      if (result.rowCount === 0) {
        throw new Error(`Campaña con ID ${id} no encontrada`)
      }

      logger.info('Campaña eliminada exitosamente', { campaignId: id })
    } catch (error) {
      logger.error('Error al eliminar campaña', {
        error: error instanceof Error ? error.message : 'Unknown error',
        campaignId: id
      })
      throw error
    }
  }

  /**
   * Mapea una fila de la base de datos a un objeto Campaign
   * 
   * @param row - Fila de la base de datos
   * @returns Instancia de Campaign
   */
  private mapRowToCampaign(row: any): Campaign {
    return Campaign.fromDatabase({
      id: row.id,
      name: row.name,
      slug: row.slug,
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      priority: row.priority,
      isActive: row.is_active,
      discountRules: typeof row.discount_rules === 'string' 
        ? JSON.parse(row.discount_rules) 
        : row.discount_rules,
      frontendConfig: typeof row.frontend_config === 'string'
        ? JSON.parse(row.frontend_config)
        : row.frontend_config,
      discountsApplied: row.discounts_applied,
      appliedAt: row.applied_at ? new Date(row.applied_at) : undefined,
      deactivatedAt: row.deactivated_at ? new Date(row.deactivated_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    })
  }
}

// Exportar instancia singleton
export const campaignRepository = new CampaignRepository()
