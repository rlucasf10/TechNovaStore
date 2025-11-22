/**
 * Tests MUY COMPLETOS para el caso de uso: Obtener Factura por Número
 */

import { GetInvoiceByNumber } from './GetInvoiceByNumber';
import { Invoice } from '../shared/models/Invoice';
import { Order } from '../shared/models/Order';
import { OrderItem } from '../shared/models/OrderItem';

jest.mock('../shared/models/Invoice');
jest.mock('../shared/models/Order');
jest.mock('../shared/models/OrderItem');

describe('GetInvoiceByNumber', () => {
  let getInvoiceByNumber: GetInvoiceByNumber;
  let mockInvoice: any;

  beforeEach(() => {
    jest.clearAllMocks();
    getInvoiceByNumber = new GetInvoiceByNumber();

    mockInvoice = {
      id: 1,
      invoice_number: 'INV-2024-001',
      order_id: 1,
      total_amount: 121.00,
      status: 'issued',
      order: {
        id: 1,
        order_number: 'ORD-123456',
        items: [],
      },
    };
  });

  describe('Casos exitosos', () => {
    it('should return invoice by invoice number', async () => {
      (Invoice.findOne as jest.Mock).mockResolvedValue(mockInvoice);

      const result = await getInvoiceByNumber.execute('INV-2024-001');

      expect(Invoice.findOne).toHaveBeenCalledWith({
        where: { invoice_number: 'INV-2024-001' },
        include: [
          {
            model: Order,
            as: 'order',
            include: [
              {
                model: OrderItem,
                as: 'items',
              },
            ],
          },
        ],
      });
      expect(result).toEqual(mockInvoice);
    });

    it('should return null if invoice not found', async () => {
      (Invoice.findOne as jest.Mock).mockResolvedValue(null);

      const result = await getInvoiceByNumber.execute('INV-NOTFOUND');

      expect(result).toBeNull();
    });

    it('should include order', async () => {
      (Invoice.findOne as jest.Mock).mockResolvedValue(mockInvoice);

      const result = await getInvoiceByNumber.execute('INV-2024-001');

      expect((result as any)?.order).toBeDefined();
    });

    it('should include order items', async () => {
      (Invoice.findOne as jest.Mock).mockResolvedValue(mockInvoice);

      const result = await getInvoiceByNumber.execute('INV-2024-001');

      expect((result as any)?.order.items).toBeDefined();
    });

    it('should handle different invoice number formats', async () => {
      const invoiceNumbers = [
        'INV-2024-001',
        'INV-2024-12345',
        'INVOICE-ABC123',
      ];

      for (const invoiceNumber of invoiceNumbers) {
        (Invoice.findOne as jest.Mock).mockResolvedValue({ ...mockInvoice, invoice_number: invoiceNumber });

        const result = await getInvoiceByNumber.execute(invoiceNumber);

        expect(Invoice.findOne).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { invoice_number: invoiceNumber },
          })
        );
        expect(result?.invoice_number).toBe(invoiceNumber);
      }
    });
  });

  describe('Manejo de errores', () => {
    it('should handle database errors', async () => {
      (Invoice.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(getInvoiceByNumber.execute('INV-2024-001')).rejects.toThrow('Database error');
    });

    it('should handle connection timeout', async () => {
      (Invoice.findOne as jest.Mock).mockRejectedValue(new Error('Connection timeout'));

      await expect(getInvoiceByNumber.execute('INV-2024-001')).rejects.toThrow('Connection timeout');
    });
  });

  describe('Validación de entrada', () => {
    it('should handle empty invoice number', async () => {
      (Invoice.findOne as jest.Mock).mockResolvedValue(null);

      const result = await getInvoiceByNumber.execute('');

      expect(result).toBeNull();
    });

    it('should handle invoice number with special characters', async () => {
      (Invoice.findOne as jest.Mock).mockResolvedValue(mockInvoice);

      await getInvoiceByNumber.execute('INV-2024-001!@#');

      expect(Invoice.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { invoice_number: 'INV-2024-001!@#' },
        })
      );
    });

    it('should handle very long invoice number', async () => {
      const longInvoiceNumber = 'INV-' + 'A'.repeat(100);
      (Invoice.findOne as jest.Mock).mockResolvedValue(null);

      const result = await getInvoiceByNumber.execute(longInvoiceNumber);

      expect(result).toBeNull();
    });
  });

  describe('Relaciones', () => {
    it('should load order relationship', async () => {
      (Invoice.findOne as jest.Mock).mockResolvedValue(mockInvoice);

      await getInvoiceByNumber.execute('INV-2024-001');

      expect(Invoice.findOne).toHaveBeenCalledWith(
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

    it('should load order items relationship', async () => {
      (Invoice.findOne as jest.Mock).mockResolvedValue(mockInvoice);

      await getInvoiceByNumber.execute('INV-2024-001');

      expect(Invoice.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({
              include: expect.arrayContaining([
                expect.objectContaining({
                  model: OrderItem,
                  as: 'items',
                }),
              ]),
            }),
          ]),
        })
      );
    });
  });
});
