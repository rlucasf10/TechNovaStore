/**
 * Caso de Uso: Gestionar Proveedores
 * 
 * Gestiona los proveedores externos de datos (Amazon, eBay, AliExpress, etc.):
 * - Agregar nuevos proveedores
 * - Eliminar proveedores
 * - Listar proveedores activos
 * - Obtener información de proveedores
 */

import { AdapterFactory } from '../shared/adapters/AdapterFactory';
import { ProviderType, ProviderConfig } from '../shared/types/provider';

export interface ProviderInfo {
  name: string;
  type: ProviderType;
  rateLimit: number;
  isHealthy?: boolean;
}

export class ManageProviders {
  /**
   * Agrega un nuevo proveedor
   * @param type - Tipo de proveedor
   * @param config - Configuración del proveedor
   */
  addProvider(type: ProviderType, config: ProviderConfig): void {
    console.log(`Adding provider: ${config.name} (${type})`);

    AdapterFactory.createAdapter(type, config);

    console.log(`✅ Provider ${config.name} added successfully`);
  }

  /**
   * Elimina un proveedor
   * @param type - Tipo de proveedor
   * @param name - Nombre opcional del proveedor específico
   * @returns true si se eliminó, false si no se encontró
   */
  removeProvider(type: ProviderType, name?: string): boolean {
    console.log(`Removing provider: ${type}${name ? ` (${name})` : ''}`);

    const removed = AdapterFactory.removeAdapter(type, name);

    if (removed) {
      console.log(`✅ Provider removed successfully`);
    } else {
      console.log(`⚠️  Provider not found`);
    }

    return removed;
  }

  /**
   * Lista todos los proveedores activos
   * @returns Lista de información de proveedores
   */
  async listProviders(): Promise<ProviderInfo[]> {
    console.log('Listing all providers...');

    const adapters = AdapterFactory.getAllAdapters();

    const providers: ProviderInfo[] = await Promise.all(
      adapters.map(async (adapter) => {
        let isHealthy: boolean | undefined;
        try {
          isHealthy = await adapter.isHealthy();
        } catch {
          isHealthy = false;
        }

        return {
          name: adapter.name,
          type: adapter.constructor.name.replace('Adapter', '').toLowerCase() as ProviderType,
          rateLimit: adapter.getRateLimit(),
          isHealthy,
        };
      })
    );

    console.log(`Found ${providers.length} providers`);

    return providers;
  }

  /**
   * Obtiene información de un proveedor específico
   * @param type - Tipo de proveedor
   * @param name - Nombre opcional del proveedor
   * @returns Información del proveedor o undefined si no existe
   */
  async getProvider(type: ProviderType, name?: string): Promise<ProviderInfo | undefined> {
    const providers = await this.listProviders();

    return providers.find(p => {
      if (name) {
        return p.type === type && p.name === name;
      }
      return p.type === type;
    });
  }
}
