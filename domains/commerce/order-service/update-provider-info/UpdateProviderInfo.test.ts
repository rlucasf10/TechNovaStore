/**
 * Tests MUY COMPLETOS para el caso de uso: Actualizar Información del Proveedor
 */

import { UpdateProviderInfo, ProviderInfoData } from './UpdateProviderInfo';
import { Order } from '../shared/models/Order';
import { logger } from '../shared/utils/logger';

jest.mock('../shared/models/Order');
jest.mock('../shared/utils/logger');

describe('UpdateProviderInfo', () => {
  let updateProviderInfo: UpdateProviderInfo;
  let mockOrder: any;

  beforeEach(() => {
    jest.clearAllMocks();
    updateProviderInfo = new UpdateProviderInfo();

    mockOrder = {
      id: 1,
      order_number: 'ORD-123456',
      provider_order_id: null,
      provider_name: null,
      tracking_number: null,
      estimated_delivery: null,
      actual_cost: null,
      save: jest.fn(),
    };
  });

  describe('Casos exitosos', () => {
    it('should update provider order id', async () => {
      const data: ProviderInfoData = {
        provider_order_id: 'PROV-123',
      };

      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      const result = await updateProviderInfo.execute(1, data);

      expect(mockOrder.provider_order_id).toBe('PROV-123');
      expect(mockOrder.save).toHaveBeenCalled();
      expect(result).toEqual(mockOrder);
    });

    it('should update provider name', async () => {
      const data: ProviderInfoData = {
        provider_name: 'Amazon',
      };

      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateProviderInfo.execute(1, data);

      expect(mockOrder.provider_name).toBe('Amazon');
    });

    it('should update tracking number', async () => {
      const data: ProviderInfoData = {
        tracking_number: 'TRACK-456',
      };

      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateProviderInfo.execute(1, data);

      expect(mockOrder.tracking_number).toBe('TRACK-456');
    });

    it('should update estimated delivery', async () => {
      const estimatedDelivery = new Date('2024-12-31');
      const data: ProviderInfoData = {
        estimated_delivery: estimatedDelivery,
      };

      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateProviderInfo.execute(1, data);

      expect(mockOrder.estimated_delivery).toEqual(estimatedDelivery);
    });

    it('should update actual cost', async () => {
      const data: ProviderInfoData = {
        actual_cost: 95.50,
      };

      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateProviderInfo.execute(1, data);

      expect(mockOrder.actual_cost).toBe(95.50);
    });

    it('should update multiple fields at once', async () => {
      const estimatedDelivery = new Date('2024-12-31');
      const data: ProviderInfoData = {
        provider_order_id: 'PROV-123',
        provider_name: 'Amazon',
        tracking_number: 'TRACK-456',
        estimated_delivery: estimatedDelivery,
        actual_cost: 95.50,
      };

      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateProviderInfo.execute(1, data);

      expect(mockOrder.provider_order_id).toBe('PROV-123');
      expect(mockOrder.provider_name).toBe('Amazon');
      expect(mockOrder.tracking_number).toBe('TRACK-456');
      expect(mockOrder.estimated_delivery).toEqual(estimatedDelivery);
      expect(mockOrder.actual_cost).toBe(95.50);
    });

    it('should not update fields not provided', async () => {
      mockOrder.provider_name = 'ExistingProvider';
      const data: ProviderInfoData = {
        provider_order_id: 'PROV-123',
      };

      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateProviderInfo.execute(1, data);

      expect(mockOrder.provider_order_id).toBe('PROV-123');
      expect(mockOrder.provider_name).toBe('ExistingProvider');
    });

    it('should log provider info update', async () => {
      const data: ProviderInfoData = {
        provider_order_id: 'PROV-123',
      };

      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateProviderInfo.execute(1, data);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Provider info updated'),
        expect.objectContaining({
          orderId: 1,
          data,
        })
      );
    });

    it('should handle zero actual cost', async () => {
      const data: ProviderInfoData = {
        actual_cost: 0,
      };

      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateProviderInfo.execute(1, data);

      expect(mockOrder.actual_cost).toBe(0);
    });

    it('should handle different provider names', async () => {
      const providers = ['Amazon', 'AliExpress', 'eBay', 'Walmart'];

      for (const provider of providers) {
        const freshMockOrder = { ...mockOrder, save: jest.fn() };
        (Order.findByPk as jest.Mock).mockResolvedValue(freshMockOrder);

        await updateProviderInfo.execute(1, { provider_name: provider });

        expect(freshMockOrder.provider_name).toBe(provider);
      }
    });
  });

  describe('Manejo de errores', () => {
    it('should return null if order not found', async () => {
      const data: ProviderInfoData = {
        provider_order_id: 'PROV-123',
      };

      (Order.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await updateProviderInfo.execute(999, data);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const data: ProviderInfoData = {
        provider_order_id: 'PROV-123',
      };

      (Order.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(updateProviderInfo.execute(1, data)).rejects.toThrow('Database error');
    });

    it('should handle save errors', async () => {
      const data: ProviderInfoData = {
        provider_order_id: 'PROV-123',
      };

      mockOrder.save.mockRejectedValue(new Error('Save failed'));
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await expect(updateProviderInfo.execute(1, data)).rejects.toThrow('Save failed');
    });
  });

  describe('Validación de entrada', () => {
    it('should handle empty data object', async () => {
      const data: ProviderInfoData = {};

      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateProviderInfo.execute(1, data);

      expect(mockOrder.save).toHaveBeenCalled();
    });

    it('should handle negative actual cost', async () => {
      const data: ProviderInfoData = {
        actual_cost: -10.00,
      };

      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateProviderInfo.execute(1, data);

      expect(mockOrder.actual_cost).toBe(-10.00);
    });
  });
});
