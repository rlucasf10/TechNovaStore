/**
 * Tests para GetSessionRecommendations
 */

import { GetSessionRecommendations } from './GetSessionRecommendations';
import { HybridRecommender } from '../shared/algorithms/HybridRecommender';

describe('GetSessionRecommendations', () => {
  let getSessionRecommendations: GetSessionRecommendations;
  let mockHybridRecommender: jest.Mocked<HybridRecommender>;

  beforeEach(() => {
    mockHybridRecommender = {
      getSessionBasedRecommendations: jest.fn()
    } as any;

    getSessionRecommendations = new GetSessionRecommendations(mockHybridRecommender);
  });

  describe('execute', () => {
    it('debe lanzar error cuando falta sessionId', async () => {
      await expect(getSessionRecommendations.execute({ sessionId: '' }))
        .rejects.toThrow('Session ID is required for session-based recommendations');
    });

    it('debe retornar recomendaciones basadas en sesión', async () => {
      const recommendations = [
        { productSku: 'PROD-001', score: 0.9, source: 'content' as const },
        { productSku: 'PROD-002', score: 0.8, source: 'content' as const }
      ];
      mockHybridRecommender.getSessionBasedRecommendations.mockResolvedValue(recommendations);

      const result = await getSessionRecommendations.execute({ sessionId: 'session123' });

      expect(mockHybridRecommender.getSessionBasedRecommendations).toHaveBeenCalledWith('session123', undefined, 10);
      expect(result.recommendations).toEqual(recommendations);
      expect(result.metadata.algorithm).toBe('session_based');
    });

    it('debe incluir productSku cuando se proporciona', async () => {
      const recommendations = [
        { productSku: 'PROD-002', score: 0.9, source: 'content' as const }
      ];
      mockHybridRecommender.getSessionBasedRecommendations.mockResolvedValue(recommendations);

      await getSessionRecommendations.execute({ 
        sessionId: 'session123', 
        productSku: 'PROD-001' 
      });

      expect(mockHybridRecommender.getSessionBasedRecommendations).toHaveBeenCalledWith(
        'session123', 
        'PROD-001', 
        10
      );
    });

    it('debe respetar el límite especificado', async () => {
      const recommendations = [
        { productSku: 'PROD-001', score: 0.9, source: 'content' as const }
      ];
      mockHybridRecommender.getSessionBasedRecommendations.mockResolvedValue(recommendations);

      await getSessionRecommendations.execute({ 
        sessionId: 'session123', 
        limit: 5 
      });

      expect(mockHybridRecommender.getSessionBasedRecommendations).toHaveBeenCalledWith(
        'session123', 
        undefined, 
        5
      );
    });

    it('debe usar límite por defecto de 10', async () => {
      const recommendations = [
        { productSku: 'PROD-001', score: 0.9, source: 'content' as const }
      ];
      mockHybridRecommender.getSessionBasedRecommendations.mockResolvedValue(recommendations);

      await getSessionRecommendations.execute({ sessionId: 'session123' });

      expect(mockHybridRecommender.getSessionBasedRecommendations).toHaveBeenCalledWith(
        'session123', 
        undefined, 
        10
      );
    });

    it('debe incluir metadata con información de procesamiento', async () => {
      const recommendations = [
        { productSku: 'PROD-001', score: 0.9, source: 'content' as const }
      ];
      mockHybridRecommender.getSessionBasedRecommendations.mockResolvedValue(recommendations);

      const result = await getSessionRecommendations.execute({ sessionId: 'session123' });

      expect(result.metadata).toHaveProperty('totalCount');
      expect(result.metadata).toHaveProperty('algorithm');
      expect(result.metadata).toHaveProperty('cacheHit');
      expect(result.metadata).toHaveProperty('processingTime');
      expect(result.metadata.totalCount).toBe(1);
      expect(result.metadata.cacheHit).toBe(false);
    });

    it('debe medir el tiempo de procesamiento', async () => {
      const recommendations = [
        { productSku: 'PROD-001', score: 0.9, source: 'content' as const }
      ];
      mockHybridRecommender.getSessionBasedRecommendations.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return recommendations;
      });

      const result = await getSessionRecommendations.execute({ sessionId: 'session123' });

      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(50);
    });

    it('debe propagar errores del algoritmo', async () => {
      mockHybridRecommender.getSessionBasedRecommendations.mockRejectedValue(
        new Error('Session not found')
      );

      await expect(getSessionRecommendations.execute({ sessionId: 'invalid' }))
        .rejects.toThrow('Session not found');
    });

    it('debe retornar array vacío cuando no hay recomendaciones', async () => {
      mockHybridRecommender.getSessionBasedRecommendations.mockResolvedValue([]);

      const result = await getSessionRecommendations.execute({ sessionId: 'session123' });

      expect(result.recommendations).toEqual([]);
      expect(result.metadata.totalCount).toBe(0);
    });

    it('debe manejar sesiones nuevas sin historial', async () => {
      const recommendations = [
        { productSku: 'TREND-001', score: 0.95, source: 'trending' as const }
      ];
      mockHybridRecommender.getSessionBasedRecommendations.mockResolvedValue(recommendations);

      const result = await getSessionRecommendations.execute({ sessionId: 'new-session' });

      expect(result.recommendations).toBeDefined();
      expect(result.metadata.algorithm).toBe('session_based');
    });

    it('debe combinar producto actual con historial de sesión', async () => {
      const recommendations = [
        { productSku: 'PROD-002', score: 0.9, source: 'content' as const },
        { productSku: 'PROD-003', score: 0.85, source: 'content' as const }
      ];
      mockHybridRecommender.getSessionBasedRecommendations.mockResolvedValue(recommendations);

      const result = await getSessionRecommendations.execute({ 
        sessionId: 'session123',
        productSku: 'PROD-001',
        limit: 5
      });

      expect(result.recommendations).toHaveLength(2);
      expect(mockHybridRecommender.getSessionBasedRecommendations).toHaveBeenCalledWith(
        'session123',
        'PROD-001',
        5
      );
    });

    it('debe manejar límites pequeños', async () => {
      const recommendations = [
        { productSku: 'PROD-001', score: 0.9, source: 'content' as const }
      ];
      mockHybridRecommender.getSessionBasedRecommendations.mockResolvedValue(recommendations);

      const result = await getSessionRecommendations.execute({ 
        sessionId: 'session123',
        limit: 1
      });

      expect(result.recommendations).toHaveLength(1);
    });

    it('debe manejar sesiones con múltiples productos vistos', async () => {
      const recommendations = Array.from({ length: 5 }, (_, i) => ({
        productSku: `PROD-${i}`,
        score: 0.9 - i * 0.1,
        source: 'content' as const
      }));
      mockHybridRecommender.getSessionBasedRecommendations.mockResolvedValue(recommendations);

      const result = await getSessionRecommendations.execute({ sessionId: 'active-session' });

      expect(result.recommendations).toHaveLength(5);
    });
  });
});
