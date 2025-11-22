/**
 * Tests MUY COMPLETOS para el caso de uso: Actualizar Estado de Pago
 */

import { UpdatePaymentStatus } from './UpdatePaymentStatus';
import { Order } from '../shared/models/Order';
import { Invoice } from '../shared/models/Invoice';
import { logger } from '../shared/utils/logger';
import { orderEventService } from '../shared/services/eventService';

jest.mock('../shared/models/Order');
jest.mock('../shared/models/Invoice');
jest.mock('../shared/utils/logger');
jest.mock('../shared/services/eventService');

describe('UpdatePaymentStatus', () => {
  let updatePaymentStatus: UpdatePaymentStatus;
  let mockOrder: any;

  beforeEach(() => {
    jest.clearAllMocks();
    updatePaymentStatus = new UpdatePaymentStatus();

    mockOrder = {
      id: 1,
      order_number: 'ORD-123456',
      total_amount: 100.00,
      payment_status: 'pending',
      status: 'pending',
      canTransitionTo: jest.fn(),
      updateStatus: jest.fn(),
      save: jest.fn(),
    };
  });

  describe('Casos exitosos', () => {
    it('should update payment status to completed', async () => {
      mockOrder.canTransitionTo.mockReturnValue(true);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      (Invoice.findOne as jest.Mock).mockResolvedValue({ id: 1, status: 'issued', save: jest.fn() });

      const result = await updatePaymentStatus.execute(1, 'completed', 'TXN-123');

      expect(result).not.toBeNull();
      expect(mockOrder.payment_status).toBe('completed');
      expect(mockOrder.status).toBe('confirmed');
      expect(mockOrder.save).toHaveBeenCalled();
    });

    it('should update payment status to failed', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      const result = await updatePaymentStatus.execute(1, 'failed');

      expect(result).not.toBeNull();
      expect(mockOrder.payment_status).toBe('failed');
      expect(mockOrder.save).toHaveBeenCalled();
    });

    it('should update payment status to refunded', async () => {
      mockOrder.payment_status = 'completed';
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      (Invoice.findOne as jest.Mock).mockResolvedValue({ id: 1, status: 'paid', save: jest.fn() });

      const result = await updatePaymentStatus.execute(1, 'refunded', 'REF-123');

      expect(result).not.toBeNull();
      expect(mockOrder.payment_status).toBe('refunded');
      expect(mockOrder.updateStatus).toHaveBeenCalledWith('refunded');
    });

    it('should update invoice status to paid when payment completed', async () => {
      const mockInvoice = { id: 1, status: 'issued', save: jest.fn() };
      mockOrder.canTransitionTo.mockReturnValue(true);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      (Invoice.findOne as jest.Mock).mockResolvedValue(mockInvoice);

      await updatePaymentStatus.execute(1, 'completed', 'TXN-123');

      expect(mockInvoice.status).toBe('paid');
      expect(mockInvoice.save).toHaveBeenCalled();
    });

    it('should update invoice status to cancelled when refunded', async () => {
      const mockInvoice = { id: 1, status: 'paid', save: jest.fn() };
      mockOrder.payment_status = 'completed';
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      (Invoice.findOne as jest.Mock).mockResolvedValue(mockInvoice);

      await updatePaymentStatus.execute(1, 'refunded', 'REF-123');

      expect(mockInvoice.status).toBe('cancelled');
      expect(mockInvoice.save).toHaveBeenCalled();
    });

    it('should emit payment completed event', async () => {
      mockOrder.canTransitionTo.mockReturnValue(true);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      (Invoice.findOne as jest.Mock).mockResolvedValue({ id: 1, status: 'issued', save: jest.fn() });

      await updatePaymentStatus.execute(1, 'completed', 'TXN-123');

      expect(orderEventService.emitPaymentCompleted).toHaveBeenCalledWith(mockOrder, 'TXN-123');
    });

    it('should emit refund event', async () => {
      mockOrder.payment_status = 'completed';
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      (Invoice.findOne as jest.Mock).mockResolvedValue({ id: 1, status: 'paid', save: jest.fn() });

      await updatePaymentStatus.execute(1, 'refunded', 'REF-123');

      expect(orderEventService.emitOrderRefunded).toHaveBeenCalledWith(mockOrder, 100.00, 'REF-123');
    });

    it('should log status update', async () => {
      mockOrder.canTransitionTo.mockReturnValue(true);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      (Invoice.findOne as jest.Mock).mockResolvedValue({ id: 1, status: 'issued', save: jest.fn() });

      await updatePaymentStatus.execute(1, 'completed', 'TXN-123');

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Updating payment status'),
        expect.any(Object)
      );
    });

    it('should handle order without invoice', async () => {
      mockOrder.canTransitionTo.mockReturnValue(true);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      (Invoice.findOne as jest.Mock).mockResolvedValue(null);

      const result = await updatePaymentStatus.execute(1, 'completed', 'TXN-123');

      expect(result).not.toBeNull();
      expect(mockOrder.save).toHaveBeenCalled();
    });

    it('should not update order status if transition not allowed', async () => {
      mockOrder.canTransitionTo.mockReturnValue(false);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      (Invoice.findOne as jest.Mock).mockResolvedValue({ id: 1, status: 'issued', save: jest.fn() });

      await updatePaymentStatus.execute(1, 'completed', 'TXN-123');

      expect(mockOrder.status).not.toBe('confirmed');
      expect(mockOrder.payment_status).toBe('completed');
    });
  });

  describe('Manejo de errores', () => {
    it('should return null if order not found', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await updatePaymentStatus.execute(999, 'completed');

      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      (Order.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(updatePaymentStatus.execute(1, 'completed')).rejects.toThrow('Database error');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle save errors', async () => {
      mockOrder.save.mockRejectedValue(new Error('Save failed'));
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await expect(updatePaymentStatus.execute(1, 'completed')).rejects.toThrow('Save failed');
    });

    it('should continue if invoice update fails', async () => {
      mockOrder.canTransitionTo.mockReturnValue(true);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      (Invoice.findOne as jest.Mock).mockRejectedValue(new Error('Invoice error'));

      const result = await updatePaymentStatus.execute(1, 'completed', 'TXN-123');

      // Debe continuar a pesar del error en la factura
      expect(result).not.toBeNull();
      expect(mockOrder.save).toHaveBeenCalled();
    });
  });

  describe('Validación de entrada', () => {
    it('should handle zero as order id', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await updatePaymentStatus.execute(0, 'completed');

      expect(result).toBeNull();
    });

    it('should handle negative order id', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await updatePaymentStatus.execute(-1, 'completed');

      expect(result).toBeNull();
    });

    it('should handle update without transaction id', async () => {
      mockOrder.canTransitionTo.mockReturnValue(true);
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      (Invoice.findOne as jest.Mock).mockResolvedValue({ id: 1, status: 'issued', save: jest.fn() });

      const result = await updatePaymentStatus.execute(1, 'completed');

      expect(result).not.toBeNull();
      expect(mockOrder.save).toHaveBeenCalled();
    });
  });

  describe('Estados de pago', () => {
    it('should handle pending status', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      const result = await updatePaymentStatus.execute(1, 'pending');

      expect(result?.payment_status).toBe('pending');
    });

    it('should handle processing status', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      const result = await updatePaymentStatus.execute(1, 'processing');

      expect(result?.payment_status).toBe('processing');
    });

    it('should handle all valid payment statuses', async () => {
      const statuses: Array<'pending' | 'processing' | 'completed' | 'failed' | 'refunded'> = 
        ['pending', 'processing', 'completed', 'failed', 'refunded'];

      for (const status of statuses) {
        const freshMockOrder = { ...mockOrder, canTransitionTo: jest.fn().mockReturnValue(true), save: jest.fn(), updateStatus: jest.fn() };
        (Order.findByPk as jest.Mock).mockResolvedValue(freshMockOrder);
        (Invoice.findOne as jest.Mock).mockResolvedValue({ id: 1, status: 'issued', save: jest.fn() });

        const result = await updatePaymentStatus.execute(1, status);

        expect(result?.payment_status).toBe(status);
      }
    });
  });
});
