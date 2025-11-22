/**
 * Caso de Uso: Disparar Actualización de Precios
 * 
 * Dispara una actualización de precios desde los proveedores externos.
 * Puede actualizar precios de todos los proveedores o solo los especificados.
 */

import { SyncScheduler } from '../shared/scheduler/SyncScheduler';
import { ProviderType } from '../shared/types/provider';

export class TriggerPriceUpdate {
  constructor(private scheduler: SyncScheduler) {}

  /**
   * Ejecuta una actualización de precios
   * @param providers - Lista opcional de proveedores a actualizar
   */
  async execute(providers?: ProviderType[]): Promise<void> {
    console.log('Triggering manual price update...');
    
    if (providers && providers.length > 0) {
      console.log(`Updating prices from specific providers: ${providers.join(', ')}`);
    } else {
      console.log('Updating prices from all providers');
    }

    this.scheduler.triggerPriceUpdate(providers);
  }
}
