/**
 * Tests para HealthCheck
 */

import { HealthCheck, HealthCheckResult } from './HealthCheck';
import { PriceCache } from '../shared/pricing/PriceCache';
import { SyncWorker } from '../shared/workers/SyncWorker';
import { SyncScheduler } from '../shared/scheduler/SyncScheduler';
import { AdapterFactory } from '../shared/adapters/AdapterFactory';

// Mock AdapterFactory
jest.mock('../shared/adapters/AdapterFactory');

describe('HealthCheck', () => {
  let healthCheck: HealthCheck;
  let mockPriceCache: any;
  let mockWorkers: jest.Mocked<SyncWorker>[];
  let mockScheduler: jest.Mocked<SyncScheduler>;
  let mockAdapter: any;

  beforeEach(() => {
    mockPriceCache = {
      redis: {
        isOpen: true,
      },
    };

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

    mockScheduler = {
      getStatus: jest.fn().mockReturnValue({
        isRunning: true,
        scheduledTasks: ['fullSync', 'priceUpdate'],
      }),
    } as any;

    mockAdapter = {
      isHealthy: jest.fn().mockResolvedValue(true),
    };

    (AdapterFactory.getAllAdapters as jest.Mock).mockReturnValue([mockAdapter]);

    healthCheck = new HealthCheck(mockPriceCache as PriceCache, mockWorkers, mockScheduler);
  });

  describe('execute', () => {
    it('debe retornar healthy cuando todos los componentes están operativos', async () => {
      const result = await healthCheck.execute();

      expect(result.status).toBe('healthy');
      expect(result.message).toBe('All systems operational');
      expect(result.components.redis).toBe(true);
      expect(result.components.workers).toBe(true);
      expect(result.components.scheduler).toBe(true);
      expect(result.components.providers).toBe(true);
    });

    it('debe retornar degraded cuando algunos componentes fallan', async () => {
      mockPriceCache.redis.isOpen = false;

      const result = await healthCheck.execute();

      expect(result.status).toBe('degraded');
      expect(result.message).toContain('3/4 components healthy');
    });

    it('debe retornar unhealthy cuando la mayoría de componentes fallan', async () => {
      // 1 de 4 componentes saludables = 25% = unhealthy
      mockPriceCache.redis.isOpen = false;
      mockWorkers[0].getStatus.mockReturnValue({
        id: 'worker-1',
        isRunning: false,
        currentJob: null,
      });
      mockWorkers[1].getStatus.mockReturnValue({
        id: 'worker-2',
        isRunning: false,
        currentJob: null,
      });
      mockScheduler.getStatus.mockReturnValue({
        isRunning: false,
        scheduledTasks: [],
      });

      const result = await healthCheck.execute();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('Only');
    });

    it('debe detectar Redis desconectado', async () => {
      mockPriceCache.redis.isOpen = false;

      const result = await healthCheck.execute();

      expect(result.components.redis).toBe(false);
    });

    it('debe detectar workers detenidos', async () => {
      mockWorkers[0].getStatus.mockReturnValue({
        id: 'worker-1',
        isRunning: false,
        currentJob: null,
      });

      const result = await healthCheck.execute();

      expect(result.components.workers).toBe(false);
    });

    it('debe detectar scheduler detenido', async () => {
      mockScheduler.getStatus.mockReturnValue({
        isRunning: false,
        scheduledTasks: [],
      });

      const result = await healthCheck.execute();

      expect(result.components.scheduler).toBe(false);
    });

    it('debe detectar proveedores no saludables', async () => {
      mockAdapter.isHealthy.mockResolvedValue(false);

      const result = await healthCheck.execute();

      expect(result.components.providers).toBe(false);
    });

    it('debe manejar múltiples proveedores', async () => {
      const mockAdapter2 = {
        isHealthy: jest.fn().mockResolvedValue(true),
      };

      (AdapterFactory.getAllAdapters as jest.Mock).mockReturnValue([mockAdapter, mockAdapter2]);

      const result = await healthCheck.execute();

      expect(result.components.providers).toBe(true);
    });

    it('debe considerar providers healthy si al menos uno está saludable', async () => {
      const mockAdapter2 = {
        isHealthy: jest.fn().mockResolvedValue(false),
      };

      (AdapterFactory.getAllAdapters as jest.Mock).mockReturnValue([mockAdapter, mockAdapter2]);

      const result = await healthCheck.execute();

      expect(result.components.providers).toBe(true);
    });

    it('debe manejar errores en health check de proveedores', async () => {
      mockAdapter.isHealthy.mockRejectedValue(new Error('Provider error'));

      const result = await healthCheck.execute();

      expect(result.components.providers).toBe(false);
    });

    it('debe manejar sistema sin proveedores', async () => {
      (AdapterFactory.getAllAdapters as jest.Mock).mockReturnValue([]);

      const result = await healthCheck.execute();

      expect(result.components.providers).toBe(false);
    });

    it('debe manejar sistema sin workers', async () => {
      const noWorkersHealthCheck = new HealthCheck(
        mockPriceCache as PriceCache,
        [],
        mockScheduler
      );

      const result = await noWorkersHealthCheck.execute();

      expect(result.components.workers).toBe(true); // every() retorna true para array vacío
    });

    it('debe retornar timestamp actualizado', async () => {
      const before = new Date();
      const result = await healthCheck.execute();
      const after = new Date();

      expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('debe manejar Redis sin conexión definida', async () => {
      mockPriceCache.redis = undefined;

      const result = await healthCheck.execute();

      expect(result.components.redis).toBe(false);
    });

    it('debe manejar errores generales en health check', async () => {
      mockScheduler.getStatus.mockImplementation(() => {
        throw new Error('Scheduler error');
      });

      const result = await healthCheck.execute();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('Health check failed');
    });

    it('debe ejecutarse múltiples veces sin errores', async () => {
      await expect(healthCheck.execute()).resolves.not.toThrow();
      await expect(healthCheck.execute()).resolves.not.toThrow();
      await expect(healthCheck.execute()).resolves.not.toThrow();
    });

    it('debe calcular correctamente el porcentaje de componentes saludables', async () => {
      // 2 de 4 componentes saludables = 50% = degraded
      mockPriceCache.redis.isOpen = false;
      mockWorkers[0].getStatus.mockReturnValue({
        id: 'worker-1',
        isRunning: false,
        currentJob: null,
      });

      const result = await healthCheck.execute();

      expect(result.status).toBe('degraded');
    });

    it('debe retornar unhealthy cuando menos del 50% está saludable', async () => {
      // 1 de 4 componentes saludables = 25% = unhealthy
      mockPriceCache.redis.isOpen = false;
      mockWorkers[0].getStatus.mockReturnValue({
        id: 'worker-1',
        isRunning: false,
        currentJob: null,
      });
      mockScheduler.getStatus.mockReturnValue({
        isRunning: false,
        scheduledTasks: [],
      });

      const result = await healthCheck.execute();

      expect(result.status).toBe('unhealthy');
    });
  });
});
