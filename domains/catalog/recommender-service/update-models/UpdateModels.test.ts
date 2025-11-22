/**
 * Tests para UpdateModels
 */

import { UpdateModels } from './UpdateModels';
import { ContentBasedFiltering } from '../shared/algorithms/ContentBasedFiltering';

describe('UpdateModels', () => {
  let updateModels: UpdateModels;
  let mockContentFilter: jest.Mocked<ContentBasedFiltering>;
  let mockRedisClient: any;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockContentFilter = {
      updateProductFeatures: jest.fn()
    } as any;

    mockRedisClient = {
      flushDb: jest.fn()
    };

    updateModels = new UpdateModels(mockContentFilter, mockRedisClient);

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('execute', () => {
    it('debe actualizar features de productos', async () => {
      mockContentFilter.updateProductFeatures.mockResolvedValue();
      mockRedisClient.flushDb.mockResolvedValue();

      await updateModels.execute();

      expect(mockContentFilter.updateProductFeatures).toHaveBeenCalled();
    });

    it('debe limpiar cache de Redis después de actualizar', async () => {
      mockContentFilter.updateProductFeatures.mockResolvedValue();
      mockRedisClient.flushDb.mockResolvedValue();

      await updateModels.execute();

      expect(mockRedisClient.flushDb).toHaveBeenCalled();
    });

    it('debe ejecutar actualización en el orden correcto', async () => {
      const callOrder: string[] = [];
      
      mockContentFilter.updateProductFeatures.mockImplementation(async () => {
        callOrder.push('updateFeatures');
      });
      
      mockRedisClient.flushDb.mockImplementation(async () => {
        callOrder.push('flushCache');
      });

      await updateModels.execute();

      expect(callOrder).toEqual(['updateFeatures', 'flushCache']);
    });

    it('debe loggear inicio de actualización', async () => {
      mockContentFilter.updateProductFeatures.mockResolvedValue();
      mockRedisClient.flushDb.mockResolvedValue();

      await updateModels.execute();

      expect(consoleLogSpy).toHaveBeenCalledWith('Starting model update...');
    });

    it('debe loggear finalización exitosa', async () => {
      mockContentFilter.updateProductFeatures.mockResolvedValue();
      mockRedisClient.flushDb.mockResolvedValue();

      await updateModels.execute();

      expect(consoleLogSpy).toHaveBeenCalledWith('Model update completed');
    });

    it('debe propagar errores de actualización de features', async () => {
      mockContentFilter.updateProductFeatures.mockRejectedValue(
        new Error('Feature update failed')
      );

      await expect(updateModels.execute()).rejects.toThrow('Feature update failed');
    });

    it('debe propagar errores de limpieza de cache', async () => {
      mockContentFilter.updateProductFeatures.mockResolvedValue();
      mockRedisClient.flushDb.mockRejectedValue(new Error('Redis error'));

      await expect(updateModels.execute()).rejects.toThrow('Redis error');
    });

    it('debe loggear errores cuando fallan', async () => {
      const error = new Error('Update failed');
      mockContentFilter.updateProductFeatures.mockRejectedValue(error);

      await expect(updateModels.execute()).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating models:', error);
    });



    it('debe completar actualización rápidamente con pocos productos', async () => {
      mockContentFilter.updateProductFeatures.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      mockRedisClient.flushDb.mockResolvedValue();

      const startTime = Date.now();
      await updateModels.execute();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500);
    });

    it('debe limpiar completamente la base de datos de cache', async () => {
      mockContentFilter.updateProductFeatures.mockResolvedValue();
      mockRedisClient.flushDb.mockResolvedValue();

      await updateModels.execute();

      expect(mockRedisClient.flushDb).toHaveBeenCalledTimes(1);
    });

    it('debe ser idempotente - múltiples ejecuciones deben funcionar', async () => {
      mockContentFilter.updateProductFeatures.mockResolvedValue();
      mockRedisClient.flushDb.mockResolvedValue();

      await updateModels.execute();
      await updateModels.execute();
      await updateModels.execute();

      expect(mockContentFilter.updateProductFeatures).toHaveBeenCalledTimes(3);
      expect(mockRedisClient.flushDb).toHaveBeenCalledTimes(3);
    });

    it('debe manejar actualización parcial cuando Redis falla', async () => {
      mockContentFilter.updateProductFeatures.mockResolvedValue();
      mockRedisClient.flushDb.mockRejectedValue(new Error('Redis unavailable'));

      await expect(updateModels.execute()).rejects.toThrow('Redis unavailable');
      
      // Features fueron actualizadas antes del error
      expect(mockContentFilter.updateProductFeatures).toHaveBeenCalled();
    });
  });
});
