/**
 * Tests MUY COMPLETOS para el caso de uso: Obtener Facturas
 */

import { GetInvoices, GetInvoicesOptions } from './GetInvoices';
import { Invoice } from '../shared/models/Invoice';
import { Order } from '../shared/models/Order';

jest.mock('../shared/models/Invoice');
jest.mock('../shared/models/Order');

describe('GetInvoices', () => {
  let getInvoices: GetInvoices;
  let mockInvoices: any[];

  beforeEach(() => {
    jest.clearAllMocks();
    getInvoices = new GetInvoices();

    mockInvoices = [
      {
        id: 1,
        invoice_number: 'INV-2024-001',
        total_amount: 121.00,
        status: 'issued',
        order: {},
      },
      {
        id: 2,
        invoice_number: 'INV-2024-002',
        total_amount: 242.00,
        status: 'paid',
        order: {},
      },
    ];
  });

  describe('Casos exitosos', () => {
    it('should return paginated invoices with default parameters', async () => {
      (Invoice.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 2,
        rows: mockInvoices,
      });

      const result = await getInvoices.execute({});

      expect(Invoice.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        include: [
          {
            model: Order,
            as: 'order',
          },
        ],
        order: [['issued_date', 'DESC']],
        limit: 20,
        offset: 0,
      });
      expect(result.invoices).toEqual(mockInvoices);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        pages: 1,
      });
    });

    it('should filter invoices by status', async () => {
      const options: GetInvoicesOptions = {
        status: 'paid',
      };

      (Invoice.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 1,
        rows: [mockInvoices[1]],
      });

      const result = await getInvoices.execute(options);

      expect(Invoice.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'paid' },
        })
      );
      expect(result.invoices).toHaveLength(1);
    });

    it('should filter by start date', async () => {
      const startDate = new Date('2024-01-01');
      const options: GetInvoicesOptions = {
        startDate,
      };

      (Invoice.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 2,
        rows: mockInvoices,
      });

      await getInvoices.execute(options);

      expect(Invoice.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            issued_date: expect.objectContaining({
              gte: startDate,
            }),
          },
        })
      );
    });

    it('should filter by end date', async () => {
      const endDate = new Date('2024-12-31');
      const options: GetInvoicesOptions = {
        endDate,
      };

      (Invoice.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 2,
        rows: mockInvoices,
      });

      await getInvoices.execute(options);

      expect(Invoice.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            issued_date: expect.objectContaining({
              lte: endDate,
            }),
          },
        })
      );
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const options: GetInvoicesOptions = {
        startDate,
        endDate,
      };

      (Invoice.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 2,
        rows: mockInvoices,
      });

      await getInvoices.execute(options);

      expect(Invoice.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            issued_date: {
              gte: startDate,
              lte: endDate,
            },
          },
        })
      );
    });

    it('should handle custom page number', async () => {
      const options: GetInvoicesOptions = {
        page: 2,
        limit: 10,
      };

      (Invoice.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 25,
        rows: mockInvoices,
      });

      const result = await getInvoices.execute(options);

      expect(Invoice.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 10,
        })
      );
      expect(result.pagination.page).toBe(2);
    });

    it('should handle custom limit', async () => {
      const options: GetInvoicesOptions = {
        limit: 50,
      };

      (Invoice.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 100,
        rows: mockInvoices,
      });

      await getInvoices.execute(options);

      expect(Invoice.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
        })
      );
    });

    it('should sort by issued_date DESC by default', async () => {
      (Invoice.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 2,
        rows: mockInvoices,
      });

      await getInvoices.execute({});

      expect(Invoice.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['issued_date', 'DESC']],
        })
      );
    });

    it('should include order', async () => {
      (Invoice.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 2,
        rows: mockInvoices,
      });

      await getInvoices.execute({});

      expect(Invoice.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({
              model: Order,
              as: 'order',
            }),
          ]),
        })
      );
    });

    it('should return empty array when no invoices found', async () => {
      (Invoice.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 0,
        rows: [],
      });

      const result = await getInvoices.execute({});

      expect(result.invoices).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.pages).toBe(0);
    });

    it('should calculate pagination correctly', async () => {
      const options: GetInvoicesOptions = {
        page: 3,
        limit: 10,
      };

      (Invoice.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 45,
        rows: mockInvoices,
      });

      const result = await getInvoices.execute(options);

      expect(result.pagination).toEqual({
        page: 3,
        limit: 10,
        total: 45,
        pages: 5,
      });
    });
  });

  describe('Manejo de errores', () => {
    it('should handle database errors', async () => {
      (Invoice.findAndCountAll as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(getInvoices.execute({})).rejects.toThrow('Database error');
    });

    it('should handle connection timeout', async () => {
      (Invoice.findAndCountAll as jest.Mock).mockRejectedValue(new Error('Connection timeout'));

      await expect(getInvoices.execute({})).rejects.toThrow('Connection timeout');
    });
  });

  describe('Validación de entrada', () => {
    it('should handle page 0', async () => {
      const options: GetInvoicesOptions = {
        page: 0,
      };

      (Invoice.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 2,
        rows: mockInvoices,
      });

      const result = await getInvoices.execute(options);

      expect(result.pagination.page).toBe(0);
    });

    it('should handle very large page number', async () => {
      const options: GetInvoicesOptions = {
        page: 1000,
      };

      (Invoice.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 2,
        rows: [],
      });

      const result = await getInvoices.execute(options);

      expect(result.invoices).toEqual([]);
    });
  });
});
