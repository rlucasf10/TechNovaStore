/**
 * Caso de Uso: Disparar Sincronización Completa
 * 
 * Dispara una sincronización completa de productos desde los proveedores externos.
 * Puede sincronizar todos los proveedores o solo los especificados.
 */

import { SyncScheduler } from '../shared/scheduler/SyncScheduler';
import { ProviderType } from '../shared/types/provider';

export class TriggerFullSync {
  constructor(private scheduler: SyncScheduler) {}

  /**
   * Ejecuta una sincronización completa
   * @param providers - Lista opcional de proveedores a sincronizar
   */
  async execute(providers?: ProviderType[]): Promise<void> {
    console.log('Triggering manual full sync...');
    
    if (providers && providers.length > 0) {
      console.log(`Syncing specific providers: ${providers.join(', ')}`);
    } else {
      console.log('Syncing all providers');
    }

    this.scheduler.triggerFullSync(providers);
  }
}
