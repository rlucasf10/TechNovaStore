/**
 * Tests para GetSyncStatus
 */

import { GetSyncStatus } from './GetSyncStatus';
import { SyncScheduler } from '../shared/scheduler/SyncScheduler';
import { SyncWorker } from '../shared/workers/SyncWorker';
import { JobQueue } from '../shared/queue/JobQueue';
import { DynamicPricingEngine } from '../shared/pricing/DynamicPricingEngine';
import { DynamicPricingConfig } from '../shared/types/pricing';

describe('GetSyncStatus', () => {
  let getSyncStatus: GetSyncStatus;
  let mockScheduler: jest.Mocked<SyncScheduler>;
  let mockWorkers: jest.Mocked<SyncWorker>[];
  let mockJobQueue: jest.Mocked<JobQueue>;
  let mockDynamicPricingEngine: jest.Mocked<DynamicPricingEngine>;
  let mockConfig: DynamicPricingConfig;

  beforeEach(() => {
    mockConfig = {
      enabled: true,
      update_frequency_minutes: 30,
      price_change_threshold: 0.02,
      max_price_increase_percentage: 0.15,
      max_price_decrease_percentage: 0.20,
      competitor_weight: 0.7,
      demand_weight: 0.2,
      inventory_weight: 0.1,
    };

    mockScheduler = {
      getStatus: jest.fn().mockReturnValue({
        isRunning: true,
        scheduledTasks: ['fullSync', 'priceUpdate', 'availabilityCheck'],
      }),
    } as any;

    mockWorkers = [
      {
        getStatus: jest.fn().mockReturnValue({
          id: 'worker-1',
          isRunning: true,
          currentJob: null,
        }),
      } as any,
      {
        getStatus: jest.fn().mockReturnValue({
          id: 'worker-2',
          isRunning: true,
          currentJob: null,
        }),
      } as any,
    ];

    mockJobQueue = {
      getQueueStats: jest.fn().mockReturnValue({
        total: 110,
        pending: 5,
        running: 2,
        completed: 100,
        failed: 3,
      }),
    } as any;

    mockDynamicPricingEngine = {
      getStatus: jest.fn().mockReturnValue({
        isRunning: true,
        config: mockConfig,
        nextUpdate: new Date(),
      }),
    } as any;

    getSyncStatus = new GetSyncStatus(
      true,
      mockScheduler,
      mockWorkers,
      mockJobQueue,
      mockDynamicPricingEngine
    );
  });

  describe('execute', () => {
    it('debe retornar el estado completo del sistema', () => {
      const result = getSyncStatus.execute();

      expect(result.isRunning).toBe(true);
      expect(result.scheduler).toBeDefined();
      expect(result.workers).toHaveLength(2);
      expect(result.jobQueue).toBeDefined();
      expect(result.dynamicPricing).toBeDefined();
    });

    it('debe llamar a getStatus de todos los componentes', () => {
      getSyncStatus.execute();

      expect(mockScheduler.getStatus).toHaveBeenCalled();
      expect(mockWorkers[0].getStatus).toHaveBeenCalled();
      expect(mockWorkers[1].getStatus).toHaveBeenCalled();
      expect(mockJobQueue.getQueueStats).toHaveBeenCalled();
      expect(mockDynamicPricingEngine.getStatus).toHaveBeenCalled();
    });

    it('debe retornar estado cuando el sistema está detenido', () => {
      const stoppedStatus = new GetSyncStatus(
        false,
        mockScheduler,
        mockWorkers,
        mockJobQueue,
        mockDynamicPricingEngine
      );

      const result = stoppedStatus.execute();

      expect(result.isRunning).toBe(false);
    });

    it('debe retornar estado del scheduler correctamente', () => {
      const result = getSyncStatus.execute();

      expect(result.scheduler.isRunning).toBe(true);
      expect(result.scheduler.scheduledTasks).toEqual(['fullSync', 'priceUpdate', 'availabilityCheck']);
    });

    it('debe retornar estado de todos los workers', () => {
      const result = getSyncStatus.execute();

      expect(result.workers).toHaveLength(2);
      expect(result.workers[0].id).toBe('worker-1');
      expect(result.workers[0].isRunning).toBe(true);
      expect(result.workers[1].id).toBe('worker-2');
    });

    it('debe retornar estadísticas de la cola de trabajos', () => {
      const result = getSyncStatus.execute();

      expect(result.jobQueue.pending).toBe(5);
      expect(result.jobQueue.running).toBe(2);
      expect(result.jobQueue.completed).toBe(100);
      expect(result.jobQueue.failed).toBe(3);
      expect(result.jobQueue.total).toBe(110);
    });

    it('debe retornar estado del motor de pricing dinámico', () => {
      const result = getSyncStatus.execute();

      expect(result.dynamicPricing.isRunning).toBe(true);
      expect(result.dynamicPricing.config).toBeDefined();
      expect(result.dynamicPricing.nextUpdate).toBeDefined();
    });

    it('debe manejar sistema sin workers', () => {
      const noWorkersStatus = new GetSyncStatus(
        true,
        mockScheduler,
        [],
        mockJobQueue,
        mockDynamicPricingEngine
      );

      const result = noWorkersStatus.execute();

      expect(result.workers).toHaveLength(0);
    });

    it('debe manejar cola vacía', () => {
      mockJobQueue.getQueueStats.mockReturnValue({
        total: 0,
        pending: 0,
        running: 0,
        completed: 0,
        failed: 0,
      });

      const result = getSyncStatus.execute();

      expect(result.jobQueue.total).toBe(0);
    });

    it('debe ejecutarse múltiples veces sin errores', () => {
      getSyncStatus.execute();
      getSyncStatus.execute();
      const result = getSyncStatus.execute();

      expect(result).toBeDefined();
      expect(mockScheduler.getStatus).toHaveBeenCalledTimes(3);
    });

    it('debe retornar estado consistente en llamadas consecutivas', () => {
      const result1 = getSyncStatus.execute();
      const result2 = getSyncStatus.execute();

      expect(result1.isRunning).toBe(result2.isRunning);
      expect(result1.workers.length).toBe(result2.workers.length);
    });

    it('debe manejar scheduler detenido', () => {
      mockScheduler.getStatus.mockReturnValue({
        isRunning: false,
        scheduledTasks: [],
      });

      const result = getSyncStatus.execute();

      expect(result.scheduler.isRunning).toBe(false);
      expect(result.scheduler.scheduledTasks).toHaveLength(0);
    });

    it('debe manejar pricing engine detenido', () => {
      mockDynamicPricingEngine.getStatus.mockReturnValue({
        isRunning: false,
        config: mockConfig,
        nextUpdate: undefined,
      });

      const result = getSyncStatus.execute();

      expect(result.dynamicPricing.isRunning).toBe(false);
    });
  });
});
