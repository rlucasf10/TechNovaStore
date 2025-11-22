/**
 * Caso de Uso: Obtener Estadísticas de Caché
 * 
 * Obtiene estadísticas del caché de precios (Redis):
 * - Total de entradas en caché
 * - Hits y misses
 * - Tasa de aciertos
 * - Memoria utilizada
 * - Entradas expiradas
 */

import { PriceCache } from '../shared/pricing/PriceCache';

export interface CacheStatsResult {
  totalKeys: number;
  priceKeys: number;
  comparisonKeys: number;
  historyKeys: number;
  memoryUsage: string;
}

export class GetCacheStats {
  constructor(private priceCache: PriceCache) {}

  /**
   * Obtiene las estadísticas del caché
   * @returns Estadísticas detalladas del caché
   */
  async execute(): Promise<CacheStatsResult> {
    console.log('Getting cache statistics...');

    const stats = await this.priceCache.getCacheStats();

    console.log(`Cache stats: ${stats.totalKeys} total keys, ${stats.memoryUsage} memory used`);

    return stats;
  }
}
