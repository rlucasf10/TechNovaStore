/**
 * Caso de uso: Actualizar modelos de recomendación
 * 
 * Este caso de uso actualiza los modelos de machine learning utilizados
 * para generar recomendaciones. Debe ejecutarse periódicamente.
 */

import { ContentBasedFiltering } from '../shared/algorithms/ContentBasedFiltering';

export class UpdateModels {
  private contentFilter: ContentBasedFiltering;
  private redisClient: any;

  constructor(contentFilter: ContentBasedFiltering, redisClient: any) {
    this.contentFilter = contentFilter;
    this.redisClient = redisClient;
  }

  async execute(): Promise<void> {
    try {
      console.log('Starting model update...');
      
      // Update content-based features
      await this.contentFilter.updateProductFeatures();
      
      // Clear all caches to force fresh recommendations
      await this.redisClient.flushDb();
      
      console.log('Model update completed');
    } catch (error) {
      console.error('Error updating models:', error);
      throw error;
    }
  }
}
