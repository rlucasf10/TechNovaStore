/**
 * Tests para GetCacheStats
 */

import { GetCacheStats, CacheStatsResult } from './GetCacheStats';
import { PriceCache } from '../shared/pricing/PriceCache';

describe('GetCacheStats', () => {
  let getCacheStats: GetCacheStats;
  let mockPriceCache: jest.Mocked<PriceCache>;

  beforeEach(() => {
    mockPriceCache = {
      getCacheStats: jest.fn(),
    } as any;

    getCacheStats = new GetCacheStats(mockPriceCache);
  });

  describe('execute', () => {
    const mockStats: CacheStatsResult = {
      totalKeys: 1000,
      priceKeys: 500,
      comparisonKeys: 300,
      historyKeys: 200,
      memoryUsage: '10MB',
    };

    it('debe obtener estadísticas del caché correctamente', async () => {
      mockPriceCache.getCacheStats.mockResolvedValue(mockStats);

      const result = await getCacheStats.execute();

      expect(result).toEqual(mockStats);
      expect(mockPriceCache.getCacheStats).toHaveBeenCalled();
    });

    it('debe manejar caché vacío', async () => {
      const emptyStats: CacheStatsResult = {
        totalKeys: 0,
        priceKeys: 0,
        comparisonKeys: 0,
        historyKeys: 0,
        memoryUsage: '0MB',
      };

      mockPriceCache.getCacheStats.mockResolvedValue(emptyStats);

      const result = await getCacheStats.execute();

      expect(result.totalKeys).toBe(0);
    });

    it('debe manejar caché con muchas claves', async () => {
      const largeStats: CacheStatsResult = {
        totalKeys: 100000,
        priceKeys: 50000,
        comparisonKeys: 30000,
        historyKeys: 20000,
        memoryUsage: '500MB',
      };

      mockPriceCache.getCacheStats.mockResolvedValue(largeStats);

      const result = await getCacheStats.execute();

      expect(result.totalKeys).toBeGreaterThan(10000);
    });

    it('debe propagar errores del price cache', async () => {
      const error = new Error('Cache connection failed');
      mockPriceCache.getCacheStats.mockRejectedValue(error);

      await expect(getCacheStats.execute()).rejects.toThrow('Cache connection failed');
    });

    it('debe llamar al cache exactamente una vez', async () => {
      mockPriceCache.getCacheStats.mockResolvedValue(mockStats);

      await getCacheStats.execute();

      expect(mockPriceCache.getCacheStats).toHaveBeenCalledTimes(1);
    });

    it('debe ejecutarse múltiples veces sin errores', async () => {
      mockPriceCache.getCacheStats.mockResolvedValue(mockStats);

      await expect(getCacheStats.execute()).resolves.not.toThrow();
      await expect(getCacheStats.execute()).resolves.not.toThrow();
      await expect(getCacheStats.execute()).resolves.not.toThrow();
    });

    it('debe manejar diferentes formatos de memoria', async () => {
      const formats = ['10MB', '1.5GB', '500KB', '2TB'];

      for (const format of formats) {
        const stats: CacheStatsResult = {
          ...mockStats,
          memoryUsage: format,
        };

        mockPriceCache.getCacheStats.mockResolvedValue(stats);

        const result = await getCacheStats.execute();

        expect(result.memoryUsage).toBe(format);
      }
    });

    it('debe retornar todas las claves correctamente', async () => {
      mockPriceCache.getCacheStats.mockResolvedValue(mockStats);

      const result = await getCacheStats.execute();

      expect(result.totalKeys).toBe(1000);
      expect(result.priceKeys).toBe(500);
      expect(result.comparisonKeys).toBe(300);
      expect(result.historyKeys).toBe(200);
    });
  });
});
