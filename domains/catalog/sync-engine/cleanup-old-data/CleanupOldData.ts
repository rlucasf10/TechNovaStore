/**
 * Caso de Uso: Limpiar Datos Antiguos
 * 
 * Limpia datos antiguos del sistema:
 * - Trabajos completados antiguos de la cola
 * - Entradas expiradas del caché
 * - Logs antiguos
 * - Datos temporales
 */

import { JobQueue } from '../shared/queue/JobQueue';
import { PriceCache } from '../shared/pricing/PriceCache';

export interface CleanupResult {
  clearedJobs: number;
  clearedCacheEntries: number;
  timestamp: Date;
}

export class CleanupOldData {
  constructor(
    private jobQueue: JobQueue,
    private priceCache: PriceCache
  ) {}

  /**
   * Ejecuta la limpieza de datos antiguos
   * @param hoursOld - Horas de antigüedad para considerar datos como antiguos (por defecto 24)
   * @returns Resultado de la limpieza
   */
  async execute(hoursOld: number = 24): Promise<CleanupResult> {
    console.log(`Running cleanup for data older than ${hoursOld} hours...`);

    // Limpiar trabajos completados antiguos
    const clearedJobs = this.jobQueue.clearCompletedJobs(hoursOld);
    console.log(`Cleared ${clearedJobs} old completed jobs`);

    // Limpiar entradas expiradas del caché
    await this.priceCache.clearExpiredEntries();
    console.log('Cleared expired cache entries');

    const result: CleanupResult = {
      clearedJobs,
      clearedCacheEntries: 0, // El método clearExpiredEntries no retorna el conteo
      timestamp: new Date(),
    };

    console.log('✅ Cleanup completed successfully');

    return result;
  }
}
