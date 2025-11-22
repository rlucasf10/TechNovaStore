/**
 * Tests MUY COMPLETOS para el caso de uso: Reportar Éxito de Compra Automática
 */

import { ReportAutoPurchaseSuccess } from './ReportAutoPurchaseSuccess';
import { Order } from '../shared/models/Order';
import { OrderItem } from '../shared/models/OrderItem';
import { logger } from '../shared/utils/logger';
import { orderEventService } from '../shared/services/eventService';

jest.mock('../shared/models/Order');
jest.mock('../shared/models/OrderItem');
jest.mock('../shared/utils/logger');
jest.mock('../shared/services/eventService');

describe('ReportAutoPurchaseSuccess', () => {
  let reportAutoPurchaseSuccess: ReportAutoPurchaseSuccess;
  let mockOrder: any;

  beforeEach(() => {
    jest.clearAllMocks();
    reportAutoPurchaseSuccess = new ReportAutoPurchaseSuccess();

    mockOrder = {
      id: 1,
      order_number: 'ORD-123456',
      status: 'confirmed',
      provider_order_id: null,
      provider_name: null,
      actual_cost: null,
      estimated_delivery: null,
      canTransitionTo: jest.fn(),
      updateStatus: jest.fn(),
      save: jest.fn(),
      items: [],
    };
  });

  describe('Casos exitosos', () => {
    it('should report auto-purchase success', async () => {
      const estimatedDelivery = new Date('2024-12-31');
      mockOrder.canTransitionTo.mockReturnValue(true);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      const result = await reportAutoPurchaseSuccess.execute(
        1,
        'PROV-123',
        'Amazon',
        95.50,
        estimatedDelivery
      );

      expect(mockOrder.provider_order_id).toBe('PROV-123');
      expect(mockOrder.provider_name).toBe('Amazon');
      expect(mockOrder.actual_cost).toBe(95.50);
      expect(mockOrder.estimated_delivery).toEqual(estimatedDelivery);
      expect(mockOrder.updateStatus).toHaveBeenCalledWith('processing');
      expect(mockOrder.save).toHaveBeenCalled();
      expect(result).toEqual(mockOrder);
    });

    it('should report success without estimated delivery', async () => {
      mockOrder.canTransitionTo.mockReturnValue(true);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await reportAutoPurchaseSuccess.execute(1, 'PROV-123', 'Amazon', 95.50);

      expect(mockOrder.provider_order_id).toBe('PROV-123');
      expect(mockOrder.provider_name).toBe('Amazon');
      expect(mockOrder.actual_cost).toBe(95.50);
      expect(mockOrder.estimated_delivery).toBeNull();
    });

    it('should transition to processing status', async () => {
      mockOrder.canTransitionTo.mockReturnValue(true);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await reportAutoPurchaseSuccess.execute(1, 'PROV-123', 'Amazon', 95.50);

      expect(mockOrder.canTransitionTo).toHaveBeenCalledWith('processing');
      expect(mockOrder.updateStatus).toHaveBeenCalledWith('processing');
    });

    it('should not transition if already in processing', async () => {
      mockOrder.status = 'processing';
      mockOrder.canTransitionTo.mockReturnValue(false);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await reportAutoPurchaseSuccess.execute(1, 'PROV-123', 'Amazon', 95.50);

      expect(mockOrder.updateStatus).not.toHaveBeenCalled();
      expect(mockOrder.save).toHaveBeenCalled();
    });

    it('should log success report', async () => {
      mockOrder.canTransitionTo.mockReturnValue(true);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await reportAutoPurchaseSuccess.execute(1, 'PROV-123', 'Amazon', 95.50);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Auto-purchase success reported'),
        expect.objectContaining({
          orderId: 1,
          providerOrderId: 'PROV-123',
          providerName: 'Amazon',
          totalCost: 95.50,
        })
      );
    });

    it('should emit order status changed event', async () => {
      mockOrder.canTransitionTo.mockReturnValue(true);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await reportAutoPurchaseSuccess.execute(1, 'PROV-123', 'Amazon', 95.50);

      expect(orderEventService.emitOrderStatusChanged).toHaveBeenCalledWith(mockOrder, 'confirmed');
    });

    it('should handle different provider names', async () => {
      const providers = ['Amazon', 'AliExpress', 'eBay', 'Walmart'];
      mockOrder.canTransitionTo.mockReturnValue(true);

      for (const provider of providers) {
        const freshMockOrder = { ...mockOrder, save: jest.fn(), updateStatus: jest.fn(), canTransitionTo: jest.fn().mockReturnValue(true) };
        (Order.findByPk as jest.Mock).mockResolvedValue(freshMockOrder);

        await reportAutoPurchaseSuccess.execute(1, 'PROV-123', provider, 95.50);

        expect(freshMockOrder.provider_name).toBe(provider);
      }
    });

    it('should handle zero cost', async () => {
      mockOrder.canTransitionTo.mockReturnValue(true);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await reportAutoPurchaseSuccess.execute(1, 'PROV-123', 'Amazon', 0);

      expect(mockOrder.actual_cost).toBe(0);
    });

    it('should handle decimal costs', async () => {
      mockOrder.canTransitionTo.mockReturnValue(true);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await reportAutoPurchaseSuccess.execute(1, 'PROV-123', 'Amazon', 123.45);

      expect(mockOrder.actual_cost).toBe(123.45);
    });

    it('should include order items', async () => {
      mockOrder.canTransitionTo.mockReturnValue(true);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await reportAutoPurchaseSuccess.execute(1, 'PROV-123', 'Amazon', 95.50);

      expect(Order.findByPk).toHaveBeenCalledWith(1, {
        include: [
          {
            model: OrderItem,
            as: 'items',
          },
        ],
      });
    });
  });

  describe('Manejo de errores', () => {
    it('should return null if order not found', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await reportAutoPurchaseSuccess.execute(999, 'PROV-123', 'Amazon', 95.50);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      (Order.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        reportAutoPurchaseSuccess.execute(1, 'PROV-123', 'Amazon', 95.50)
      ).rejects.toThrow('Database error');
    });

    it('should handle save errors', async () => {
      mockOrder.canTransitionTo.mockReturnValue(true);
      mockOrder.save.mockRejectedValue(new Error('Save failed'));
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await expect(
        reportAutoPurchaseSuccess.execute(1, 'PROV-123', 'Amazon', 95.50)
      ).rejects.toThrow('Save failed');
    });

    it('should handle update status errors', async () => {
      mockOrder.canTransitionTo.mockReturnValue(true);
      mockOrder.updateStatus.mockRejectedValue(new Error('Update failed'));
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await expect(
        reportAutoPurchaseSuccess.execute(1, 'PROV-123', 'Amazon', 95.50)
      ).rejects.toThrow('Update failed');
    });
  });

  describe('Validación de entrada', () => {
    it('should handle empty provider order id', async () => {
      mockOrder.canTransitionTo.mockReturnValue(true);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await reportAutoPurchaseSuccess.execute(1, '', 'Amazon', 95.50);

      expect(mockOrder.provider_order_id).toBe('');
    });

    it('should handle empty provider name', async () => {
      mockOrder.canTransitionTo.mockReturnValue(true);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await reportAutoPurchaseSuccess.execute(1, 'PROV-123', '', 95.50);

      expect(mockOrder.provider_name).toBe('');
    });

    it('should handle negative cost', async () => {
      mockOrder.canTransitionTo.mockReturnValue(true);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await reportAutoPurchaseSuccess.execute(1, 'PROV-123', 'Amazon', -10.00);

      expect(mockOrder.actual_cost).toBe(-10.00);
    });
  });
});
