/**
 * MetricsCollector - Recolector de métricas para Prometheus
 * 
 * Expone métricas del Campaign Manager Service en formato Prometheus.
 * 
 * Requirements: 12.5, 16.1, 16.2, 16.3, 16.4, 16.8
 */

import { Pool } from 'pg'
import { Registry, Gauge, Counter, Histogram, collectDefaultMetrics } from 'prom-client'
import { logger } from '../shared/utils/logger'

/**
 * Recolector de métricas para Prometheus
 * 
 * Expone las siguientes métricas:
 * - campaign_active_count: Número de campañas activas (gauge)
 * - campaign_discounts_applied_total: Total de descuentos aplicados (counter)
 * - campaign_discount_application_duration_seconds: Tiempo de aplicación de descuentos (histogram)
 * - campaign_cron_job_executions_total: Total de ejecuciones del cron job (counter)
 * - campaign_cron_job_failures_total: Total de fallos del cron job (counter)
 * - campaign_cron_job_last_execution_timestamp: Timestamp de la última ejecución (gauge)
 * - campaign_cron_job_duration_seconds: Duración de ejecución del cron job (histogram)
 * 
 * Requirement 12.5: Exponer métricas de Prometheus en el endpoint /metrics
 * Requirement 16.1: Registrar gauge para número de campañas activas
 * Requirement 16.2: Registrar counter para número total de descuentos aplicados
 * Requirement 16.3: Registrar histogram para tiempo de aplicación de descuentos
 * Requirement 16.4: Incluir métricas adicionales del sistema
 * Requirement 16.8: Métricas para integración con Alertmanager (cron job failures)
 */
export class MetricsCollector {
  private registry: Registry
  private campaignActiveCount: Gauge<string>
  private campaignDiscountsAppliedTotal: Counter<string>
  private campaignDiscountApplicationDuration: Histogram<string>
  
  // Métricas del cron job para Alertmanager (Requirement 16.8)
  private cronJobExecutionsTotal: Counter<string>
  private cronJobFailuresTotal: Counter<string>
  private cronJobLastExecutionTimestamp: Gauge<string>
  private cronJobDuration: Histogram<string>
  
  private db?: Pool

  constructor() {
    // Crear registro de métricas
    this.registry = new Registry()

    // Configurar métricas por defecto del sistema (CPU, memoria, etc.)
    // Requirement 16.4: Incluir métricas adicionales del sistema
    collectDefaultMetrics({ register: this.registry })

    /**
     * Gauge: campaign_active_count
     * 
     * Número de campañas activas en el sistema.
     * 
     * Requirement 16.1: Registrar gauge de Prometheus para el número de campañas activas
     */
    this.campaignActiveCount = new Gauge({
      name: 'campaign_active_count',
      help: 'Número de campañas activas en el sistema',
      registers: [this.registry]
    })

    /**
     * Counter: campaign_discounts_applied_total
     * 
     * Número total de descuentos aplicados desde el inicio del servicio.
     * Este contador se incrementa cada vez que se aplican descuentos a productos.
     * 
     * Requirement 16.2: Registrar counter de Prometheus para el número total de descuentos aplicados
     */
    this.campaignDiscountsAppliedTotal = new Counter({
      name: 'campaign_discounts_applied_total',
      help: 'Número total de descuentos aplicados desde el inicio del servicio',
      registers: [this.registry]
    })

    /**
     * Histogram: campaign_discount_application_duration_seconds
     * 
     * Tiempo de aplicación de descuentos en segundos.
     * Permite analizar la distribución de tiempos de procesamiento.
     * 
     * Buckets: 0.1s, 0.5s, 1s, 2s, 5s, 10s, 30s, 60s
     * 
     * Requirement 16.3: Registrar histogram de Prometheus para el tiempo de aplicación de descuentos
     */
    this.campaignDiscountApplicationDuration = new Histogram({
      name: 'campaign_discount_application_duration_seconds',
      help: 'Tiempo de aplicación de descuentos en segundos',
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
      registers: [this.registry]
    })

    /**
     * Counter: campaign_cron_job_executions_total
     * 
     * Número total de ejecuciones del cron job.
     * Etiquetas: job_type (activation, deactivation), status (success, failure)
     * 
     * Requirement 16.8: Métricas para integración con Alertmanager
     */
    this.cronJobExecutionsTotal = new Counter({
      name: 'campaign_cron_job_executions_total',
      help: 'Número total de ejecuciones del cron job de campañas',
      labelNames: ['job_type', 'status'],
      registers: [this.registry]
    })

    /**
     * Counter: campaign_cron_job_failures_total
     * 
     * Número total de fallos del cron job.
     * Esta métrica es usada por Alertmanager para enviar notificaciones.
     * Etiquetas: job_type (activation, deactivation), error_type
     * 
     * Requirement 16.8: Métricas para integración con Alertmanager
     */
    this.cronJobFailuresTotal = new Counter({
      name: 'campaign_cron_job_failures_total',
      help: 'Número total de fallos del cron job de campañas',
      labelNames: ['job_type', 'error_type'],
      registers: [this.registry]
    })

    /**
     * Gauge: campaign_cron_job_last_execution_timestamp
     * 
     * Timestamp Unix de la última ejecución del cron job.
     * Permite detectar si el cron job dejó de ejecutarse.
     * Etiquetas: job_type (activation, deactivation)
     * 
     * Requirement 16.8: Métricas para integración con Alertmanager
     */
    this.cronJobLastExecutionTimestamp = new Gauge({
      name: 'campaign_cron_job_last_execution_timestamp',
      help: 'Timestamp Unix de la última ejecución del cron job',
      labelNames: ['job_type'],
      registers: [this.registry]
    })

    /**
     * Histogram: campaign_cron_job_duration_seconds
     * 
     * Duración de ejecución del cron job en segundos.
     * Etiquetas: job_type (activation, deactivation)
     * 
     * Requirement 16.8: Métricas para integración con Alertmanager
     */
    this.cronJobDuration = new Histogram({
      name: 'campaign_cron_job_duration_seconds',
      help: 'Duración de ejecución del cron job en segundos',
      labelNames: ['job_type'],
      buckets: [0.5, 1, 2, 5, 10, 30, 60, 120, 300],
      registers: [this.registry]
    })

    logger.info('MetricsCollector inicializado', {
      operation: 'metrics_init',
      metrics: [
        'campaign_active_count',
        'campaign_discounts_applied_total',
        'campaign_discount_application_duration_seconds',
        'campaign_cron_job_executions_total',
        'campaign_cron_job_failures_total',
        'campaign_cron_job_last_execution_timestamp',
        'campaign_cron_job_duration_seconds'
      ]
    })
  }

  /**
   * Configura la conexión a la base de datos para métricas dinámicas
   * 
   * @param db - Pool de conexiones a PostgreSQL
   */
  setDatabase(db: Pool): void {
    this.db = db
  }

  /**
   * Actualiza el gauge de campañas activas
   * 
   * Consulta la base de datos para obtener el número actual de campañas activas
   * y actualiza la métrica correspondiente.
   */
  async updateActiveCampaignsCount(): Promise<void> {
    if (!this.db) {
      logger.warn('Base de datos no configurada para métricas', {
        operation: 'update_active_campaigns_count'
      })
      return
    }

    try {
      const result = await this.db.query(
        'SELECT COUNT(*) as count FROM campaigns WHERE is_active = true'
      )
      
      const count = parseInt(result.rows[0].count, 10)
      this.campaignActiveCount.set(count)
      
      logger.debug('Métrica de campañas activas actualizada', {
        operation: 'update_active_campaigns_count',
        count
      })
    } catch (error) {
      logger.error('Error al actualizar métrica de campañas activas', {
        operation: 'update_active_campaigns_count',
        error: error instanceof Error ? error.message : 'Error desconocido'
      })
    }
  }

  /**
   * Incrementa el contador de descuentos aplicados
   * 
   * @param count - Número de descuentos aplicados
   */
  incrementDiscountsApplied(count: number = 1): void {
    this.campaignDiscountsAppliedTotal.inc(count)
    
    logger.debug('Contador de descuentos aplicados incrementado', {
      operation: 'increment_discounts_applied',
      count
    })
  }

  /**
   * Registra el tiempo de aplicación de descuentos
   * 
   * @param durationSeconds - Duración en segundos
   */
  recordDiscountApplicationDuration(durationSeconds: number): void {
    this.campaignDiscountApplicationDuration.observe(durationSeconds)
    
    logger.debug('Duración de aplicación de descuentos registrada', {
      operation: 'record_discount_application_duration',
      durationSeconds
    })
  }

  /**
   * Obtiene todas las métricas en formato Prometheus
   * 
   * Actualiza las métricas dinámicas (como el número de campañas activas)
   * antes de retornar el resultado.
   * 
   * @returns Métricas en formato Prometheus
   */
  async getMetrics(): Promise<string> {
    // Actualizar métricas dinámicas antes de retornar
    await this.updateActiveCampaignsCount()
    
    return this.registry.metrics()
  }

  /**
   * Obtiene el content type para las métricas de Prometheus
   * 
   * @returns Content type de Prometheus
   */
  getContentType(): string {
    return this.registry.contentType
  }

  /**
   * Resetea todas las métricas (útil para testing)
   */
  reset(): void {
    this.registry.resetMetrics()
    
    logger.debug('Métricas reseteadas', {
      operation: 'reset_metrics'
    })
  }

  // ============================================
  // Métodos para métricas del cron job
  // Requirement 16.8: Integración con Alertmanager
  // ============================================

  /**
   * Registra una ejecución exitosa del cron job
   * 
   * @param jobType - Tipo de job: 'activation' o 'deactivation'
   * @param durationSeconds - Duración de la ejecución en segundos
   * 
   * Requirement 16.8: Métricas para integración con Alertmanager
   */
  recordCronJobSuccess(jobType: 'activation' | 'deactivation', durationSeconds: number): void {
    // Incrementar contador de ejecuciones exitosas
    this.cronJobExecutionsTotal.inc({ job_type: jobType, status: 'success' })
    
    // Actualizar timestamp de última ejecución
    this.cronJobLastExecutionTimestamp.set({ job_type: jobType }, Date.now() / 1000)
    
    // Registrar duración
    this.cronJobDuration.observe({ job_type: jobType }, durationSeconds)
    
    logger.debug('Ejecución exitosa del cron job registrada', {
      operation: 'record_cron_job_success',
      jobType,
      durationSeconds
    })
  }

  /**
   * Registra un fallo del cron job
   * 
   * Esta métrica es monitoreada por Alertmanager para enviar notificaciones
   * cuando el cron job falla.
   * 
   * @param jobType - Tipo de job: 'activation' o 'deactivation'
   * @param errorType - Tipo de error (ej: 'database_error', 'product_service_error', 'unknown')
   * @param durationSeconds - Duración de la ejecución en segundos (opcional)
   * 
   * Requirement 16.8: Métricas para integración con Alertmanager
   */
  recordCronJobFailure(
    jobType: 'activation' | 'deactivation', 
    errorType: string,
    durationSeconds?: number
  ): void {
    // Incrementar contador de ejecuciones fallidas
    this.cronJobExecutionsTotal.inc({ job_type: jobType, status: 'failure' })
    
    // Incrementar contador de fallos (usado por Alertmanager)
    this.cronJobFailuresTotal.inc({ job_type: jobType, error_type: errorType })
    
    // Actualizar timestamp de última ejecución (incluso si falló)
    this.cronJobLastExecutionTimestamp.set({ job_type: jobType }, Date.now() / 1000)
    
    // Registrar duración si se proporciona
    if (durationSeconds !== undefined) {
      this.cronJobDuration.observe({ job_type: jobType }, durationSeconds)
    }
    
    logger.warn('Fallo del cron job registrado', {
      operation: 'record_cron_job_failure',
      jobType,
      errorType,
      durationSeconds
    })
  }

  /**
   * Obtiene el número total de fallos del cron job
   * 
   * @returns Número total de fallos
   */
  async getCronJobFailuresCount(): Promise<number> {
    const metrics = await this.cronJobFailuresTotal.get()
    return metrics.values.reduce((sum, v) => sum + v.value, 0)
  }

  /**
   * Obtiene el timestamp de la última ejecución del cron job
   * 
   * @param jobType - Tipo de job: 'activation' o 'deactivation'
   * @returns Timestamp Unix de la última ejecución o null si no hay datos
   */
  async getLastCronJobExecution(jobType: 'activation' | 'deactivation'): Promise<number | null> {
    const metrics = await this.cronJobLastExecutionTimestamp.get()
    const value = metrics.values.find(v => v.labels.job_type === jobType)
    return value ? value.value : null
  }
}
