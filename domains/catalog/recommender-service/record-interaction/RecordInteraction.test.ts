/**
 * Tests para RecordInteraction
 */

import { RecordInteraction } from './RecordInteraction';
import { HybridRecommender } from '../shared/algorithms/HybridRecommender';

describe('RecordInteraction', () => {
  let recordInteraction: RecordInteraction;
  let mockHybridRecommender: jest.Mocked<HybridRecommender>;
  let mockRedisClient: any;

  beforeEach(() => {
    mockHybridRecommender = {
      recordInteraction: jest.fn()
    } as any;

    mockRedisClient = {
      keys: jest.fn(),
      del: jest.fn()
    };

    recordInteraction = new RecordInteraction(mockHybridRecommender, mockRedisClient);
  });

  describe('execute', () => {
    it('debe registrar interacción correctamente', async () => {
      mockRedisClient.keys.mockResolvedValue([]);

      await recordInteraction.execute({
        userId: 'user123',
        productSku: 'PROD-001',
        interactionType: 'view'
      });

      expect(mockHybridRecommender.recordInteraction).toHaveBeenCalledWith(
        'user123',
        'PROD-001',
        'view',
        undefined
      );
    });

    it('debe incluir metadata cuando se proporciona', async () => {
      const metadata = { source: 'search', query: 'laptop' };
      mockRedisClient.keys.mockResolvedValue([]);

      await recordInteraction.execute({
        userId: 'user123',
        productSku: 'PROD-001',
        interactionType: 'view',
        metadata
      });

      expect(mockHybridRecommender.recordInteraction).toHaveBeenCalledWith(
        'user123',
        'PROD-001',
        'view',
        metadata
      );
    });

    it('debe invalidar caches del usuario después de registrar', async () => {
      const cacheKeys = ['user_recs:user123:10', 'recommendations:user123:filters'];
      mockRedisClient.keys.mockResolvedValue(cacheKeys);

      await recordInteraction.execute({
        userId: 'user123',
        productSku: 'PROD-001',
        interactionType: 'purchase'
      });

      expect(mockRedisClient.keys).toHaveBeenCalledWith('user_recs:user123:*');
      expect(mockRedisClient.keys).toHaveBeenCalledWith('recommendations:user123:*');
      expect(mockRedisClient.del).toHaveBeenCalledWith(cacheKeys);
    });

    it('debe manejar diferentes tipos de interacción', async () => {
      mockRedisClient.keys.mockResolvedValue([]);

      const interactionTypes: Array<'view' | 'purchase' | 'cart_add' | 'wishlist' | 'search'> = [
        'view', 'purchase', 'cart_add', 'wishlist', 'search'
      ];

      for (const type of interactionTypes) {
        await recordInteraction.execute({
          userId: 'user123',
          productSku: 'PROD-001',
          interactionType: type
        });

        expect(mockHybridRecommender.recordInteraction).toHaveBeenCalledWith(
          'user123',
          'PROD-001',
          type,
          undefined
        );
      }
    });

    it('debe propagar errores del algoritmo', async () => {
      mockHybridRecommender.recordInteraction.mockRejectedValue(
        new Error('Database error')
      );

      await expect(recordInteraction.execute({
        userId: 'user123',
        productSku: 'PROD-001',
        interactionType: 'view'
      })).rejects.toThrow('Database error');
    });

    it('debe manejar errores al invalidar cache sin fallar', async () => {
      mockRedisClient.keys.mockRejectedValue(new Error('Redis error'));
      mockHybridRecommender.recordInteraction.mockResolvedValue();

      await expect(recordInteraction.execute({
        userId: 'user123',
        productSku: 'PROD-001',
        interactionType: 'view'
      })).resolves.not.toThrow();
    });

    it('debe invalidar múltiples patrones de cache', async () => {
      mockRedisClient.keys.mockResolvedValue(['key1', 'key2']);

      await recordInteraction.execute({
        userId: 'user123',
        productSku: 'PROD-001',
        interactionType: 'purchase'
      });

      expect(mockRedisClient.keys).toHaveBeenCalledTimes(2);
      expect(mockRedisClient.del).toHaveBeenCalledTimes(2);
    });

    it('debe no intentar eliminar cuando no hay keys', async () => {
      mockRedisClient.keys.mockResolvedValue([]);

      await recordInteraction.execute({
        userId: 'user123',
        productSku: 'PROD-001',
        interactionType: 'view'
      });

      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });

    it('debe registrar interacción de compra con metadata de precio', async () => {
      const metadata = { price: 999.99, currency: 'EUR' };
      mockRedisClient.keys.mockResolvedValue([]);

      await recordInteraction.execute({
        userId: 'user123',
        productSku: 'PROD-001',
        interactionType: 'purchase',
        metadata
      });

      expect(mockHybridRecommender.recordInteraction).toHaveBeenCalledWith(
        'user123',
        'PROD-001',
        'purchase',
        metadata
      );
    });

    it('debe registrar interacción de búsqueda con query', async () => {
      const metadata = { query: 'laptop gaming', resultsCount: 15 };
      mockRedisClient.keys.mockResolvedValue([]);

      await recordInteraction.execute({
        userId: 'user123',
        productSku: 'PROD-001',
        interactionType: 'search',
        metadata
      });

      expect(mockHybridRecommender.recordInteraction).toHaveBeenCalledWith(
        'user123',
        'PROD-001',
        'search',
        metadata
      );
    });

    it('debe manejar múltiples interacciones del mismo usuario', async () => {
      mockRedisClient.keys.mockResolvedValue([]);

      await recordInteraction.execute({
        userId: 'user123',
        productSku: 'PROD-001',
        interactionType: 'view'
      });

      await recordInteraction.execute({
        userId: 'user123',
        productSku: 'PROD-002',
        interactionType: 'cart_add'
      });

      expect(mockHybridRecommender.recordInteraction).toHaveBeenCalledTimes(2);
    });

    it('debe invalidar cache específico del usuario', async () => {
      const user1Keys = ['user_recs:user1:10'];
      const user2Keys = ['user_recs:user2:10'];
      
      mockRedisClient.keys
        .mockResolvedValueOnce(user1Keys)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(user2Keys)
        .mockResolvedValueOnce([]);

      await recordInteraction.execute({
        userId: 'user1',
        productSku: 'PROD-001',
        interactionType: 'view'
      });

      await recordInteraction.execute({
        userId: 'user2',
        productSku: 'PROD-001',
        interactionType: 'view'
      });

      expect(mockRedisClient.del).toHaveBeenCalledWith(user1Keys);
      expect(mockRedisClient.del).toHaveBeenCalledWith(user2Keys);
    });

    it('debe registrar interacción con metadata compleja', async () => {
      const metadata = {
        sessionId: 'session123',
        referrer: 'search',
        timestamp: new Date().toISOString(),
        deviceType: 'mobile'
      };
      mockRedisClient.keys.mockResolvedValue([]);

      await recordInteraction.execute({
        userId: 'user123',
        productSku: 'PROD-001',
        interactionType: 'view',
        metadata
      });

      expect(mockHybridRecommender.recordInteraction).toHaveBeenCalledWith(
        'user123',
        'PROD-001',
        'view',
        metadata
      );
    });
  });
});
