/**
 * Caso de Uso: Verificar Salud del Sistema
 * 
 * Verifica el estado de salud de todos los componentes del sistema:
 * - Conexión a Redis
 * - Estado de workers
 * - Estado del scheduler
 * - Estado de proveedores externos
 * 
 * Retorna un estado general: healthy, degraded o unhealthy
 */

import { PriceCache } from '../shared/pricing/PriceCache';
import { SyncWorker } from '../shared/workers/SyncWorker';
import { SyncScheduler } from '../shared/scheduler/SyncScheduler';
import { AdapterFactory } from '../shared/adapters/AdapterFactory';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: Record<string, boolean>;
  message: string;
  timestamp: Date;
}

export class HealthCheck {
  constructor(
    private priceCache: PriceCache,
    private workers: SyncWorker[],
    private scheduler: SyncScheduler
  ) {}

  /**
   * Ejecuta la verificación de salud del sistema
   * @returns Resultado de la verificación de salud
   */
  async execute(): Promise<HealthCheckResult> {
    console.log('Running health check...');

    const components: Record<string, boolean> = {};

    try {
      // Verificar conexión a Redis
      components.redis = this.priceCache['redis']?.isOpen || false;

      // Verificar si los workers están corriendo
      components.workers = this.workers.every(w => w.getStatus().isRunning);

      // Verificar scheduler
      components.scheduler = this.scheduler.getStatus().isRunning;

      // Verificar proveedores
      const providers = AdapterFactory.getAllAdapters();
      const healthChecks = await Promise.all(
        providers.map(async (adapter) => {
          try {
            return await adapter.isHealthy();
          } catch {
            return false;
          }
        })
      );
      components.providers = healthChecks.some(healthy => healthy);

      // Calcular estado general
      const healthyComponents = Object.values(components).filter(Boolean).length;
      const totalComponents = Object.keys(components).length;

      let status: 'healthy' | 'degraded' | 'unhealthy';
      let message: string;

      if (healthyComponents === totalComponents) {
        status = 'healthy';
        message = 'All systems operational';
      } else if (healthyComponents >= totalComponents * 0.5) {
        status = 'degraded';
        message = `${healthyComponents}/${totalComponents} components healthy`;
      } else {
        status = 'unhealthy';
        message = `Only ${healthyComponents}/${totalComponents} components healthy`;
      }

      console.log(`Health check completed: ${status}`);

      return {
        status,
        components,
        message,
        timestamp: new Date(),
      };

    } catch (error) {
      console.error('Health check failed:', error);

      return {
        status: 'unhealthy',
        components,
        message: `Health check failed: ${error}`,
        timestamp: new Date(),
      };
    }
  }
}
