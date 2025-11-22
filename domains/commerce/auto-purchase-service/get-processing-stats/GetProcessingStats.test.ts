/**
 * Tests para GetProcessingStats
 * 
 * Verifica la obtención de estadísticas de procesamiento del sistema
 */

import { GetProcessingStats, ProcessingStats } from './GetProcessingStats';

describe('GetProcessingStats', () => {
  describe('execute', () => {
    it('debería retornar estadísticas con compras activas vacías', () => {
      // Arrange
      const activePurchases = new Set<number>();
      const maxConcurrent = 5;
      const enableConfirmation = true;
      const getStats = new GetProcessingStats(activePurchases, maxConcurrent, enableConfirmation);

      // Act
      const stats = getStats.execute();

      // Assert
      expect(stats).toEqual({
        activePurchases: 0,
        maxConcurrent: 5,
        enableConfirmationHandling: true
      });
    });

    it('debería retornar estadísticas con compras activas', () => {
      // Arrange
      const activePurchases = new Set<number>([1, 2, 3]);
      const maxConcurrent = 10;
      const enableConfirmation = false;
      const getStats = new GetProcessingStats(activePurchases, maxConcurrent, enableConfirmation);

      // Act
      const stats = getStats.execute();

      // Assert
      expect(stats).toEqual({
        activePurchases: 3,
        maxConcurrent: 10,
        enableConfirmationHandling: false
      });
    });

    it('debería reflejar cambios en el conjunto de compras activas', () => {
      // Arrange
      const activePurchases = new Set<number>([1, 2]);
      const getStats = new GetProcessingStats(activePurchases, 5, true);

      // Act
      const stats1 = getStats.execute();
      
      activePurchases.add(3);
      activePurchases.add(4);
      const stats2 = getStats.execute();
      
      activePurchases.delete(1);
      const stats3 = getStats.execute();

      // Assert
      expect(stats1.activePurchases).toBe(2);
      expect(stats2.activePurchases).toBe(4);
      expect(stats3.activePurchases).toBe(3);
    });

    it('debería manejar maxConcurrent de 1', () => {
      // Arrange
      const activePurchases = new Set<number>([1]);
      const getStats = new GetProcessingStats(activePurchases, 1, true);

      // Act
      const stats = getStats.execute();

      // Assert
      expect(stats.maxConcurrent).toBe(1);
      expect(stats.activePurchases).toBe(1);
    });

    it('debería manejar maxConcurrent alto', () => {
      // Arrange
      const activePurchases = new Set<number>();
      const getStats = new GetProcessingStats(activePurchases, 100, true);

      // Act
      const stats = getStats.execute();

      // Assert
      expect(stats.maxConcurrent).toBe(100);
    });

    it('debería retornar enableConfirmationHandling correctamente', () => {
      // Arrange
      const activePurchases = new Set<number>();
      const getStatsEnabled = new GetProcessingStats(activePurchases, 5, true);
      const getStatsDisabled = new GetProcessingStats(activePurchases, 5, false);

      // Act
      const statsEnabled = getStatsEnabled.execute();
      const statsDisabled = getStatsDisabled.execute();

      // Assert
      expect(statsEnabled.enableConfirmationHandling).toBe(true);
      expect(statsDisabled.enableConfirmationHandling).toBe(false);
    });

    it('debería manejar conjunto de compras activas con muchos elementos', () => {
      // Arrange
      const activePurchases = new Set<number>();
      for (let i = 1; i <= 50; i++) {
        activePurchases.add(i);
      }
      const getStats = new GetProcessingStats(activePurchases, 100, true);

      // Act
      const stats = getStats.execute();

      // Assert
      expect(stats.activePurchases).toBe(50);
    });

    it('debería retornar objeto con todas las propiedades requeridas', () => {
      // Arrange
      const activePurchases = new Set<number>([1, 2, 3]);
      const getStats = new GetProcessingStats(activePurchases, 5, true);

      // Act
      const stats = getStats.execute();

      // Assert
      expect(stats).toHaveProperty('activePurchases');
      expect(stats).toHaveProperty('maxConcurrent');
      expect(stats).toHaveProperty('enableConfirmationHandling');
      expect(Object.keys(stats).length).toBe(3);
    });

    it('debería retornar tipos correctos para cada propiedad', () => {
      // Arrange
      const activePurchases = new Set<number>([1, 2]);
      const getStats = new GetProcessingStats(activePurchases, 5, true);

      // Act
      const stats = getStats.execute();

      // Assert
      expect(typeof stats.activePurchases).toBe('number');
      expect(typeof stats.maxConcurrent).toBe('number');
      expect(typeof stats.enableConfirmationHandling).toBe('boolean');
    });

    it('debería ser idempotente', () => {
      // Arrange
      const activePurchases = new Set<number>([1, 2, 3]);
      const getStats = new GetProcessingStats(activePurchases, 5, true);

      // Act
      const stats1 = getStats.execute();
      const stats2 = getStats.execute();
      const stats3 = getStats.execute();

      // Assert
      expect(stats1).toEqual(stats2);
      expect(stats2).toEqual(stats3);
    });

    it('debería completarse instantáneamente', () => {
      // Arrange
      const activePurchases = new Set<number>();
      for (let i = 1; i <= 1000; i++) {
        activePurchases.add(i);
      }
      const getStats = new GetProcessingStats(activePurchases, 100, true);
      const startTime = Date.now();

      // Act
      getStats.execute();

      // Assert
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10); // Menos de 10ms
    });

    it('debería manejar IDs de orden no secuenciales', () => {
      // Arrange
      const activePurchases = new Set<number>([100, 500, 1000, 5000]);
      const getStats = new GetProcessingStats(activePurchases, 10, true);

      // Act
      const stats = getStats.execute();

      // Assert
      expect(stats.activePurchases).toBe(4);
    });

    it('debería manejar maxConcurrent igual a activePurchases', () => {
      // Arrange
      const activePurchases = new Set<number>([1, 2, 3, 4, 5]);
      const getStats = new GetProcessingStats(activePurchases, 5, true);

      // Act
      const stats = getStats.execute();

      // Assert
      expect(stats.activePurchases).toBe(5);
      expect(stats.maxConcurrent).toBe(5);
    });

    it('debería manejar activePurchases mayor que maxConcurrent', () => {
      // Arrange
      const activePurchases = new Set<number>([1, 2, 3, 4, 5, 6, 7]);
      const getStats = new GetProcessingStats(activePurchases, 5, true);

      // Act
      const stats = getStats.execute();

      // Assert
      expect(stats.activePurchases).toBe(7);
      expect(stats.maxConcurrent).toBe(5);
      expect(stats.activePurchases).toBeGreaterThan(stats.maxConcurrent);
    });
  });
});
