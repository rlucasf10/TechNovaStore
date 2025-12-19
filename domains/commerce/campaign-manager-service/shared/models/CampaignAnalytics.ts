/**
 * Modelo de dominio para CampaignAnalytics
 * 
 * Representa las métricas diarias de una campaña promocional.
 * Implementa las reglas definidas en los requisitos 9.1 y 11.4.
 */

import {
  CampaignAnalytics as ICampaignAnalytics,
  CreateAnalyticsData,
  ValidationResult
} from '../types'

/**
 * Clase CampaignAnalytics con validaciones de negocio
 * 
 * Esta clase encapsula la lógica de métricas de campaña,
 * incluyendo visualizaciones, clics, conversiones e ingresos.
 */
export class CampaignAnalytics implements ICampaignAnalytics {
  id: string
  campaignId: string
  date: Date
  views: number
  clicks: number
  conversions: number
  revenue: number

  /**
   * Constructor privado - usar métodos estáticos para crear instancias
   */
  private constructor(data: ICampaignAnalytics) {
    this.id = data.id
    this.campaignId = data.campaignId
    this.date = data.date
    this.views = data.views
    this.clicks = data.clicks
    this.conversions = data.conversions
    this.revenue = data.revenue
  }

  /**
   * Crea una nueva instancia de CampaignAnalytics desde datos de base de datos
   * 
   * @param data - Datos de analytics desde la base de datos
   * @returns Instancia de CampaignAnalytics
   */
  static fromDatabase(data: ICampaignAnalytics): CampaignAnalytics {
    return new CampaignAnalytics(data)
  }

  /**
   * Crea una nueva instancia de CampaignAnalytics para inserción en base de datos
   * 
   * @param data - Datos para crear el registro de analytics
   * @returns Instancia de CampaignAnalytics con valores por defecto
   */
  static create(data: CreateAnalyticsData): CampaignAnalytics {
    return new CampaignAnalytics({
      id: '', // Se generará en la base de datos
      campaignId: data.campaignId,
      date: data.date,
      views: data.views || 0,
      clicks: data.clicks || 0,
      conversions: data.conversions || 0,
      revenue: data.revenue || 0
    })
  }

  /**
   * Valida los datos de analytics
   * 
   * Implementa las validaciones de los requisitos:
   * - 9.1: Registro de productos con descuento
   * - 9.2: Cálculo de descuento promedio
   * - 9.3: Registro de unidades vendidas
   * - 9.4: Cálculo de ingresos
   * 
   * @param data - Datos de analytics a validar
   * @returns Resultado de validación con lista de errores
   */
  static validate(data: CreateAnalyticsData): ValidationResult {
    const errors: string[] = []

    // Validar ID de campaña
    if (!data.campaignId || data.campaignId.trim().length === 0) {
      errors.push('El ID de la campaña es requerido')
    }

    // Validar fecha
    if (!data.date) {
      errors.push('La fecha es requerida')
    } else {
      if (!(data.date instanceof Date) || isNaN(data.date.getTime())) {
        errors.push('La fecha debe ser una fecha válida')
      }
    }

    // Validar views (opcional, pero debe ser no negativo)
    if (data.views !== undefined && data.views !== null) {
      if (typeof data.views !== 'number' || isNaN(data.views)) {
        errors.push('Las visualizaciones deben ser un número')
      } else if (data.views < 0) {
        errors.push('Las visualizaciones no pueden ser negativas')
      } else if (!Number.isInteger(data.views)) {
        errors.push('Las visualizaciones deben ser un número entero')
      }
    }

    // Validar clicks (opcional, pero debe ser no negativo)
    if (data.clicks !== undefined && data.clicks !== null) {
      if (typeof data.clicks !== 'number' || isNaN(data.clicks)) {
        errors.push('Los clics deben ser un número')
      } else if (data.clicks < 0) {
        errors.push('Los clics no pueden ser negativos')
      } else if (!Number.isInteger(data.clicks)) {
        errors.push('Los clics deben ser un número entero')
      }
    }

    // Validar conversions (opcional, pero debe ser no negativo)
    if (data.conversions !== undefined && data.conversions !== null) {
      if (typeof data.conversions !== 'number' || isNaN(data.conversions)) {
        errors.push('Las conversiones deben ser un número')
      } else if (data.conversions < 0) {
        errors.push('Las conversiones no pueden ser negativas')
      } else if (!Number.isInteger(data.conversions)) {
        errors.push('Las conversiones deben ser un número entero')
      }
    }

    // Validar revenue (opcional, pero debe ser no negativo)
    if (data.revenue !== undefined && data.revenue !== null) {
      if (typeof data.revenue !== 'number' || isNaN(data.revenue)) {
        errors.push('Los ingresos deben ser un número')
      } else if (data.revenue < 0) {
        errors.push('Los ingresos no pueden ser negativos')
      }
    }

    // Validar coherencia: clicks no puede ser mayor que views
    if (
      data.views !== undefined &&
      data.clicks !== undefined &&
      data.clicks > data.views
    ) {
      errors.push('Los clics no pueden ser mayores que las visualizaciones')
    }

    // Validar coherencia: conversions no puede ser mayor que clicks
    if (
      data.clicks !== undefined &&
      data.conversions !== undefined &&
      data.conversions > data.clicks
    ) {
      errors.push('Las conversiones no pueden ser mayores que los clics')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Incrementa las visualizaciones
   * 
   * @param count - Cantidad a incrementar (por defecto 1)
   */
  incrementViews(count: number = 1): void {
    if (count <= 0) {
      throw new Error('La cantidad debe ser mayor que cero')
    }
    this.views += count
  }

  /**
   * Incrementa los clics
   * 
   * @param count - Cantidad a incrementar (por defecto 1)
   */
  incrementClicks(count: number = 1): void {
    if (count <= 0) {
      throw new Error('La cantidad debe ser mayor que cero')
    }
    this.clicks += count
  }

  /**
   * Incrementa las conversiones
   * 
   * @param count - Cantidad a incrementar (por defecto 1)
   */
  incrementConversions(count: number = 1): void {
    if (count <= 0) {
      throw new Error('La cantidad debe ser mayor que cero')
    }
    this.conversions += count
  }

  /**
   * Incrementa los ingresos
   * 
   * @param amount - Cantidad a incrementar
   */
  incrementRevenue(amount: number): void {
    if (amount <= 0) {
      throw new Error('La cantidad debe ser mayor que cero')
    }
    this.revenue += amount
  }

  /**
   * Calcula la tasa de clics (CTR - Click Through Rate)
   * 
   * @returns Tasa de clics como porcentaje (0-100)
   */
  calculateClickThroughRate(): number {
    if (this.views === 0) {
      return 0
    }
    return (this.clicks / this.views) * 100
  }

  /**
   * Calcula la tasa de conversión
   * 
   * @returns Tasa de conversión como porcentaje (0-100)
   */
  calculateConversionRate(): number {
    if (this.clicks === 0) {
      return 0
    }
    return (this.conversions / this.clicks) * 100
  }

  /**
   * Calcula el ingreso promedio por conversión
   * 
   * @returns Ingreso promedio por conversión
   */
  calculateAverageRevenuePerConversion(): number {
    if (this.conversions === 0) {
      return 0
    }
    return this.revenue / this.conversions
  }

  /**
   * Calcula el ingreso promedio por clic
   * 
   * @returns Ingreso promedio por clic
   */
  calculateAverageRevenuePerClick(): number {
    if (this.clicks === 0) {
      return 0
    }
    return this.revenue / this.clicks
  }

  /**
   * Verifica si hay actividad en este día
   * 
   * @returns true si hay al menos una visualización, clic o conversión
   */
  hasActivity(): boolean {
    return this.views > 0 || this.clicks > 0 || this.conversions > 0
  }

  /**
   * Verifica si hay ventas en este día
   * 
   * @returns true si hay conversiones
   */
  hasSales(): boolean {
    return this.conversions > 0
  }

  /**
   * Obtiene un resumen de las métricas
   * 
   * @returns Objeto con métricas calculadas
   */
  getSummary(): {
    views: number
    clicks: number
    conversions: number
    revenue: number
    ctr: number
    conversionRate: number
    avgRevenuePerConversion: number
    avgRevenuePerClick: number
  } {
    return {
      views: this.views,
      clicks: this.clicks,
      conversions: this.conversions,
      revenue: this.revenue,
      ctr: this.calculateClickThroughRate(),
      conversionRate: this.calculateConversionRate(),
      avgRevenuePerConversion: this.calculateAverageRevenuePerConversion(),
      avgRevenuePerClick: this.calculateAverageRevenuePerClick()
    }
  }

  /**
   * Convierte el analytics a objeto plano para serialización
   */
  toJSON(): ICampaignAnalytics {
    return {
      id: this.id,
      campaignId: this.campaignId,
      date: this.date,
      views: this.views,
      clicks: this.clicks,
      conversions: this.conversions,
      revenue: this.revenue
    }
  }
}
