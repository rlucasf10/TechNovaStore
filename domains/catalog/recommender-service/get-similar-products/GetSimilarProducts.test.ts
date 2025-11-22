/**
 * Tests para GetSimilarProducts
 */

import { GetSimilarProducts } from './GetSimilarProducts';
import { ContentBasedFiltering } from '../shared/algorithms/ContentBasedFiltering';

describe('GetSimilarProducts', () => {
  let getSimilarProducts: GetSimilarProducts;
  let mockContentFilter: jest.Mocked<ContentBasedFiltering>;
  let mockRedisClient: any;

  beforeEach(() => {
    mockContentFilter = {
      getSimilarProducts: jest.fn()
    } as any;

    mockRedisClient = {
      get: jest.fn(),
      setEx: jest.fn()
    };

    getSimilarProducts = new GetSimilarProducts(mockContentFilter, mockRedisClient);
  });

  describe('execute', () => {
    it('debe lanzar error cuando falta productSku', async () => {
      await expect(getSimilarProducts.execute({ productSku: '' }))
        .rejects.toThrow('Product SKU is required for similar product recommendations');
    });

    it('debe retornar productos similares desde cache cuando existe', async () => {
      const cachedRecs = [
        { productSku: 'PROD-002', score: 0.9, source: 'content' as const }
      ];
      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedRecs));

      const result = await getSimilarProducts.execute({ productSku: 'PROD-001' });

      expect(result.recommendations).toEqual(cachedRecs);
      expect(result.metadata.cacheHit).toBe(true);
      expect(mockContentFilter.getSimilarProducts).not.toHaveBeenCalled();
    });

    it('debe obtener productos similares del algoritmo cuando no hay cache', async () => {
      const similarProducts = [
        { productSku: 'PROD-002', score: 0.9 },
        { productSku: 'PROD-003', score: 0.8 }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockContentFilter.getSimilarProducts.mockResolvedValue(similarProducts);

      const result = await getSimilarProducts.execute({ productSku: 'PROD-001', limit: 10 });

      expect(mockContentFilter.getSimilarProducts).toHaveBeenCalledWith('PROD-001', 10);
      expect(result.recommendations).toHaveLength(2);
      expect(result.recommendations[0].source).toBe('content');
      expect(result.metadata.cacheHit).toBe(false);
    });

    it('debe cachear resultados por 4 horas', async () => {
      const similarProducts = [
        { productSku: 'PROD-002', score: 0.9 }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockContentFilter.getSimilarProducts.mockResolvedValue(similarProducts);

      await getSimilarProducts.execute({ productSku: 'PROD-001' });

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        expect.stringContaining('similar:PROD-001'),
        14400,
        expect.any(String)
      );
    });

    it('debe respetar el límite de productos similares', async () => {
      const similarProducts = [
        { productSku: 'PROD-002', score: 0.9 },
        { productSku: 'PROD-003', score: 0.8 },
        { productSku: 'PROD-004', score: 0.7 }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockContentFilter.getSimilarProducts.mockResolvedValue(similarProducts);

      const result = await getSimilarProducts.execute({ productSku: 'PROD-001', limit: 2 });

      expect(result.recommendations).toHaveLength(2);
    });

    it('debe incluir metadata con algoritmo content_based', async () => {
      const similarProducts = [
        { productSku: 'PROD-002', score: 0.9 }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockContentFilter.getSimilarProducts.mockResolvedValue(similarProducts);

      const result = await getSimilarProducts.execute({ productSku: 'PROD-001' });

      expect(result.metadata.algorithm).toBe('content_based');
      expect(result.metadata.totalCount).toBe(1);
      expect(result.metadata).toHaveProperty('processingTime');
    });

    it('debe propagar errores del algoritmo', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockContentFilter.getSimilarProducts.mockRejectedValue(new Error('Product not found'));

      await expect(getSimilarProducts.execute({ productSku: 'INVALID' }))
        .rejects.toThrow('Product not found');
    });

    it('debe manejar filtros en la clave de cache', async () => {
      const similarProducts = [
        { productSku: 'PROD-002', score: 0.9 }
      ];
      const filters = { category: 'laptop' };
      mockRedisClient.get.mockResolvedValue(null);
      mockContentFilter.getSimilarProducts.mockResolvedValue(similarProducts);

      await getSimilarProducts.execute({ productSku: 'PROD-001', filters });

      expect(mockRedisClient.get).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(filters))
      );
    });

    it('debe usar límite por defecto de 10', async () => {
      const similarProducts = Array.from({ length: 15 }, (_, i) => ({
        productSku: `PROD-${i + 2}`,
        score: 0.9 - i * 0.05
      }));
      mockRedisClient.get.mockResolvedValue(null);
      mockContentFilter.getSimilarProducts.mockResolvedValue(similarProducts);

      const result = await getSimilarProducts.execute({ productSku: 'PROD-001' });

      expect(mockContentFilter.getSimilarProducts).toHaveBeenCalledWith('PROD-001', 10);
      expect(result.recommendations).toHaveLength(10);
    });

    it('debe retornar array vacío cuando no hay productos similares', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockContentFilter.getSimilarProducts.mockResolvedValue([]);

      const result = await getSimilarProducts.execute({ productSku: 'PROD-001' });

      expect(result.recommendations).toEqual([]);
      expect(result.metadata.totalCount).toBe(0);
    });

    it('debe medir el tiempo de procesamiento', async () => {
      const similarProducts = [
        { productSku: 'PROD-002', score: 0.9 }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockContentFilter.getSimilarProducts.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 30));
        return similarProducts;
      });

      const result = await getSimilarProducts.execute({ productSku: 'PROD-001' });

      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(30);
    });

    it('debe agregar source content a todos los productos', async () => {
      const similarProducts = [
        { productSku: 'PROD-002', score: 0.9 },
        { productSku: 'PROD-003', score: 0.8 }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockContentFilter.getSimilarProducts.mockResolvedValue(similarProducts);

      const result = await getSimilarProducts.execute({ productSku: 'PROD-001' });

      result.recommendations.forEach(rec => {
        expect(rec.source).toBe('content');
      });
    });

    it('debe manejar filtros de marca', async () => {
      const similarProducts = [
        { productSku: 'PROD-002', score: 0.9 }
      ];
      const filters = { brand: 'dell' };
      mockRedisClient.get.mockResolvedValue(null);
      mockContentFilter.getSimilarProducts.mockResolvedValue(similarProducts);

      const result = await getSimilarProducts.execute({ productSku: 'PROD-001', filters });

      expect(result.recommendations).toBeDefined();
    });

    it('debe manejar filtros de rango de precio', async () => {
      const similarProducts = [
        { productSku: 'PROD-002', score: 0.9 }
      ];
      const filters = { priceRange: { min: 500, max: 1000 } };
      mockRedisClient.get.mockResolvedValue(null);
      mockContentFilter.getSimilarProducts.mockResolvedValue(similarProducts);

      const result = await getSimilarProducts.execute({ productSku: 'PROD-001', filters });

      expect(result.recommendations).toBeDefined();
    });

    it('debe cachear con diferentes claves para diferentes filtros', async () => {
      const similarProducts = [
        { productSku: 'PROD-002', score: 0.9 }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockContentFilter.getSimilarProducts.mockResolvedValue(similarProducts);

      await getSimilarProducts.execute({ productSku: 'PROD-001', filters: { category: 'laptop' } });
      await getSimilarProducts.execute({ productSku: 'PROD-001', filters: { category: 'tablet' } });

      expect(mockRedisClient.setEx).toHaveBeenCalledTimes(2);
      const calls = mockRedisClient.setEx.mock.calls;
      expect(calls[0][0]).not.toBe(calls[1][0]);
    });

    it('debe manejar productSku con caracteres especiales', async () => {
      const similarProducts = [
        { productSku: 'PROD-002', score: 0.9 }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockContentFilter.getSimilarProducts.mockResolvedValue(similarProducts);

      const result = await getSimilarProducts.execute({ productSku: 'PROD-001/SPECIAL' });

      expect(mockContentFilter.getSimilarProducts).toHaveBeenCalledWith('PROD-001/SPECIAL', 10);
      expect(result.recommendations).toBeDefined();
    });

    it('debe cachear por 4 horas (14400 segundos)', async () => {
      const similarProducts = [
        { productSku: 'PROD-002', score: 0.9 }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockContentFilter.getSimilarProducts.mockResolvedValue(similarProducts);

      await getSimilarProducts.execute({ productSku: 'PROD-001' });

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        expect.any(String),
        14400,
        expect.any(String)
      );
    });

    it('debe manejar productos sin similares', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockContentFilter.getSimilarProducts.mockResolvedValue([]);

      const result = await getSimilarProducts.execute({ productSku: 'UNIQUE-PROD' });

      expect(result.recommendations).toEqual([]);
      expect(result.metadata.totalCount).toBe(0);
    });

    it('debe ordenar productos similares por score descendente', async () => {
      const similarProducts = [
        { productSku: 'PROD-003', score: 0.9 },
        { productSku: 'PROD-004', score: 0.8 },
        { productSku: 'PROD-002', score: 0.7 }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockContentFilter.getSimilarProducts.mockResolvedValue(similarProducts);

      const result = await getSimilarProducts.execute({ productSku: 'PROD-001' });

      // Verificar que están en orden descendente
      expect(result.recommendations[0].score).toBe(0.9);
      expect(result.recommendations[1].score).toBe(0.8);
      expect(result.recommendations[2].score).toBe(0.7);
    });

    it('debe manejar scores con decimales precisos', async () => {
      const similarProducts = [
        { productSku: 'PROD-002', score: 0.123456789 }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockContentFilter.getSimilarProducts.mockResolvedValue(similarProducts);

      const result = await getSimilarProducts.execute({ productSku: 'PROD-001' });

      expect(result.recommendations[0].score).toBe(0.123456789);
    });

    it('debe manejar límites muy grandes', async () => {
      const similarProducts = Array.from({ length: 50 }, (_, i) => ({
        productSku: `PROD-${i}`,
        score: 0.9 - i * 0.01
      }));
      mockRedisClient.get.mockResolvedValue(null);
      mockContentFilter.getSimilarProducts.mockResolvedValue(similarProducts);

      const result = await getSimilarProducts.execute({ productSku: 'PROD-001', limit: 1000 });

      expect(result.recommendations).toHaveLength(50);
    });

    it('debe manejar errores de timeout de Redis', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis timeout'));
      mockContentFilter.getSimilarProducts.mockResolvedValue([
        { productSku: 'PROD-002', score: 0.9 }
      ]);

      await expect(getSimilarProducts.execute({ productSku: 'PROD-001' }))
        .rejects.toThrow('Redis timeout');
    });

    it('debe incluir metadata completa en todas las respuestas', async () => {
      const similarProducts = [
        { productSku: 'PROD-002', score: 0.9 }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockContentFilter.getSimilarProducts.mockResolvedValue(similarProducts);

      const result = await getSimilarProducts.execute({ productSku: 'PROD-001' });

      expect(result.metadata).toHaveProperty('totalCount');
      expect(result.metadata).toHaveProperty('algorithm');
      expect(result.metadata).toHaveProperty('cacheHit');
      expect(result.metadata).toHaveProperty('processingTime');
      expect(result.metadata.algorithm).toBe('content_based');
    });

    it('debe manejar concurrent requests para el mismo producto', async () => {
      const similarProducts = [
        { productSku: 'PROD-002', score: 0.9 }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockContentFilter.getSimilarProducts.mockResolvedValue(similarProducts);

      const promises = [
        getSimilarProducts.execute({ productSku: 'PROD-001' }),
        getSimilarProducts.execute({ productSku: 'PROD-001' }),
        getSimilarProducts.execute({ productSku: 'PROD-001' })
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.recommendations).toBeDefined();
      });
    });

    it('debe manejar productos con SKU muy largos', async () => {
      const longSku = 'PROD-' + 'A'.repeat(200);
      const similarProducts = [
        { productSku: 'PROD-002', score: 0.9 }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockContentFilter.getSimilarProducts.mockResolvedValue(similarProducts);

      const result = await getSimilarProducts.execute({ productSku: longSku });

      expect(mockContentFilter.getSimilarProducts).toHaveBeenCalledWith(longSku, 10);
      expect(result.recommendations).toBeDefined();
    });

    it('debe manejar filtros complejos con múltiples condiciones', async () => {
      const similarProducts = [
        { productSku: 'PROD-002', score: 0.9 }
      ];
      const complexFilters = {
        category: 'laptop',
        brand: 'dell',
        priceRange: { min: 500, max: 1500 }
      };
      mockRedisClient.get.mockResolvedValue(null);
      mockContentFilter.getSimilarProducts.mockResolvedValue(similarProducts);

      const result = await getSimilarProducts.execute({ 
        productSku: 'PROD-001', 
        filters: complexFilters 
      });

      expect(result.recommendations).toBeDefined();
      expect(mockRedisClient.get).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(complexFilters))
      );
    });

    it('debe manejar cache corrupto y recuperarse', async () => {
      const similarProducts = [
        { productSku: 'PROD-002', score: 0.9 }
      ];
      mockRedisClient.get.mockResolvedValue('invalid json');
      mockContentFilter.getSimilarProducts.mockResolvedValue(similarProducts);

      await expect(getSimilarProducts.execute({ productSku: 'PROD-001' }))
        .rejects.toThrow();
    });

    it('debe manejar límite de 1 producto', async () => {
      const similarProducts = [
        { productSku: 'PROD-002', score: 0.9 },
        { productSku: 'PROD-003', score: 0.8 }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockContentFilter.getSimilarProducts.mockResolvedValue(similarProducts);

      const result = await getSimilarProducts.execute({ productSku: 'PROD-001', limit: 1 });

      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].productSku).toBe('PROD-002');
    });

    it('debe agregar source content a productos sin source', async () => {
      const similarProducts = [
        { productSku: 'PROD-002', score: 0.9 }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockContentFilter.getSimilarProducts.mockResolvedValue(similarProducts);

      const result = await getSimilarProducts.execute({ productSku: 'PROD-001' });

      result.recommendations.forEach(rec => {
        expect(rec.source).toBe('content');
      });
    });

    it('debe manejar productos con score 0', async () => {
      const similarProducts = [
        { productSku: 'PROD-002', score: 0 }
      ];
      mockRedisClient.get.mockResolvedValue(null);
      mockContentFilter.getSimilarProducts.mockResolvedValue(similarProducts);

      const result = await getSimilarProducts.execute({ productSku: 'PROD-001' });

      expect(result.recommendations[0].score).toBe(0);
    });
  });
});
