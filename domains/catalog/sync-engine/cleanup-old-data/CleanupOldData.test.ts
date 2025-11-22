/**
 * Tests para CleanupOldData
 */

import { CleanupOldData, CleanupResult } from './CleanupOldData';
import { JobQueue } from '../shared/queue/JobQueue';
import { PriceCache } from '../shared/pricing/PriceCache';

describe('CleanupOldData', () => {
  let cleanupOldData: CleanupOldData;
  let mockJobQueue: jest.Mocked<JobQueue>;
  let mockPriceCache: jest.Mocked<PriceCache>;

  beforeEach(() => {
    mockJobQueue = {
      clearCompletedJobs: jest.fn(),
    } as any;

    mockPriceCache = {
      clearExpiredEntries: jest.fn().mockResolvedValue(undefined),
    } as any;

    cleanupOldData = new CleanupOldData(mockJobQueue, mockPriceCache);
  });

  describe('execute', () => {
    it('debe ejecutar limpieza con parámetros por defecto', async () => {
      mockJobQueue.clearCompletedJobs.mockReturnValue(10);

      const result = await cleanupOldData.execute();

      expect(result.clearedJobs).toBe(10);
      expect(mockJobQueue.clearCompletedJobs).toHaveBeenCalledWith(24);
      expect(mockPriceCache.clearExpiredEntries).toHaveBeenCalled();
    });

    it('debe ejecutar limpieza con horas personalizadas', async () => {
      mockJobQueue.clearCompletedJobs.mockReturnValue(5);

      const result = await cleanupOldData.execute(48);

      expect(result.clearedJobs).toBe(5);
      expect(mockJobQueue.clearCompletedJobs).toHaveBeenCalledWith(48);
    });

    it('debe limpiar trabajos y caché', async () => {
      mockJobQueue.clearCompletedJobs.mockReturnValue(15);

      await cleanupOldData.execute();

      expect(mockJobQueue.clearCompletedJobs).toHaveBeenCalled();
      expect(mockPriceCache.clearExpiredEntries).toHaveBeenCalled();
    });

    it('debe retornar resultado con timestamp', async () => {
      mockJobQueue.clearCompletedJobs.mockReturnValue(0);

      const before = new Date();
      const result = await cleanupOldData.execute();
      const after = new Date();

      expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('debe manejar limpieza sin trabajos antiguos', async () => {
      mockJobQueue.clearCompletedJobs.mockReturnValue(0);

      const result = await cleanupOldData.execute();

      expect(result.clearedJobs).toBe(0);
    });

    it('debe manejar limpieza con muchos trabajos antiguos', async () => {
      mockJobQueue.clearCompletedJobs.mockReturnValue(1000);

      const result = await cleanupOldData.execute();

      expect(result.clearedJobs).toBe(1000);
    });

    it('debe ejecutar limpieza con 1 hora', async () => {
      mockJobQueue.clearCompletedJobs.mockReturnValue(2);

      await cleanupOldData.execute(1);

      expect(mockJobQueue.clearCompletedJobs).toHaveBeenCalledWith(1);
    });

    it('debe ejecutar limpieza con 168 horas (1 semana)', async () => {
      mockJobQueue.clearCompletedJobs.mockReturnValue(50);

      await cleanupOldData.execute(168);

      expect(mockJobQueue.clearCompletedJobs).toHaveBeenCalledWith(168);
    });

    it('debe propagar errores del job queue', async () => {
      mockJobQueue.clearCompletedJobs.mockImplementation(() => {
        throw new Error('Queue error');
      });

      await expect(cleanupOldData.execute()).rejects.toThrow('Queue error');
    });

    it('debe propagar errores del price cache', async () => {
      mockJobQueue.clearCompletedJobs.mockReturnValue(0);
      mockPriceCache.clearExpiredEntries.mockRejectedValue(new Error('Cache error'));

      await expect(cleanupOldData.execute()).rejects.toThrow('Cache error');
    });

    it('debe llamar a clearCompletedJobs exactamente una vez', async () => {
      mockJobQueue.clearCompletedJobs.mockReturnValue(5);

      await cleanupOldData.execute();

      expect(mockJobQueue.clearCompletedJobs).toHaveBeenCalledTimes(1);
    });

    it('debe llamar a clearExpiredEntries exactamente una vez', async () => {
      mockJobQueue.clearCompletedJobs.mockReturnValue(5);

      await cleanupOldData.execute();

      expect(mockPriceCache.clearExpiredEntries).toHaveBeenCalledTimes(1);
    });

    it('debe ejecutarse múltiples veces sin errores', async () => {
      mockJobQueue.clearCompletedJobs.mockReturnValue(3);

      await expect(cleanupOldData.execute()).resolves.not.toThrow();
      await expect(cleanupOldData.execute()).resolves.not.toThrow();
      await expect(cleanupOldData.execute()).resolves.not.toThrow();
    });

    it('debe retornar clearedCacheEntries como 0 (no disponible)', async () => {
      mockJobQueue.clearCompletedJobs.mockReturnValue(10);

      const result = await cleanupOldData.execute();

      expect(result.clearedCacheEntries).toBe(0);
    });

    it('debe manejar valores de horas negativos (edge case)', async () => {
      mockJobQueue.clearCompletedJobs.mockReturnValue(0);

      await cleanupOldData.execute(-1);

      expect(mockJobQueue.clearCompletedJobs).toHaveBeenCalledWith(-1);
    });

    it('debe manejar valores de horas muy grandes', async () => {
      mockJobQueue.clearCompletedJobs.mockReturnValue(100);

      await cleanupOldData.execute(8760); // 1 año

      expect(mockJobQueue.clearCompletedJobs).toHaveBeenCalledWith(8760);
    });
  });
});
