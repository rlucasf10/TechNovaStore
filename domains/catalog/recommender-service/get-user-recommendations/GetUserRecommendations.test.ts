/**
 * Tests para GetUserRecommendations
 */

import { GetUserRecommendations } from './GetUserRecommendations';
import { HybridRecommender } from '../shared/algorithms/HybridRecommender';

describe('GetUserRecommendations', () => {
  let getUserRecommendations: GetUserRecommendations;
  let mockHybridRecommender: jest.Mocked<HybridRecommender>;
  let mockRedisClient: any;

  beforeEach(() => {
    mockHybridRecommender = {
      getHybridRecommendations: jest.fn(),
      getTrendingProducts: jest.fn()
    } as any;

    mockRedisClient = {
      get: jest.fn(),
      setEx: jest.fn()
    };

    getUserRecommendations = new GetUserRecommendations(mockHybridRecommender, mockRedisClient);
  });

  describe('execute', () => {
    it('debe lanzar error cuando falta userId', async () => {
      await expect(getUserRecommendations.execute({ userId: '' }))
        .rejects.toThrow('User ID is required for personalized recommendations');
    });

    it('debe retornar recomendaciones desde cache cuando existe', async () => {
      const cachedRecs = [
        { productSku: 'PROD-001', score: 0.9, source: 'hybrid' as const }
      ];
      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedRecs));

      const result = await getUserRecommendations.execute({ userId: 'user123' });

      expect(result.recommendations).toEqual(cachedRecs);
      expect(result.metadata.cacheHit).toBe(true);
      expect(mockHybridRecommender.getHybridRecommendations).not.toHaveBeenCalled();
    });

    it('debe obtener recomendaciones del algoritmo cuando no hay cache', async () => {
      const recommendations = [
        { productSku: 'PROD-001', score: 0.9, source: 'hybrid' as const },
        { productSku: 'PROD-002', score: 0.8, source: 'hybrid' as const }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockHybridRecommender.getHybridRecommendations.mockResolvedValue(recommendations);

      const result = await getUserRecommendations.execute({ userId: 'user123', limit: 10 });

      expect(mockHybridRecommender.getHybridRecommendations).toHaveBeenCalledWith('user123', 10);
      expect(result.recommendations).toEqual(recommendations);
      expect(result.metadata.cacheHit).toBe(false);
      expect(mockRedisClient.setEx).toHaveBeenCalled();
    });

    it('debe cachear resultados por 2 horas', async () => {
      const recommendations = [
        { productSku: 'PROD-001', score: 0.9, source: 'hybrid' as const }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockHybridRecommender.getHybridRecommendations.mockResolvedValue(recommendations);

      await getUserRecommendations.execute({ userId: 'user123' });

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        expect.stringContaining('user_recs:user123'),
        7200,
        JSON.stringify(recommendations)
      );
    });

    it('debe respetar el límite de recomendaciones', async () => {
      const recommendations = [
        { productSku: 'PROD-001', score: 0.9, source: 'hybrid' as const },
        { productSku: 'PROD-002', score: 0.8, source: 'hybrid' as const },
        { productSku: 'PROD-003', score: 0.7, source: 'hybrid' as const }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockHybridRecommender.getHybridRecommendations.mockResolvedValue(recommendations);

      const result = await getUserRecommendations.execute({ userId: 'user123', limit: 2 });

      expect(result.recommendations).toHaveLength(2);
      expect(result.recommendations[0].productSku).toBe('PROD-001');
      expect(result.recommendations[1].productSku).toBe('PROD-002');
    });

    it('debe usar trending products como fallback en caso de error', async () => {
      const trendingProducts = [
        { productSku: 'TREND-001', score: 0.95, source: 'trending' as const }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockHybridRecommender.getHybridRecommendations.mockRejectedValue(new Error('Algorithm error'));
      mockHybridRecommender.getTrendingProducts.mockResolvedValue(trendingProducts);

      const result = await getUserRecommendations.execute({ userId: 'user123' });

      expect(result.recommendations).toEqual(trendingProducts);
      expect(result.metadata.algorithm).toBe('fallback_trending');
      expect(result.metadata.cacheHit).toBe(false);
    });

    it('debe incluir metadata con información de procesamiento', async () => {
      const recommendations = [
        { productSku: 'PROD-001', score: 0.9, source: 'hybrid' as const }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockHybridRecommender.getHybridRecommendations.mockResolvedValue(recommendations);

      const result = await getUserRecommendations.execute({ userId: 'user123' });

      expect(result.metadata).toHaveProperty('totalCount');
      expect(result.metadata).toHaveProperty('algorithm');
      expect(result.metadata).toHaveProperty('cacheHit');
      expect(result.metadata).toHaveProperty('processingTime');
      expect(result.metadata.totalCount).toBe(1);
      expect(result.metadata.algorithm).toBe('hybrid');
    });

    it('debe manejar filtros en la clave de cache', async () => {
      const recommendations = [
        { productSku: 'PROD-001', score: 0.9, source: 'hybrid' as const }
      ];
      const filters = { category: 'laptop', brand: 'dell' };
      mockRedisClient.get.mockResolvedValue(null);
      mockHybridRecommender.getHybridRecommendations.mockResolvedValue(recommendations);

      await getUserRecommendations.execute({ userId: 'user123', filters });

      expect(mockRedisClient.get).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(filters))
      );
    });

    it('debe retornar array vacío cuando no hay recomendaciones', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockHybridRecommender.getHybridRecommendations.mockResolvedValue([]);

      const result = await getUserRecommendations.execute({ userId: 'user123' });

      expect(result.recommendations).toEqual([]);
      expect(result.metadata.totalCount).toBe(0);
    });

    it('debe usar límite por defecto de 10 cuando no se especifica', async () => {
      const recommendations = Array.from({ length: 15 }, (_, i) => ({
        productSku: `PROD-${i}`,
        score: 0.9 - i * 0.05,
        source: 'hybrid' as const
      }));
      mockRedisClient.get.mockResolvedValue(null);
      mockHybridRecommender.getHybridRecommendations.mockResolvedValue(recommendations);

      const result = await getUserRecommendations.execute({ userId: 'user123' });

      expect(mockHybridRecommender.getHybridRecommendations).toHaveBeenCalledWith('user123', 10);
      expect(result.recommendations).toHaveLength(10);
    });

    it('debe medir el tiempo de procesamiento correctamente', async () => {
      const recommendations = [
        { productSku: 'PROD-001', score: 0.9, source: 'hybrid' as const }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockHybridRecommender.getHybridRecommendations.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return recommendations;
      });

      const result = await getUserRecommendations.execute({ userId: 'user123' });

      expect(result.metadata.processingTime).toBeGreaterThan(0);
      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(50);
    });

    it('debe manejar filtros de rango de precio', async () => {
      const recommendations = [
        { productSku: 'PROD-001', score: 0.9, source: 'hybrid' as const }
      ];
      const filters = { priceRange: { min: 100, max: 500 } };
      mockRedisClient.get.mockResolvedValue(null);
      mockHybridRecommender.getHybridRecommendations.mockResolvedValue(recommendations);

      const result = await getUserRecommendations.execute({ userId: 'user123', filters });

      expect(result.recommendations).toBeDefined();
      expect(mockRedisClient.setEx).toHaveBeenCalled();
    });

    it('debe manejar múltiples filtros simultáneamente', async () => {
      const recommendations = [
        { productSku: 'PROD-001', score: 0.9, source: 'hybrid' as const }
      ];
      const filters = {
        category: 'laptop',
        brand: 'dell',
        priceRange: { min: 500, max: 1500 }
      };
      mockRedisClient.get.mockResolvedValue(null);
      mockHybridRecommender.getHybridRecommendations.mockResolvedValue(recommendations);

      const result = await getUserRecommendations.execute({ userId: 'user123', filters });

      expect(result.recommendations).toBeDefined();
      expect(mockRedisClient.get).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(filters))
      );
    });

    it('debe propagar errores del cliente Redis en fallback', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis connection error'));
      mockHybridRecommender.getTrendingProducts.mockResolvedValue([
        { productSku: 'TREND-001', score: 0.95, source: 'trending' as const }
      ]);

      const result = await getUserRecommendations.execute({ userId: 'user123' });

      expect(result.metadata.algorithm).toBe('fallback_trending');
      expect(result.recommendations).toHaveLength(1);
    });

    it('debe incluir metadata incluso cuando includeMetadata es false', async () => {
      const recommendations = [
        { productSku: 'PROD-001', score: 0.9, source: 'hybrid' as const }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockHybridRecommender.getHybridRecommendations.mockResolvedValue(recommendations);

      const result = await getUserRecommendations.execute({ 
        userId: 'user123', 
        includeMetadata: false 
      });

      expect(result.metadata).toBeDefined();
      expect(result.metadata.totalCount).toBe(1);
    });

    it('debe manejar usuarios con historial muy largo', async () => {
      const recommendations = Array.from({ length: 100 }, (_, i) => ({
        productSku: `PROD-${i}`,
        score: 0.9 - i * 0.001,
        source: 'hybrid' as const
      }));
      mockRedisClient.get.mockResolvedValue(null);
      mockHybridRecommender.getHybridRecommendations.mockResolvedValue(recommendations);

      const result = await getUserRecommendations.execute({ userId: 'power-user', limit: 50 });

      expect(result.recommendations).toHaveLength(50);
      expect(result.recommendations[0].score).toBeGreaterThan(result.recommendations[49].score);
    });

    it('debe invalidar cache cuando los filtros cambian', async () => {
      const recommendations = [
        { productSku: 'PROD-001', score: 0.9, source: 'hybrid' as const }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockHybridRecommender.getHybridRecommendations.mockResolvedValue(recommendations);

      await getUserRecommendations.execute({ userId: 'user123', filters: { category: 'laptop' } });
      await getUserRecommendations.execute({ userId: 'user123', filters: { category: 'tablet' } });

      expect(mockRedisClient.get).toHaveBeenCalledTimes(2);
      const calls = mockRedisClient.get.mock.calls;
      expect(calls[0][0]).not.toBe(calls[1][0]);
    });

    it('debe manejar scores negativos correctamente', async () => {
      const recommendations = [
        { productSku: 'PROD-001', score: -0.5, source: 'hybrid' as const }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockHybridRecommender.getHybridRecommendations.mockResolvedValue(recommendations);

      const result = await getUserRecommendations.execute({ userId: 'user123' });

      expect(result.recommendations[0].score).toBe(-0.5);
    });

    it('debe manejar productos con scores idénticos', async () => {
      const recommendations = [
        { productSku: 'PROD-001', score: 0.8, source: 'hybrid' as const },
        { productSku: 'PROD-002', score: 0.8, source: 'hybrid' as const },
        { productSku: 'PROD-003', score: 0.8, source: 'hybrid' as const }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockHybridRecommender.getHybridRecommendations.mockResolvedValue(recommendations);

      const result = await getUserRecommendations.execute({ userId: 'user123' });

      expect(result.recommendations).toHaveLength(3);
      result.recommendations.forEach(rec => {
        expect(rec.score).toBe(0.8);
      });
    });

    it('debe manejar userId con caracteres especiales', async () => {
      const recommendations = [
        { productSku: 'PROD-001', score: 0.9, source: 'hybrid' as const }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockHybridRecommender.getHybridRecommendations.mockResolvedValue(recommendations);

      const result = await getUserRecommendations.execute({ userId: 'user@email.com' });

      expect(mockHybridRecommender.getHybridRecommendations).toHaveBeenCalledWith('user@email.com', 10);
      expect(result.recommendations).toBeDefined();
    });

    it('debe cachear con TTL correcto de 7200 segundos', async () => {
      const recommendations = [
        { productSku: 'PROD-001', score: 0.9, source: 'hybrid' as const }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockHybridRecommender.getHybridRecommendations.mockResolvedValue(recommendations);

      await getUserRecommendations.execute({ userId: 'user123' });

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        expect.any(String),
        7200,
        expect.any(String)
      );
    });

    it('debe incluir source en todas las recomendaciones', async () => {
      const recommendations = [
        { productSku: 'PROD-001', score: 0.9, source: 'hybrid' as const },
        { productSku: 'PROD-002', score: 0.8, source: 'collaborative' as const },
        { productSku: 'PROD-003', score: 0.7, source: 'content' as const }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockHybridRecommender.getHybridRecommendations.mockResolvedValue(recommendations);

      const result = await getUserRecommendations.execute({ userId: 'user123' });

      result.recommendations.forEach(rec => {
        expect(rec.source).toBeDefined();
        expect(['hybrid', 'collaborative', 'content', 'popularity', 'trending']).toContain(rec.source);
      });
    });

    it('debe manejar fallback cuando cache está corrupto', async () => {
      const trendingProducts = [
        { productSku: 'TREND-001', score: 0.95, source: 'trending' as const }
      ];
      mockRedisClient.get.mockResolvedValue('invalid json {');
      mockHybridRecommender.getTrendingProducts.mockResolvedValue(trendingProducts);

      const result = await getUserRecommendations.execute({ userId: 'user123' });

      expect(result.metadata.algorithm).toBe('fallback_trending');
    });

    it('debe manejar límite de 0 correctamente', async () => {
      const recommendations = [
        { productSku: 'PROD-001', score: 0.9, source: 'hybrid' as const }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockHybridRecommender.getHybridRecommendations.mockResolvedValue(recommendations);

      const result = await getUserRecommendations.execute({ userId: 'user123', limit: 0 });

      expect(result.recommendations).toHaveLength(0);
    });

    it('debe manejar límite negativo como 0', async () => {
      const recommendations = [
        { productSku: 'PROD-001', score: 0.9, source: 'hybrid' as const }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockHybridRecommender.getHybridRecommendations.mockResolvedValue(recommendations);

      const result = await getUserRecommendations.execute({ userId: 'user123', limit: -5 });

      expect(result.recommendations).toHaveLength(0);
    });

    it('debe manejar filtros vacíos correctamente', async () => {
      const recommendations = [
        { productSku: 'PROD-001', score: 0.9, source: 'hybrid' as const }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockHybridRecommender.getHybridRecommendations.mockResolvedValue(recommendations);

      const result = await getUserRecommendations.execute({ 
        userId: 'user123', 
        filters: {} 
      });

      expect(result.recommendations).toBeDefined();
    });

    it('debe manejar filtros con valores null', async () => {
      const recommendations = [
        { productSku: 'PROD-001', score: 0.9, source: 'hybrid' as const }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockHybridRecommender.getHybridRecommendations.mockResolvedValue(recommendations);

      const result = await getUserRecommendations.execute({ 
        userId: 'user123', 
        filters: { category: undefined, brand: undefined } 
      });

      expect(result.recommendations).toBeDefined();
    });

    it('debe manejar concurrent requests para el mismo usuario', async () => {
      const recommendations = [
        { productSku: 'PROD-001', score: 0.9, source: 'hybrid' as const }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockHybridRecommender.getHybridRecommendations.mockResolvedValue(recommendations);

      const promises = [
        getUserRecommendations.execute({ userId: 'user123' }),
        getUserRecommendations.execute({ userId: 'user123' }),
        getUserRecommendations.execute({ userId: 'user123' })
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.recommendations).toBeDefined();
      });
    });

    it('debe incluir metadata de tiempo incluso con cache hit', async () => {
      const cachedRecs = [
        { productSku: 'PROD-001', score: 0.9, source: 'hybrid' as const }
      ];
      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedRecs));

      const result = await getUserRecommendations.execute({ userId: 'user123' });

      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.metadata.cacheHit).toBe(true);
    });

    it('debe manejar filtros de precio con min mayor que max', async () => {
      const recommendations = [
        { productSku: 'PROD-001', score: 0.9, source: 'hybrid' as const }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockHybridRecommender.getHybridRecommendations.mockResolvedValue(recommendations);

      const result = await getUserRecommendations.execute({ 
        userId: 'user123',
        filters: { priceRange: { min: 1000, max: 500 } }
      });

      expect(result.recommendations).toBeDefined();
    });

    it('debe manejar múltiples categorías en filtros', async () => {
      const recommendations = [
        { productSku: 'PROD-001', score: 0.9, source: 'hybrid' as const }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockHybridRecommender.getHybridRecommendations.mockResolvedValue(recommendations);

      const result = await getUserRecommendations.execute({ 
        userId: 'user123',
        filters: { category: 'laptop,tablet,smartphone' }
      });

      expect(result.recommendations).toBeDefined();
    });
  });
});
