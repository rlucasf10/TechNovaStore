/**
 * Tests MUY COMPLETOS para el caso de uso: Actualizar Información de Seguimiento
 */

import { UpdateTrackingInfo } from './UpdateTrackingInfo';
import { Order } from '../shared/models/Order';
import { logger } from '../shared/utils/logger';

jest.mock('../shared/models/Order');
jest.mock('../shared/utils/logger');

describe('UpdateTrackingInfo', () => {
  let updateTrackingInfo: UpdateTrackingInfo;
  let mockOrder: any;

  beforeEach(() => {
    jest.clearAllMocks();
    updateTrackingInfo = new UpdateTrackingInfo();

    mockOrder = {
      id: 1,
      order_number: 'ORD-123456',
      tracking_number: null,
      estimated_delivery: null,
      save: jest.fn(),
    };
  });

  describe('Casos exitosos', () => {
    it('should update tracking number', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      const result = await updateTrackingInfo.execute(1, 'TRACK-123456');

      expect(Order.findByPk).toHaveBeenCalledWith(1);
      expect(mockOrder.tracking_number).toBe('TRACK-123456');
      expect(mockOrder.save).toHaveBeenCalled();
      expect(result).toEqual(mockOrder);
    });

    it('should update tracking number and estimated delivery', async () => {
      const estimatedDelivery = new Date('2024-12-31');
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      const result = await updateTrackingInfo.execute(1, 'TRACK-123456', estimatedDelivery);

      expect(mockOrder.tracking_number).toBe('TRACK-123456');
      expect(mockOrder.estimated_delivery).toEqual(estimatedDelivery);
      expect(mockOrder.save).toHaveBeenCalled();
      expect(result).toEqual(mockOrder);
    });

    it('should update only tracking number without estimated delivery', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateTrackingInfo.execute(1, 'TRACK-123456');

      expect(mockOrder.tracking_number).toBe('TRACK-123456');
      expect(mockOrder.estimated_delivery).toBeNull();
    });

    it('should log tracking info update', async () => {
      const estimatedDelivery = new Date('2024-12-31');
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateTrackingInfo.execute(1, 'TRACK-123456', estimatedDelivery);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Tracking info updated'),
        expect.objectContaining({
          orderId: 1,
          trackingNumber: 'TRACK-123456',
          estimatedDelivery,
        })
      );
    });

    it('should handle different tracking number formats', async () => {
      const trackingNumbers = [
        'TRACK-123456',
        '1Z999AA10123456784',
        'FX123456789ES',
        'DHL-ES-12345',
      ];

      for (const trackingNumber of trackingNumbers) {
        (Order.findByPk as jest.Mock).mockResolvedValue({ ...mockOrder, save: jest.fn() });

        await updateTrackingInfo.execute(1, trackingNumber);

        expect(Order.findByPk).toHaveBeenCalledWith(1);
      }
    });

    it('should update existing tracking number', async () => {
      mockOrder.tracking_number = 'OLD-TRACK-123';
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateTrackingInfo.execute(1, 'NEW-TRACK-456');

      expect(mockOrder.tracking_number).toBe('NEW-TRACK-456');
      expect(mockOrder.save).toHaveBeenCalled();
    });

    it('should update existing estimated delivery', async () => {
      mockOrder.estimated_delivery = new Date('2024-12-01');
      const newDate = new Date('2024-12-31');
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateTrackingInfo.execute(1, 'TRACK-123', newDate);

      expect(mockOrder.estimated_delivery).toEqual(newDate);
    });

    it('should handle future delivery dates', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateTrackingInfo.execute(1, 'TRACK-123', futureDate);

      expect(mockOrder.estimated_delivery).toEqual(futureDate);
    });

    it('should handle same day delivery', async () => {
      const today = new Date();
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateTrackingInfo.execute(1, 'TRACK-123', today);

      expect(mockOrder.estimated_delivery).toEqual(today);
    });
  });

  describe('Manejo de errores', () => {
    it('should return null if order not found', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await updateTrackingInfo.execute(999, 'TRACK-123');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      (Order.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(updateTrackingInfo.execute(1, 'TRACK-123')).rejects.toThrow('Database error');
    });

    it('should handle save errors', async () => {
      mockOrder.save.mockRejectedValue(new Error('Save failed'));
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await expect(updateTrackingInfo.execute(1, 'TRACK-123')).rejects.toThrow('Save failed');
    });

    it('should handle connection timeout', async () => {
      (Order.findByPk as jest.Mock).mockRejectedValue(new Error('Connection timeout'));

      await expect(updateTrackingInfo.execute(1, 'TRACK-123')).rejects.toThrow('Connection timeout');
    });
  });

  describe('Validación de entrada', () => {
    it('should handle empty tracking number', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateTrackingInfo.execute(1, '');

      expect(mockOrder.tracking_number).toBe('');
      expect(mockOrder.save).toHaveBeenCalled();
    });

    it('should handle very long tracking number', async () => {
      const longTrackingNumber = 'TRACK-' + 'A'.repeat(100);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateTrackingInfo.execute(1, longTrackingNumber);

      expect(mockOrder.tracking_number).toBe(longTrackingNumber);
    });

    it('should handle tracking number with special characters', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateTrackingInfo.execute(1, 'TRACK-123!@#$%');

      expect(mockOrder.tracking_number).toBe('TRACK-123!@#$%');
    });

    it('should handle past delivery dates', async () => {
      const pastDate = new Date('2020-01-01');
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateTrackingInfo.execute(1, 'TRACK-123', pastDate);

      expect(mockOrder.estimated_delivery).toEqual(pastDate);
    });

    it('should handle invalid date objects', async () => {
      const invalidDate = new Date('invalid');
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateTrackingInfo.execute(1, 'TRACK-123', invalidDate);

      expect(mockOrder.estimated_delivery).toEqual(invalidDate);
    });
  });
});
