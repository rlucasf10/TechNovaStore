/**
 * Caso de uso: Actualizar modelos de recomendación
 * 
 * Este caso de uso actualiza los modelos de machine learning utilizados
 * para generar recomendaciones. Debe ejecutarse periódicamente.
 */

import { ContentBasedFiltering } from '../shared/algorithms/ContentBasedFiltering';
import { logger } from '../shared/utils/logger';

export class UpdateModels {
  private contentFilter: ContentBasedFiltering;
  private redisClient: any;

  constructor(contentFilter: ContentBasedFiltering, redisClient: any) {
    this.contentFilter = contentFilter;
    this.redisClient = redisClient;
  }

  async execute(): Promise<void> {
    try {
      logger.info('Starting model update');
      
      // Update content-based features
      await this.contentFilter.updateProductFeatures();
      
      // Clear all caches to force fresh recommendations
      await this.redisClient.flushDb();
      
      logger.info('Model update completed');
    } catch (error) {
      logger.error('Error updating models', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }
}
