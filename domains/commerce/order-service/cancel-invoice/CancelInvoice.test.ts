/**
 * Tests MUY COMPLETOS para el caso de uso: Cancelar Factura
 */

import { CancelInvoice } from './CancelInvoice';
import { Invoice } from '../shared/models/Invoice';
import { logger } from '../shared/utils/logger';

jest.mock('../shared/models/Invoice');
jest.mock('../shared/utils/logger');

describe('CancelInvoice', () => {
  let cancelInvoice: CancelInvoice;
  let mockInvoice: any;

  beforeEach(() => {
    jest.clearAllMocks();
    cancelInvoice = new CancelInvoice();

    mockInvoice = {
      id: 1,
      invoice_number: 'INV-2024-001',
      status: 'draft',
      save: jest.fn(),
    };
  });

  describe('Casos exitosos', () => {
    it('should cancel invoice', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      const result = await cancelInvoice.execute(1);

      expect(mockInvoice.status).toBe('cancelled');
      expect(mockInvoice.save).toHaveBeenCalled();
      expect(result).toEqual(mockInvoice);
    });

    it('should cancel invoice with reason', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await cancelInvoice.execute(1, 'Order cancelled by customer');

      expect(mockInvoice.status).toBe('cancelled');
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Invoice cancelled'),
        expect.objectContaining({
          invoiceId: 1,
          reason: 'Order cancelled by customer',
        })
      );
    });

    it('should cancel invoice without reason', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await cancelInvoice.execute(1);

      expect(mockInvoice.status).toBe('cancelled');
    });

    it('should log cancellation', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await cancelInvoice.execute(1, 'Test reason');

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Invoice cancelled'),
        expect.objectContaining({
          invoiceId: 1,
          reason: 'Test reason',
        })
      );
    });

    it('should cancel draft invoice', async () => {
      mockInvoice.status = 'draft';
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await cancelInvoice.execute(1);

      expect(mockInvoice.status).toBe('cancelled');
    });

    it('should cancel issued invoice', async () => {
      mockInvoice.status = 'issued';
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await cancelInvoice.execute(1);

      expect(mockInvoice.status).toBe('cancelled');
    });
  });

  describe('Manejo de errores', () => {
    it('should return null if invoice not found', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await cancelInvoice.execute(999);

      expect(result).toBeNull();
    });

    it('should throw error if invoice is paid', async () => {
      mockInvoice.status = 'paid';
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await expect(cancelInvoice.execute(1)).rejects.toThrow('Cannot cancel a paid invoice');

      expect(mockInvoice.save).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      (Invoice.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(cancelInvoice.execute(1)).rejects.toThrow('Database error');
    });

    it('should handle save errors', async () => {
      mockInvoice.save.mockRejectedValue(new Error('Save failed'));
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await expect(cancelInvoice.execute(1)).rejects.toThrow('Save failed');
    });

    it('should handle connection timeout', async () => {
      (Invoice.findByPk as jest.Mock).mockRejectedValue(new Error('Connection timeout'));

      await expect(cancelInvoice.execute(1)).rejects.toThrow('Connection timeout');
    });
  });

  describe('Validación de entrada', () => {
    it('should handle invalid invoice id', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await cancelInvoice.execute(-1);

      expect(result).toBeNull();
    });

    it('should handle zero as invoice id', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await cancelInvoice.execute(0);

      expect(result).toBeNull();
    });

    it('should handle empty reason', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await cancelInvoice.execute(1, '');

      expect(mockInvoice.status).toBe('cancelled');
    });

    it('should handle long reason', async () => {
      const longReason = 'Reason: ' + 'A'.repeat(500);
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await cancelInvoice.execute(1, longReason);

      expect(logger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          reason: longReason,
        })
      );
    });
  });

  describe('Reglas de negocio', () => {
    it('should not allow cancelling paid invoices', async () => {
      mockInvoice.status = 'paid';
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await expect(cancelInvoice.execute(1)).rejects.toThrow('Cannot cancel a paid invoice');
    });

    it('should allow cancelling draft invoices', async () => {
      mockInvoice.status = 'draft';
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await cancelInvoice.execute(1);

      expect(mockInvoice.status).toBe('cancelled');
    });

    it('should allow cancelling issued invoices', async () => {
      mockInvoice.status = 'issued';
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await cancelInvoice.execute(1);

      expect(mockInvoice.status).toBe('cancelled');
    });
  });
});
