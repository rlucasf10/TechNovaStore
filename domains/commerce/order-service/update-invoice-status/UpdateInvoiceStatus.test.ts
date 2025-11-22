/**
 * Tests MUY COMPLETOS para el caso de uso: Actualizar Estado de Factura
 */

import { UpdateInvoiceStatus, InvoiceStatus } from './UpdateInvoiceStatus';
import { Invoice } from '../shared/models/Invoice';
import { logger } from '../shared/utils/logger';

jest.mock('../shared/models/Invoice');
jest.mock('../shared/utils/logger');

describe('UpdateInvoiceStatus', () => {
  let updateInvoiceStatus: UpdateInvoiceStatus;
  let mockInvoice: any;

  beforeEach(() => {
    jest.clearAllMocks();
    updateInvoiceStatus = new UpdateInvoiceStatus();

    mockInvoice = {
      id: 1,
      invoice_number: 'INV-2024-001',
      status: 'draft',
      save: jest.fn(),
    };
  });

  describe('Casos exitosos', () => {
    it('should update invoice status from draft to issued', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      const result = await updateInvoiceStatus.execute(1, 'issued');

      expect(mockInvoice.status).toBe('issued');
      expect(mockInvoice.save).toHaveBeenCalled();
      expect(result).toEqual(mockInvoice);
    });

    it('should update invoice status from issued to paid', async () => {
      mockInvoice.status = 'issued';
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await updateInvoiceStatus.execute(1, 'paid');

      expect(mockInvoice.status).toBe('paid');
    });

    it('should update invoice status to cancelled', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await updateInvoiceStatus.execute(1, 'cancelled');

      expect(mockInvoice.status).toBe('cancelled');
    });

    it('should log status update', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await updateInvoiceStatus.execute(1, 'issued');

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Invoice status updated'),
        expect.objectContaining({
          invoiceId: 1,
          previousStatus: 'draft',
          newStatus: 'issued',
        })
      );
    });

    it('should handle all valid status transitions', async () => {
      const statuses: InvoiceStatus[] = ['draft', 'issued', 'paid', 'cancelled'];

      for (const status of statuses) {
        const freshMockInvoice = { ...mockInvoice, save: jest.fn() };
        (Invoice.findByPk as jest.Mock).mockResolvedValue(freshMockInvoice);

        await updateInvoiceStatus.execute(1, status);

        expect(freshMockInvoice.status).toBe(status);
        expect(freshMockInvoice.save).toHaveBeenCalled();
      }
    });
  });

  describe('Manejo de errores', () => {
    it('should return null if invoice not found', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await updateInvoiceStatus.execute(999, 'issued');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      (Invoice.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(updateInvoiceStatus.execute(1, 'issued')).rejects.toThrow('Database error');
    });

    it('should handle save errors', async () => {
      mockInvoice.save.mockRejectedValue(new Error('Save failed'));
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await expect(updateInvoiceStatus.execute(1, 'issued')).rejects.toThrow('Save failed');
    });

    it('should handle connection timeout', async () => {
      (Invoice.findByPk as jest.Mock).mockRejectedValue(new Error('Connection timeout'));

      await expect(updateInvoiceStatus.execute(1, 'issued')).rejects.toThrow('Connection timeout');
    });
  });

  describe('Validación de entrada', () => {
    it('should handle invalid invoice id', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await updateInvoiceStatus.execute(-1, 'issued');

      expect(result).toBeNull();
    });

    it('should handle zero as invoice id', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await updateInvoiceStatus.execute(0, 'issued');

      expect(result).toBeNull();
    });
  });

  describe('Transiciones de estado', () => {
    it('should allow transition from draft to issued', async () => {
      mockInvoice.status = 'draft';
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await updateInvoiceStatus.execute(1, 'issued');

      expect(mockInvoice.status).toBe('issued');
    });

    it('should allow transition from issued to paid', async () => {
      mockInvoice.status = 'issued';
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await updateInvoiceStatus.execute(1, 'paid');

      expect(mockInvoice.status).toBe('paid');
    });

    it('should allow transition to cancelled from any status', async () => {
      const statuses: InvoiceStatus[] = ['draft', 'issued', 'paid'];

      for (const initialStatus of statuses) {
        const freshMockInvoice = { ...mockInvoice, status: initialStatus, save: jest.fn() };
        (Invoice.findByPk as jest.Mock).mockResolvedValue(freshMockInvoice);

        await updateInvoiceStatus.execute(1, 'cancelled');

        expect(freshMockInvoice.status).toBe('cancelled');
      }
    });
  });
});
