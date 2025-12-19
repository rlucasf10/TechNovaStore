/**
 * Repositorio para notificaciones de usuario
 * 
 * Gestiona el almacenamiento y recuperación de notificaciones en PostgreSQL
 */

import { Pool } from 'pg'
import { 
  UserNotification, 
  CreateUserNotificationData,
  GetUserNotificationsQuery 
} from '../types/user-notification.types'

export class UserNotificationRepository {
  constructor(private pool: Pool) {}

  /**
   * Crear una nueva notificación para un usuario
   */
  async create(data: CreateUserNotificationData): Promise<UserNotification> {
    const query = `
      INSERT INTO user_notifications (
        user_id, type, title, message, action_url, read, timestamp, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW(), NOW())
      RETURNING *
    `
    
    const values = [
      data.user_id,
      data.type,
      data.title,
      data.message,
      data.action_url || null
    ]

    const result = await this.pool.query(query, values)
    return this.mapToNotification(result.rows[0])
  }

  /**
   * Obtener notificaciones de un usuario con filtros
   */
  async findByUserId(query: GetUserNotificationsQuery): Promise<UserNotification[]> {
    const conditions: string[] = ['user_id = $1']
    const values: any[] = [query.user_id]
    let paramIndex = 2

    if (query.type !== undefined) {
      conditions.push(`type = $${paramIndex}`)
      values.push(query.type)
      paramIndex++
    }

    if (query.read !== undefined) {
      conditions.push(`read = $${paramIndex}`)
      values.push(query.read)
      paramIndex++
    }

    const limit = query.limit || 50
    const offset = query.offset || 0

    const sql = `
      SELECT * FROM user_notifications
      WHERE ${conditions.join(' AND ')}
      ORDER BY timestamp DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    values.push(limit, offset)

    const result = await this.pool.query(sql, values)
    return result.rows.map(row => this.mapToNotification(row))
  }

  /**
   * Contar notificaciones no leídas de un usuario
   */
  async countUnread(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM user_notifications
      WHERE user_id = $1 AND read = false
    `
    
    const result = await this.pool.query(query, [userId])
    return parseInt(result.rows[0].count, 10)
  }

  /**
   * Marcar una notificación como leída
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const query = `
      UPDATE user_notifications
      SET read = true, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `
    
    const result = await this.pool.query(query, [notificationId, userId])
    return (result.rowCount ?? 0) > 0
  }

  /**
   * Marcar todas las notificaciones de un usuario como leídas
   */
  async markAllAsRead(userId: string): Promise<number> {
    const query = `
      UPDATE user_notifications
      SET read = true, updated_at = NOW()
      WHERE user_id = $1 AND read = false
      RETURNING id
    `
    
    const result = await this.pool.query(query, [userId])
    return result.rowCount ?? 0
  }

  /**
   * Eliminar una notificación
   */
  async delete(notificationId: string, userId: string): Promise<boolean> {
    const query = `
      DELETE FROM user_notifications
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `
    
    const result = await this.pool.query(query, [notificationId, userId])
    return (result.rowCount ?? 0) > 0
  }

  /**
   * Eliminar notificaciones antiguas (más de 30 días)
   */
  async deleteOld(days: number = 30): Promise<number> {
    const query = `
      DELETE FROM user_notifications
      WHERE timestamp < NOW() - INTERVAL '${days} days'
      RETURNING id
    `
    
    const result = await this.pool.query(query)
    return result.rowCount ?? 0
  }

  /**
   * Mapear fila de BD a objeto UserNotification
   */
  private mapToNotification(row: any): UserNotification {
    return {
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      read: row.read,
      action_url: row.action_url,
      timestamp: new Date(row.timestamp),
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    }
  }
}
