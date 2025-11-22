/**
 * Tests MUY COMPLETOS para el caso de uso: Marcar Factura como Pagada
 */

import { MarkInvoiceAsPaid } from './MarkInvoiceAsPaid';
import { Invoice } from '../shared/models/Invoice';
import { logger } from '../shared/utils/logger';

jest.mock('../shared/models/Invoice');
jest.mock('../shared/utils/logger');

describe('MarkInvoiceAsPaid', () => {
  let markInvoiceAsPaid: MarkInvoiceAsPaid;
  let mockInvoice: any;

  beforeEach(() => {
    jest.clearAllMocks();
    markInvoiceAsPaid = new MarkInvoiceAsPaid();

    mockInvoice = {
      id: 1,
      invoice_number: 'INV-2024-001',
      status: 'issued',
      save: jest.fn(),
    };
  });

  describe('Casos exitosos', () => {
    it('should mark invoice as paid', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      const result = await markInvoiceAsPaid.execute(1);

      expect(mockInvoice.status).toBe('paid');
      expect(mockInvoice.save).toHaveBeenCalled();
      expect(result).toEqual(mockInvoice);
    });

    it('should log when marking as paid', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await markInvoiceAsPaid.execute(1);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Invoice marked as paid'),
        expect.objectContaining({
          invoiceId: 1,
        })
      );
    });

    it('should mark draft invoice as paid', async () => {
      mockInvoice.status = 'draft';
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await markInvoiceAsPaid.execute(1);

      expect(mockInvoice.status).toBe('paid');
    });

    it('should mark issued invoice as paid', async () => {
      mockInvoice.status = 'issued';
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await markInvoiceAsPaid.execute(1);

      expect(mockInvoice.status).toBe('paid');
    });
  });

  describe('Manejo de errores', () => {
    it('should return null if invoice not found', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await markInvoiceAsPaid.execute(999);

      expect(result).toBeNull();
    });

    it('should throw error if invoice is cancelled', async () => {
      mockInvoice.status = 'cancelled';
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await expect(markInvoiceAsPaid.execute(1)).rejects.toThrow('Cannot mark a cancelled invoice as paid');

      expect(mockInvoice.save).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      (Invoice.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(markInvoiceAsPaid.execute(1)).rejects.toThrow('Database error');
    });

    it('should handle save errors', async () => {
      mockInvoice.save.mockRejectedValue(new Error('Save failed'));
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await expect(markInvoiceAsPaid.execute(1)).rejects.toThrow('Save failed');
    });

    it('should handle connection timeout', async () => {
      (Invoice.findByPk as jest.Mock).mockRejectedValue(new Error('Connection timeout'));

      await expect(markInvoiceAsPaid.execute(1)).rejects.toThrow('Connection timeout');
    });
  });

  describe('Validación de entrada', () => {
    it('should handle invalid invoice id', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await markInvoiceAsPaid.execute(-1);

      expect(result).toBeNull();
    });

    it('should handle zero as invoice id', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await markInvoiceAsPaid.execute(0);

      expect(result).toBeNull();
    });
  });

  describe('Reglas de negocio', () => {
    it('should not allow marking cancelled invoices as paid', async () => {
      mockInvoice.status = 'cancelled';
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await expect(markInvoiceAsPaid.execute(1)).rejects.toThrow('Cannot mark a cancelled invoice as paid');
    });

    it('should allow marking draft invoices as paid', async () => {
      mockInvoice.status = 'draft';
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await markInvoiceAsPaid.execute(1);

      expect(mockInvoice.status).toBe('paid');
    });

    it('should allow marking issued invoices as paid', async () => {
      mockInvoice.status = 'issued';
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await markInvoiceAsPaid.execute(1);

      expect(mockInvoice.status).toBe('paid');
    });

    it('should allow marking already paid invoices as paid (idempotent)', async () => {
      mockInvoice.status = 'paid';
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await markInvoiceAsPaid.execute(1);

      expect(mockInvoice.status).toBe('paid');
      expect(mockInvoice.save).toHaveBeenCalled();
    });
  });
});
