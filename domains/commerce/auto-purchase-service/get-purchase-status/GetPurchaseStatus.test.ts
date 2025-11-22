/**
 * Tests para GetPurchaseStatus
 * 
 * Verifica la obtención de estado de compras desde proveedores
 */

import { GetPurchaseStatus, PurchaseStatusResult } from './GetPurchaseStatus';

describe('GetPurchaseStatus', () => {
  let getPurchaseStatus: GetPurchaseStatus;

  beforeEach(() => {
    getPurchaseStatus = new GetPurchaseStatus();
  });

  describe('execute', () => {
    it('debería obtener el estado de una compra', async () => {
      // Act
      const result = await getPurchaseStatus.execute('Amazon', 'AMZ-123');

      // Assert
      expect(result).toHaveProperty('status');
      expect(typeof result.status).toBe('string');
      expect(['confirmed', 'processing', 'shipped', 'delivered']).toContain(result.status);
    });

    it('debería incluir tracking_number cuando el estado es shipped', async () => {
      // Act
      const results: PurchaseStatusResult[] = [];
      
      // Ejecutar múltiples veces para obtener diferentes estados
      for (let i = 0; i < 20; i++) {
        const result = await getPurchaseStatus.execute('Amazon', `AMZ-${i}`);
        results.push(result);
      }

      // Assert
      const shippedOrders = results.filter(r => r.status === 'shipped' || r.status === 'delivered');
      
      if (shippedOrders.length > 0) {
        const shippedOrder = shippedOrders[0];
        if (shippedOrder.status === 'shipped') {
          expect(shippedOrder.tracking_number).toBeDefined();
          expect(shippedOrder.tracking_number).toMatch(/^TRK\d+$/);
        }
      }
    });

    it('debería incluir tracking_number cuando el estado es delivered', async () => {
      // Act
      const results: PurchaseStatusResult[] = [];
      
      for (let i = 0; i < 20; i++) {
        const result = await getPurchaseStatus.execute('Amazon', `AMZ-${i}`);
        results.push(result);
      }

      // Assert
      const deliveredOrders = results.filter(r => r.status === 'delivered');
      
      if (deliveredOrders.length > 0) {
        const deliveredOrder = deliveredOrders[0];
        expect(deliveredOrder.tracking_number).toBeDefined();
        expect(deliveredOrder.tracking_number).toMatch(/^TRK\d+$/);
      }
    });

    it('debería incluir estimated_delivery cuando no está delivered', async () => {
      // Act
      const results: PurchaseStatusResult[] = [];
      
      for (let i = 0; i < 20; i++) {
        const result = await getPurchaseStatus.execute('Amazon', `AMZ-${i}`);
        results.push(result);
      }

      // Assert
      const nonDeliveredOrders = results.filter(r => r.status !== 'delivered');
      
      if (nonDeliveredOrders.length > 0) {
        const nonDeliveredOrder = nonDeliveredOrders[0];
        expect(nonDeliveredOrder.estimated_delivery).toBeDefined();
        expect(nonDeliveredOrder.estimated_delivery).toBeInstanceOf(Date);
        
        // La fecha estimada debe ser futura
        const now = new Date();
        expect(nonDeliveredOrder.estimated_delivery!.getTime()).toBeGreaterThan(now.getTime());
      }
    });

    it('NO debería incluir estimated_delivery cuando está delivered', async () => {
      // Act
      const results: PurchaseStatusResult[] = [];
      
      for (let i = 0; i < 20; i++) {
        const result = await getPurchaseStatus.execute('Amazon', `AMZ-${i}`);
        results.push(result);
      }

      // Assert
      const deliveredOrders = results.filter(r => r.status === 'delivered');
      
      if (deliveredOrders.length > 0) {
        const deliveredOrder = deliveredOrders[0];
        expect(deliveredOrder.estimated_delivery).toBeUndefined();
      }
    });

    it('debería manejar diferentes proveedores', async () => {
      // Arrange
      const providers = ['Amazon', 'AliExpress', 'eBay', 'Banggood', 'Newegg', 'Local Supplier'];

      // Act & Assert
      for (const provider of providers) {
        const result = await getPurchaseStatus.execute(provider, `${provider}-123`);
        
        expect(result).toHaveProperty('status');
        expect(['confirmed', 'processing', 'shipped', 'delivered']).toContain(result.status);
      }
    });

    it('debería manejar diferentes IDs de orden', async () => {
      // Arrange
      const orderIds = ['AMZ-001', 'AMZ-002', 'AMZ-003', 'ORDER-123', 'TEST-456'];

      // Act & Assert
      for (const orderId of orderIds) {
        const result = await getPurchaseStatus.execute('Amazon', orderId);
        
        expect(result).toHaveProperty('status');
        expect(['confirmed', 'processing', 'shipped', 'delivered']).toContain(result.status);
      }
    });

    it('debería retornar diferentes estados en múltiples llamadas', async () => {
      // Act
      const results: PurchaseStatusResult[] = [];
      const iterations = 20;
      
      for (let i = 0; i < iterations; i++) {
        const result = await getPurchaseStatus.execute('Amazon', `AMZ-${i}`);
        results.push(result);
      }

      // Assert
      const uniqueStatuses = new Set(results.map(r => r.status));
      
      // Debería haber al menos 2 estados diferentes en 20 llamadas
      expect(uniqueStatuses.size).toBeGreaterThanOrEqual(2);
    });

    it('debería tener distribución aproximadamente uniforme de estados', async () => {
      // Act
      const results: PurchaseStatusResult[] = [];
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        const result = await getPurchaseStatus.execute('Amazon', `AMZ-${i}`);
        results.push(result);
      }

      // Assert
      const statusCounts = {
        confirmed: results.filter(r => r.status === 'confirmed').length,
        processing: results.filter(r => r.status === 'processing').length,
        shipped: results.filter(r => r.status === 'shipped').length,
        delivered: results.filter(r => r.status === 'delivered').length
      };

      // Cada estado debería aparecer al menos algunas veces (mínimo 10% del total)
      expect(statusCounts.confirmed).toBeGreaterThan(10);
      expect(statusCounts.processing).toBeGreaterThan(10);
      expect(statusCounts.shipped).toBeGreaterThan(10);
      expect(statusCounts.delivered).toBeGreaterThan(10);
    });

    it('debería completarse en tiempo razonable', async () => {
      // Arrange
      const startTime = Date.now();

      // Act
      await getPurchaseStatus.execute('Amazon', 'AMZ-123');

      // Assert
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Menos de 1 segundo
    });

    it('debería manejar nombres de proveedor vacíos', async () => {
      // Act
      const result = await getPurchaseStatus.execute('', 'AMZ-123');

      // Assert
      expect(result).toHaveProperty('status');
      expect(['confirmed', 'processing', 'shipped', 'delivered']).toContain(result.status);
    });

    it('debería manejar IDs de orden vacíos', async () => {
      // Act
      const result = await getPurchaseStatus.execute('Amazon', '');

      // Assert
      expect(result).toHaveProperty('status');
      expect(['confirmed', 'processing', 'shipped', 'delivered']).toContain(result.status);
    });

    it('debería generar tracking numbers únicos', async () => {
      // Act
      const results: PurchaseStatusResult[] = [];
      
      for (let i = 0; i < 50; i++) {
        const result = await getPurchaseStatus.execute('Amazon', `AMZ-${i}`);
        results.push(result);
        // Pequeño delay para asegurar timestamps únicos
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      // Assert
      const trackingNumbers = results
        .filter(r => r.tracking_number)
        .map(r => r.tracking_number);
      
      const uniqueTrackingNumbers = new Set(trackingNumbers);
      
      // La mayoría de tracking numbers deben ser únicos (permitir algunos duplicados por timing)
      expect(uniqueTrackingNumbers.size).toBeGreaterThan(trackingNumbers.length * 0.9);
    });

    it('debería generar fechas de entrega dentro de 14 días', async () => {
      // Act
      const results: PurchaseStatusResult[] = [];
      
      for (let i = 0; i < 20; i++) {
        const result = await getPurchaseStatus.execute('Amazon', `AMZ-${i}`);
        results.push(result);
      }

      // Assert
      const ordersWithEstimatedDelivery = results.filter(r => r.estimated_delivery);
      
      if (ordersWithEstimatedDelivery.length > 0) {
        const now = new Date();
        const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        
        for (const order of ordersWithEstimatedDelivery) {
          expect(order.estimated_delivery!.getTime()).toBeLessThanOrEqual(fourteenDaysFromNow.getTime());
        }
      }
    });
  });
});
