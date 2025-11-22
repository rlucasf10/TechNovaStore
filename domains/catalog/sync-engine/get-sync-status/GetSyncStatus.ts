/**
 * Caso de Uso: Obtener Estado de Sincronización
 * 
 * Obtiene el estado actual del motor de sincronización, incluyendo:
 * - Estado del scheduler
 * - Estado de los workers
 * - Estado de la cola de trabajos
 * - Estado del motor de pricing dinámico
 */

import { SyncScheduler } from '../shared/scheduler/SyncScheduler';
import { SyncWorker } from '../shared/workers/SyncWorker';
import { JobQueue } from '../shared/queue/JobQueue';
import { DynamicPricingEngine } from '../shared/pricing/DynamicPricingEngine';

import { SyncJob } from '../shared/types/sync';
import { DynamicPricingConfig } from '../shared/types/pricing';

export interface SyncStatusResult {
  isRunning: boolean;
  scheduler: {
    isRunning: boolean;
    scheduledTasks: string[];
  };
  workers: Array<{
    id: string;
    isRunning: boolean;
    currentJob: SyncJob | null;
  }>;
  jobQueue: {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
  };
  dynamicPricing: {
    isRunning: boolean;
    config: DynamicPricingConfig;
    nextUpdate?: Date;
  };
}

export class GetSyncStatus {
  constructor(
    private isRunning: boolean,
    private scheduler: SyncScheduler,
    private workers: SyncWorker[],
    private jobQueue: JobQueue,
    private dynamicPricingEngine: DynamicPricingEngine
  ) {}

  /**
   * Obtiene el estado actual del sistema de sincronización
   * @returns Estado completo del sistema
   */
  execute(): SyncStatusResult {
    console.log('Getting sync engine status...');

    const status: SyncStatusResult = {
      isRunning: this.isRunning,
      scheduler: this.scheduler.getStatus(),
      workers: this.workers.map(w => w.getStatus()),
      jobQueue: this.jobQueue.getQueueStats(),
      dynamicPricing: this.dynamicPricingEngine.getStatus(),
    };

    console.log(`Status retrieved: ${status.isRunning ? 'Running' : 'Stopped'}`);

    return status;
  }
}
