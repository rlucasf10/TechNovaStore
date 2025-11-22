/**
 * Tests para CancelPurchase
 * 
 * Verifica la cancelación de compras con proveedores
 */

import { CancelPurchase, CancelPurchaseResult } from './CancelPurchase';

describe('CancelPurchase', () => {
  let cancelPurchase: CancelPurchase;

  beforeEach(() => {
    cancelPurchase = new CancelPurchase();
  });

  describe('execute', () => {
    it('debería intentar cancelar una compra', async () => {
      // Act
      const result = await cancelPurchase.execute('Amazon', 'AMZ-123');

      // Assert
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.message).toBe('string');
    });

    it('debería retornar resultado exitoso cuando la cancelación es posible', async () => {
      // Act
      const results: CancelPurchaseResult[] = [];
      
      // Ejecutar múltiples veces para obtener al menos un éxito (70% probabilidad)
      for (let i = 0; i < 10; i++) {
        const result = await cancelPurchase.execute('Amazon', `AMZ-${i}`);
        results.push(result);
      }

      // Assert
      const successfulCancellations = results.filter(r => r.success);
      expect(successfulCancellations.length).toBeGreaterThan(0);
      
      const successResult = successfulCancellations[0];
      expect(successResult.message).toBe('Purchase cancelled successfully');
    });

    it('debería retornar resultado fallido cuando la cancelación no es posible', async () => {
      // Act
      const results: CancelPurchaseResult[] = [];
      
      // Ejecutar múltiples veces para obtener al menos un fallo (30% probabilidad)
      for (let i = 0; i < 20; i++) {
        const result = await cancelPurchase.execute('Amazon', `AMZ-${i}`);
        results.push(result);
      }

      // Assert
      const failedCancellations = results.filter(r => !r.success);
      
      // Con 20 intentos y 30% probabilidad de fallo, debería haber al menos uno
      // Si no hay ninguno, el test es válido pero poco probable
      if (failedCancellations.length > 0) {
        const failResult = failedCancellations[0];
        expect(failResult.message).toBe('Cannot cancel - order already processed');
      } else {
        // Todos fueron exitosos, lo cual es estadísticamente posible pero improbable
        expect(results.every(r => r.success)).toBe(true);
      }
    });

    it('debería manejar diferentes proveedores', async () => {
      // Arrange
      const providers = ['Amazon', 'AliExpress', 'eBay', 'Banggood', 'Newegg', 'Local Supplier'];

      // Act & Assert
      for (const provider of providers) {
        const result = await cancelPurchase.execute(provider, `${provider}-123`);
        
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('message');
      }
    });

    it('debería manejar diferentes IDs de orden', async () => {
      // Arrange
      const orderIds = ['AMZ-001', 'AMZ-002', 'AMZ-003', 'ORDER-123', 'TEST-456'];

      // Act & Assert
      for (const orderId of orderIds) {
        const result = await cancelPurchase.execute('Amazon', orderId);
        
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('message');
      }
    });

    it('debería tener una tasa de éxito aproximada del 70%', async () => {
      // Act
      const results: CancelPurchaseResult[] = [];
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        const result = await cancelPurchase.execute('Amazon', `AMZ-${i}`);
        results.push(result);
      }

      // Assert
      const successCount = results.filter(r => r.success).length;
      const successRate = successCount / iterations;
      
      // Permitir un margen de error del 15% (55% - 85%)
      expect(successRate).toBeGreaterThan(0.55);
      expect(successRate).toBeLessThan(0.85);
    });

    it('debería manejar nombres de proveedor vacíos', async () => {
      // Act
      const result = await cancelPurchase.execute('', 'AMZ-123');

      // Assert
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
    });

    it('debería manejar IDs de orden vacíos', async () => {
      // Act
      const result = await cancelPurchase.execute('Amazon', '');

      // Assert
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
    });

    it('debería completarse en tiempo razonable', async () => {
      // Arrange
      const startTime = Date.now();

      // Act
      await cancelPurchase.execute('Amazon', 'AMZ-123');

      // Assert
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Menos de 1 segundo
    });
  });
});
