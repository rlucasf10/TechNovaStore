/**
 * Caso de Uso: Obtener Métricas de Sincronización
 * 
 * Obtiene métricas detalladas sobre el rendimiento del motor de sincronización:
 * - Total de trabajos procesados
 * - Trabajos completados y fallidos
 * - Duración promedio de trabajos
 * - Productos procesados, actualizados y agregados
 * - Errores recientes
 * - Última sincronización
 */

import { JobQueue } from '../shared/queue/JobQueue';
import { SyncMetrics } from '../shared/types/sync';

export class GetSyncMetrics {
  constructor(private jobQueue: JobQueue) {}

  /**
   * Obtiene las métricas del sistema de sincronización
   * @returns Métricas detalladas del sistema
   */
  async execute(): Promise<SyncMetrics> {
    console.log('Calculating sync metrics...');

    const queueStats = this.jobQueue.getQueueStats() || { total: 0, pending: 0, running: 0, completed: 0, failed: 0 };
    const jobHistory = this.jobQueue.getJobHistory(100) || [];

    const completedJobs = jobHistory.filter(j => j.status === 'completed');
    const failedJobs = jobHistory.filter(j => j.status === 'failed');

    // Calcular duración promedio para trabajos completados
    const durations = completedJobs
      .filter(j => j.started_at && j.completed_at)
      .map(j => j.completed_at!.getTime() - j.started_at!.getTime());

    const averageDuration = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;

    // Obtener resultados de sincronización recientes
    const recentJobs = jobHistory.slice(0, 50);
    const productsProcessed = recentJobs.length; // Simplificado
    const productsUpdated = completedJobs.length;
    const productsAdded = 0; // Se calcularía desde los resultados reales de sincronización

    const metrics: SyncMetrics = {
      total_jobs: queueStats.total,
      completed_jobs: queueStats.completed,
      failed_jobs: queueStats.failed,
      average_duration: Math.round(averageDuration),
      products_processed: productsProcessed,
      products_updated: productsUpdated,
      products_added: productsAdded,
      errors: failedJobs.map(j => j.error || 'Unknown error'),
      last_sync: completedJobs.length > 0 ? completedJobs[0].completed_at! : new Date()
    };

    console.log(`Metrics calculated: ${metrics.completed_jobs}/${metrics.total_jobs} jobs completed`);

    return metrics;
  }
}
