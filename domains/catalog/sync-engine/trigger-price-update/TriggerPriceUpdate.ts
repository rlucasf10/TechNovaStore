/**
 * Caso de Uso: Disparar Actualización de Precios
 * 
 * Dispara una actualización de precios desde los proveedores externos.
 * Puede actualizar precios de todos los proveedores o solo los especificados.
 */

import { SyncScheduler } from '../shared/scheduler/SyncScheduler';
import { ProviderType } from '../shared/types/provider';
import { createLogger } from '@technovastore/shared-config';

const logger = createLogger('sync-engine-price-update');

export class TriggerPriceUpdate {
  constructor(private scheduler: SyncScheduler) {}

  /**
   * Ejecuta una actualización de precios
   * @param providers - Lista opcional de proveedores a actualizar
   */
  async execute(providers?: ProviderType[]): Promise<void> {
    logger.info('Triggering manual price update...');
    
    if (providers && providers.length > 0) {
      logger.info('Updating prices from specific providers', { providers: providers.join(', ') });
    } else {
      logger.info('Updating prices from all providers');
    }

    this.scheduler.triggerPriceUpdate(providers);
  }
}
