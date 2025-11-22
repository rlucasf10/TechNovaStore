/**
 * Tests MUY COMPLETOS para el caso de uso: Marcar Pedido para Procesamiento
 */

import { MarkOrderForProcessing } from './MarkOrderForProcessing';
import { Order } from '../shared/models/Order';
import { logger } from '../shared/utils/logger';

jest.mock('../shared/models/Order');
jest.mock('../shared/utils/logger');

describe('MarkOrderForProcessing', () => {
  let markOrderForProcessing: MarkOrderForProcessing;
  let mockOrder: any;

  beforeEach(() => {
    jest.clearAllMocks();
    markOrderForProcessing = new MarkOrderForProcessing();

    mockOrder = {
      id: 1,
      order_number: 'ORD-123456',
      status: 'confirmed',
      canTransitionTo: jest.fn(),
      updateStatus: jest.fn(),
    };
  });

  describe('Casos exitosos', () => {
    it('should mark order for processing', async () => {
      mockOrder.canTransitionTo.mockReturnValue(true);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      const result = await markOrderForProcessing.execute(1);

      expect(Order.findByPk).toHaveBeenCalledWith(1);
      expect(mockOrder.canTransitionTo).toHaveBeenCalledWith('processing');
      expect(mockOrder.updateStatus).toHaveBeenCalledWith('processing');
      expect(result).toEqual(mockOrder);
    });

    it('should log when order is marked for processing', async () => {
      mockOrder.canTransitionTo.mockReturnValue(true);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await markOrderForProcessing.execute(1);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Order marked for processing'),
        expect.objectContaining({
          orderId: 1,
        })
      );
    });

    it('should not update status if transition not allowed', async () => {
      mockOrder.canTransitionTo.mockReturnValue(false);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      const result = await markOrderForProcessing.execute(1);

      expect(mockOrder.updateStatus).not.toHaveBeenCalled();
      expect(result).toEqual(mockOrder);
    });

    it('should handle order already in processing status', async () => {
      mockOrder.status = 'processing';
      mockOrder.canTransitionTo.mockReturnValue(false);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      const result = await markOrderForProcessing.execute(1);

      expect(mockOrder.updateStatus).not.toHaveBeenCalled();
      expect(result).toEqual(mockOrder);
    });

    it('should handle confirmed order transitioning to processing', async () => {
      mockOrder.status = 'confirmed';
      mockOrder.canTransitionTo.mockReturnValue(true);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await markOrderForProcessing.execute(1);

      expect(mockOrder.canTransitionTo).toHaveBeenCalledWith('processing');
      expect(mockOrder.updateStatus).toHaveBeenCalledWith('processing');
    });

    it('should return order even if transition fails', async () => {
      mockOrder.canTransitionTo.mockReturnValue(false);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      const result = await markOrderForProcessing.execute(1);

      expect(result).toEqual(mockOrder);
    });
  });

  describe('Manejo de errores', () => {
    it('should return null if order not found', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await markOrderForProcessing.execute(999);

      expect(result).toBeNull();
      expect(mockOrder.updateStatus).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      (Order.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(markOrderForProcessing.execute(1)).rejects.toThrow('Database error');
    });

    it('should handle update status errors', async () => {
      mockOrder.canTransitionTo.mockReturnValue(true);
      mockOrder.updateStatus.mockRejectedValue(new Error('Update failed'));
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await expect(markOrderForProcessing.execute(1)).rejects.toThrow('Update failed');
    });

    it('should handle connection timeout', async () => {
      (Order.findByPk as jest.Mock).mockRejectedValue(new Error('Connection timeout'));

      await expect(markOrderForProcessing.execute(1)).rejects.toThrow('Connection timeout');
    });
  });

  describe('Validación de transiciones', () => {
    it('should check if transition to processing is allowed', async () => {
      mockOrder.canTransitionTo.mockReturnValue(true);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await markOrderForProcessing.execute(1);

      expect(mockOrder.canTransitionTo).toHaveBeenCalledWith('processing');
    });

    it('should not update if order is pending', async () => {
      mockOrder.status = 'pending';
      mockOrder.canTransitionTo.mockReturnValue(false);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await markOrderForProcessing.execute(1);

      expect(mockOrder.updateStatus).not.toHaveBeenCalled();
    });

    it('should not update if order is cancelled', async () => {
      mockOrder.status = 'cancelled';
      mockOrder.canTransitionTo.mockReturnValue(false);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await markOrderForProcessing.execute(1);

      expect(mockOrder.updateStatus).not.toHaveBeenCalled();
    });

    it('should not update if order is delivered', async () => {
      mockOrder.status = 'delivered';
      mockOrder.canTransitionTo.mockReturnValue(false);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await markOrderForProcessing.execute(1);

      expect(mockOrder.updateStatus).not.toHaveBeenCalled();
    });
  });
});
