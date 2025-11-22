/**
 * Tests para GetTrendingProducts
 */

import { GetTrendingProducts } from './GetTrendingProducts';
import { HybridRecommender } from '../shared/algorithms/HybridRecommender';

describe('GetTrendingProducts', () => {
  let getTrendingProducts: GetTrendingProducts;
  let mockHybridRecommender: jest.Mocked<HybridRecommender>;

  beforeEach(() => {
    mockHybridRecommender = {
      getTrendingProducts: jest.fn()
    } as any;

    getTrendingProducts = new GetTrendingProducts(mockHybridRecommender);
  });

  describe('execute', () => {
    it('debe retornar productos en tendencia', async () => {
      const trendingProducts = [
        { productSku: 'TREND-001', score: 0.95, source: 'trending' as const },
        { productSku: 'TREND-002', score: 0.90, source: 'trending' as const }
      ];
      mockHybridRecommender.getTrendingProducts.mockResolvedValue(trendingProducts);

      const result = await getTrendingProducts.execute(10);

      expect(mockHybridRecommender.getTrendingProducts).toHaveBeenCalledWith(10);
      expect(result.recommendations).toEqual(trendingProducts);
      expect(result.metadata.algorithm).toBe('trending');
    });

    it('debe usar límite por defecto de 10', async () => {
      const trendingProducts = [
        { productSku: 'TREND-001', score: 0.95, source: 'trending' as const }
      ];
      mockHybridRecommender.getTrendingProducts.mockResolvedValue(trendingProducts);

      await getTrendingProducts.execute();

      expect(mockHybridRecommender.getTrendingProducts).toHaveBeenCalledWith(10);
    });

    it('debe incluir metadata con información de procesamiento', async () => {
      const trendingProducts = [
        { productSku: 'TREND-001', score: 0.95, source: 'trending' as const }
      ];
      mockHybridRecommender.getTrendingProducts.mockResolvedValue(trendingProducts);

      const result = await getTrendingProducts.execute(5);

      expect(result.metadata).toHaveProperty('totalCount');
      expect(result.metadata).toHaveProperty('algorithm');
      expect(result.metadata).toHaveProperty('cacheHit');
      expect(result.metadata).toHaveProperty('processingTime');
      expect(result.metadata.totalCount).toBe(1);
      expect(result.metadata.cacheHit).toBe(false);
    });

    it('debe medir el tiempo de procesamiento', async () => {
      const trendingProducts = [
        { productSku: 'TREND-001', score: 0.95, source: 'trending' as const }
      ];
      mockHybridRecommender.getTrendingProducts.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return trendingProducts;
      });

      const result = await getTrendingProducts.execute();

      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(50);
    });

    it('debe propagar errores del algoritmo', async () => {
      mockHybridRecommender.getTrendingProducts.mockRejectedValue(new Error('Database error'));

      await expect(getTrendingProducts.execute()).rejects.toThrow('Database error');
    });

    it('debe retornar array vacío cuando no hay productos en tendencia', async () => {
      mockHybridRecommender.getTrendingProducts.mockResolvedValue([]);

      const result = await getTrendingProducts.execute();

      expect(result.recommendations).toEqual([]);
      expect(result.metadata.totalCount).toBe(0);
    });

    it('debe respetar el límite especificado', async () => {
      const trendingProducts = Array.from({ length: 20 }, (_, i) => ({
        productSku: `TREND-${i}`,
        score: 0.95 - i * 0.01,
        source: 'trending' as const
      }));
      mockHybridRecommender.getTrendingProducts.mockResolvedValue(trendingProducts);

      await getTrendingProducts.execute(5);

      expect(mockHybridRecommender.getTrendingProducts).toHaveBeenCalledWith(5);
    });

    it('debe manejar límites grandes', async () => {
      const trendingProducts = Array.from({ length: 50 }, (_, i) => ({
        productSku: `TREND-${i}`,
        score: 0.95 - i * 0.01,
        source: 'trending' as const
      }));
      mockHybridRecommender.getTrendingProducts.mockResolvedValue(trendingProducts);

      const result = await getTrendingProducts.execute(100);

      expect(result.recommendations).toHaveLength(50);
    });

    it('debe incluir scores ordenados de mayor a menor', async () => {
      const trendingProducts = [
        { productSku: 'TREND-001', score: 0.95, source: 'trending' as const },
        { productSku: 'TREND-002', score: 0.90, source: 'trending' as const },
        { productSku: 'TREND-003', score: 0.85, source: 'trending' as const }
      ];
      mockHybridRecommender.getTrendingProducts.mockResolvedValue(trendingProducts);

      const result = await getTrendingProducts.execute();

      expect(result.recommendations[0].score).toBeGreaterThanOrEqual(result.recommendations[1].score);
      expect(result.recommendations[1].score).toBeGreaterThanOrEqual(result.recommendations[2].score);
    });


  });
});
