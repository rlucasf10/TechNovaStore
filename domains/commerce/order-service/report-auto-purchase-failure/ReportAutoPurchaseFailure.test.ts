/**
 * Tests MUY COMPLETOS para el caso de uso: Reportar Fallo de Compra Automática
 */

import { ReportAutoPurchaseFailure } from './ReportAutoPurchaseFailure';
import { Order } from '../shared/models/Order';
import { logger } from '../shared/utils/logger';

jest.mock('../shared/models/Order');
jest.mock('../shared/utils/logger');

describe('ReportAutoPurchaseFailure', () => {
  let reportAutoPurchaseFailure: ReportAutoPurchaseFailure;
  let mockOrder: any;

  beforeEach(() => {
    jest.clearAllMocks();
    reportAutoPurchaseFailure = new ReportAutoPurchaseFailure();

    mockOrder = {
      id: 1,
      order_number: 'ORD-123456',
      auto_purchase_attempts: 0,
      auto_purchase_last_error: null,
      auto_purchase_provider_attempts: [],
      auto_purchase_enabled: true,
      save: jest.fn(),
    };
  });

  describe('Casos exitosos', () => {
    it('should report auto-purchase failure', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      const result = await reportAutoPurchaseFailure.execute(
        1,
        'Product not available',
        ['Amazon', 'eBay']
      );

      expect(mockOrder.auto_purchase_attempts).toBe(1);
      expect(mockOrder.auto_purchase_last_error).toBe('Product not available');
      expect(mockOrder.auto_purchase_provider_attempts).toEqual(['Amazon', 'eBay']);
      expect(mockOrder.auto_purchase_enabled).toBe(true);
      expect(mockOrder.save).toHaveBeenCalled();
      expect(result).toEqual(mockOrder);
    });

    it('should increment attempts counter', async () => {
      mockOrder.auto_purchase_attempts = 1;
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await reportAutoPurchaseFailure.execute(1, 'Error', ['Amazon']);

      expect(mockOrder.auto_purchase_attempts).toBe(2);
    });

    it('should disable auto-purchase after 3 attempts', async () => {
      mockOrder.auto_purchase_attempts = 2;
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await reportAutoPurchaseFailure.execute(1, 'Error', ['Amazon']);

      expect(mockOrder.auto_purchase_attempts).toBe(3);
      expect(mockOrder.auto_purchase_enabled).toBe(false);
    });

    it('should log warning when disabling auto-purchase', async () => {
      mockOrder.auto_purchase_attempts = 2;
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await reportAutoPurchaseFailure.execute(1, 'Error', ['Amazon']);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Auto-purchase disabled after 3 failed attempts'),
        expect.objectContaining({
          orderId: 1,
          attempts: 3,
        })
      );
    });

    it('should not disable auto-purchase before 3 attempts', async () => {
      mockOrder.auto_purchase_attempts = 1;
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await reportAutoPurchaseFailure.execute(1, 'Error', ['Amazon']);

      expect(mockOrder.auto_purchase_attempts).toBe(2);
      expect(mockOrder.auto_purchase_enabled).toBe(true);
    });

    it('should log error report', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await reportAutoPurchaseFailure.execute(1, 'Product not available', ['Amazon', 'eBay']);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Auto-purchase failure reported'),
        expect.objectContaining({
          orderId: 1,
          errorMessage: 'Product not available',
          providerAttempts: ['Amazon', 'eBay'],
          totalAttempts: 1,
        })
      );
    });

    it('should handle single provider attempt', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await reportAutoPurchaseFailure.execute(1, 'Error', ['Amazon']);

      expect(mockOrder.auto_purchase_provider_attempts).toEqual(['Amazon']);
    });

    it('should handle multiple provider attempts', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await reportAutoPurchaseFailure.execute(1, 'Error', ['Amazon', 'eBay', 'AliExpress']);

      expect(mockOrder.auto_purchase_provider_attempts).toEqual(['Amazon', 'eBay', 'AliExpress']);
    });

    it('should handle empty provider attempts array', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await reportAutoPurchaseFailure.execute(1, 'Error', []);

      expect(mockOrder.auto_purchase_provider_attempts).toEqual([]);
    });

    it('should update last error message', async () => {
      mockOrder.auto_purchase_last_error = 'Old error';
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await reportAutoPurchaseFailure.execute(1, 'New error', ['Amazon']);

      expect(mockOrder.auto_purchase_last_error).toBe('New error');
    });

    it('should handle long error messages', async () => {
      const longError = 'Error: ' + 'A'.repeat(500);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await reportAutoPurchaseFailure.execute(1, longError, ['Amazon']);

      expect(mockOrder.auto_purchase_last_error).toBe(longError);
    });
  });

  describe('Manejo de errores', () => {
    it('should return null if order not found', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await reportAutoPurchaseFailure.execute(999, 'Error', ['Amazon']);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      (Order.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        reportAutoPurchaseFailure.execute(1, 'Error', ['Amazon'])
      ).rejects.toThrow('Database error');
    });

    it('should handle save errors', async () => {
      mockOrder.save.mockRejectedValue(new Error('Save failed'));
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await expect(
        reportAutoPurchaseFailure.execute(1, 'Error', ['Amazon'])
      ).rejects.toThrow('Save failed');
    });

    it('should handle connection timeout', async () => {
      (Order.findByPk as jest.Mock).mockRejectedValue(new Error('Connection timeout'));

      await expect(
        reportAutoPurchaseFailure.execute(1, 'Error', ['Amazon'])
      ).rejects.toThrow('Connection timeout');
    });
  });

  describe('Validación de entrada', () => {
    it('should handle empty error message', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await reportAutoPurchaseFailure.execute(1, '', ['Amazon']);

      expect(mockOrder.auto_purchase_last_error).toBe('');
    });

    it('should handle null attempts counter', async () => {
      mockOrder.auto_purchase_attempts = null;
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await reportAutoPurchaseFailure.execute(1, 'Error', ['Amazon']);

      expect(mockOrder.auto_purchase_attempts).toBe(1);
    });

    it('should handle undefined attempts counter', async () => {
      mockOrder.auto_purchase_attempts = undefined;
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await reportAutoPurchaseFailure.execute(1, 'Error', ['Amazon']);

      expect(mockOrder.auto_purchase_attempts).toBe(1);
    });
  });
});
