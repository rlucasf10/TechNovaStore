/**
 * Tests MUY COMPLETOS para el caso de uso: Actualizar Estado del Pedido
 */

import { UpdateOrderStatus } from './UpdateOrderStatus';
import { Order, OrderStatus } from '../shared/models/Order';
import { logger } from '../shared/utils/logger';
import { orderEventService } from '../shared/services/eventService';
import { InvoiceService } from '../shared/services/invoiceService';

jest.mock('../shared/models/Order');
jest.mock('../shared/utils/logger');
jest.mock('../shared/services/eventService');
jest.mock('../shared/services/invoiceService');

describe('UpdateOrderStatus', () => {
  let updateOrderStatus: UpdateOrderStatus;
  let mockOrder: any;

  beforeEach(() => {
    jest.clearAllMocks();
    updateOrderStatus = new UpdateOrderStatus();

    mockOrder = {
      id: 1,
      order_number: 'ORD-123456',
      user_id: 1,
      status: 'pending',
      canTransitionTo: jest.fn(),
      updateStatus: jest.fn(),
    };
  });

  describe('Casos exitosos', () => {
    it('should update order status from pending to confirmed', async () => {
      mockOrder.status = 'pending'; // Estado inicial
      mockOrder.canTransitionTo.mockReturnValue(true);
      mockOrder.updateStatus.mockImplementation(async function(this: any, newStatus: string) {
        this.status = newStatus; // Simular cambio de estado
      });
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      (InvoiceService.generateAutomaticInvoice as jest.Mock).mockResolvedValue({});

      const result = await updateOrderStatus.execute(1, 'confirmed');

      expect(Order.findByPk).toHaveBeenCalledWith(1);
      expect(mockOrder.canTransitionTo).toHaveBeenCalledWith('confirmed');
      expect(mockOrder.updateStatus).toHaveBeenCalledWith('confirmed');
      expect(orderEventService.emitOrderStatusChanged).toHaveBeenCalledWith(mockOrder, 'pending');
      expect(InvoiceService.generateAutomaticInvoice).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockOrder);
    });

    it('should update order status from confirmed to processing', async () => {
      mockOrder.status = 'confirmed';
      mockOrder.canTransitionTo.mockReturnValue(true);
      mockOrder.updateStatus.mockResolvedValue(undefined);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateOrderStatus.execute(1, 'processing');

      expect(mockOrder.canTransitionTo).toHaveBeenCalledWith('processing');
      expect(mockOrder.updateStatus).toHaveBeenCalledWith('processing');
    });

    it('should update order status from processing to shipped', async () => {
      mockOrder.status = 'processing';
      mockOrder.canTransitionTo.mockReturnValue(true);
      mockOrder.updateStatus.mockResolvedValue(undefined);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateOrderStatus.execute(1, 'shipped');

      expect(mockOrder.canTransitionTo).toHaveBeenCalledWith('shipped');
      expect(mockOrder.updateStatus).toHaveBeenCalledWith('shipped');
    });

    it('should update order status from shipped to delivered', async () => {
      mockOrder.status = 'shipped';
      mockOrder.canTransitionTo.mockReturnValue(true);
      mockOrder.updateStatus.mockResolvedValue(undefined);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateOrderStatus.execute(1, 'delivered');

      expect(mockOrder.canTransitionTo).toHaveBeenCalledWith('delivered');
      expect(mockOrder.updateStatus).toHaveBeenCalledWith('delivered');
    });

    it('should cancel order from pending status', async () => {
      mockOrder.canTransitionTo.mockReturnValue(true);
      mockOrder.updateStatus.mockResolvedValue(undefined);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateOrderStatus.execute(1, 'cancelled');

      expect(mockOrder.canTransitionTo).toHaveBeenCalledWith('cancelled');
      expect(mockOrder.updateStatus).toHaveBeenCalledWith('cancelled');
    });

    it('should log status update', async () => {
      mockOrder.canTransitionTo.mockReturnValue(true);
      mockOrder.updateStatus.mockResolvedValue(undefined);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateOrderStatus.execute(1, 'confirmed');

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Order status updated'),
        expect.objectContaining({
          orderId: 1,
          previousStatus: 'pending',
          newStatus: 'confirmed',
        })
      );
    });

    it('should emit status changed event', async () => {
      mockOrder.canTransitionTo.mockReturnValue(true);
      mockOrder.updateStatus.mockResolvedValue(undefined);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateOrderStatus.execute(1, 'confirmed');

      expect(orderEventService.emitOrderStatusChanged).toHaveBeenCalledWith(mockOrder, 'pending');
    });

    it('should generate invoice when confirming order', async () => {
      mockOrder.status = 'pending'; // Estado inicial
      mockOrder.canTransitionTo.mockReturnValue(true);
      mockOrder.updateStatus.mockImplementation(async function(this: any, newStatus: string) {
        this.status = newStatus; // Simular cambio de estado
      });
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      (InvoiceService.generateAutomaticInvoice as jest.Mock).mockResolvedValue({});

      await updateOrderStatus.execute(1, 'confirmed');

      expect(InvoiceService.generateAutomaticInvoice).toHaveBeenCalledWith(1);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Automatic invoice generated'),
        expect.objectContaining({ orderId: 1 })
      );
    });

    it('should not generate invoice when updating to other statuses', async () => {
      mockOrder.status = 'confirmed';
      mockOrder.canTransitionTo.mockReturnValue(true);
      mockOrder.updateStatus.mockResolvedValue(undefined);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateOrderStatus.execute(1, 'processing');

      expect(InvoiceService.generateAutomaticInvoice).not.toHaveBeenCalled();
    });

    it('should continue if invoice generation fails', async () => {
      mockOrder.status = 'pending'; // Estado inicial
      mockOrder.canTransitionTo.mockReturnValue(true);
      mockOrder.updateStatus.mockImplementation(async function(this: any, newStatus: string) {
        this.status = newStatus; // Simular cambio de estado
      });
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      (InvoiceService.generateAutomaticInvoice as jest.Mock).mockRejectedValue(new Error('Invoice error'));

      const result = await updateOrderStatus.execute(1, 'confirmed');

      expect(result).toEqual(mockOrder);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to generate automatic invoice'),
        expect.any(Error)
      );
    });
  });

  describe('Manejo de errores', () => {
    it('should return null if order not found', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await updateOrderStatus.execute(999, 'confirmed');

      expect(result).toBeNull();
      expect(mockOrder.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw error if transition is not allowed', async () => {
      mockOrder.canTransitionTo.mockReturnValue(false);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await expect(updateOrderStatus.execute(1, 'delivered')).rejects.toThrow(
        'Cannot transition from pending to delivered'
      );

      expect(mockOrder.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw error when trying to cancel delivered order', async () => {
      mockOrder.status = 'delivered';
      mockOrder.canTransitionTo.mockReturnValue(false);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await expect(updateOrderStatus.execute(1, 'cancelled')).rejects.toThrow(
        'Cannot transition from delivered to cancelled'
      );
    });

    it('should throw error when trying to change cancelled order', async () => {
      mockOrder.status = 'cancelled';
      mockOrder.canTransitionTo.mockReturnValue(false);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await expect(updateOrderStatus.execute(1, 'confirmed')).rejects.toThrow(
        'Cannot transition from cancelled to confirmed'
      );
    });

    it('should handle database errors', async () => {
      (Order.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(updateOrderStatus.execute(1, 'confirmed')).rejects.toThrow('Database error');
    });

    it('should handle update status failure', async () => {
      mockOrder.canTransitionTo.mockReturnValue(true);
      mockOrder.updateStatus.mockRejectedValue(new Error('Update failed'));
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await expect(updateOrderStatus.execute(1, 'confirmed')).rejects.toThrow('Update failed');
    });
  });

  describe('Validación de transiciones', () => {
    it('should validate pending to confirmed transition', async () => {
      mockOrder.canTransitionTo.mockReturnValue(true);
      mockOrder.updateStatus.mockResolvedValue(undefined);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateOrderStatus.execute(1, 'confirmed');

      expect(mockOrder.canTransitionTo).toHaveBeenCalledWith('confirmed');
    });

    it('should validate pending to cancelled transition', async () => {
      mockOrder.canTransitionTo.mockReturnValue(true);
      mockOrder.updateStatus.mockResolvedValue(undefined);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await updateOrderStatus.execute(1, 'cancelled');

      expect(mockOrder.canTransitionTo).toHaveBeenCalledWith('cancelled');
    });

    it('should reject invalid transition from pending to shipped', async () => {
      mockOrder.canTransitionTo.mockReturnValue(false);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await expect(updateOrderStatus.execute(1, 'shipped')).rejects.toThrow(
        'Cannot transition from pending to shipped'
      );
    });

    it('should reject invalid transition from pending to delivered', async () => {
      mockOrder.canTransitionTo.mockReturnValue(false);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await expect(updateOrderStatus.execute(1, 'delivered')).rejects.toThrow(
        'Cannot transition from pending to delivered'
      );
    });
  });
});
