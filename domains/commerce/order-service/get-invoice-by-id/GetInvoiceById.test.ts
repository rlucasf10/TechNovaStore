/**
 * Tests MUY COMPLETOS para el caso de uso: Obtener Factura por ID
 */

import { GetInvoiceById } from './GetInvoiceById';
import { Invoice } from '../shared/models/Invoice';
import { Order } from '../shared/models/Order';
import { OrderItem } from '../shared/models/OrderItem';

jest.mock('../shared/models/Invoice');
jest.mock('../shared/models/Order');
jest.mock('../shared/models/OrderItem');

describe('GetInvoiceById', () => {
  let getInvoiceById: GetInvoiceById;
  let mockInvoice: any;

  beforeEach(() => {
    jest.clearAllMocks();
    getInvoiceById = new GetInvoiceById();

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
    it('should return invoice with order details', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      const result = await getInvoiceById.execute(1);

      expect(Invoice.findByPk).toHaveBeenCalledWith(1, {
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
      (Invoice.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await getInvoiceById.execute(999);

      expect(result).toBeNull();
    });

    it('should include order', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      const result = await getInvoiceById.execute(1);

      expect((result as any)?.order).toBeDefined();
    });

    it('should include order items', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      const result = await getInvoiceById.execute(1);

      expect((result as any)?.order.items).toBeDefined();
    });
  });

  describe('Manejo de errores', () => {
    it('should handle database errors', async () => {
      (Invoice.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(getInvoiceById.execute(1)).rejects.toThrow('Database error');
    });

    it('should handle connection timeout', async () => {
      (Invoice.findByPk as jest.Mock).mockRejectedValue(new Error('Connection timeout'));

      await expect(getInvoiceById.execute(1)).rejects.toThrow('Connection timeout');
    });
  });

  describe('Validación de entrada', () => {
    it('should handle zero as invoice id', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await getInvoiceById.execute(0);

      expect(result).toBeNull();
    });

    it('should handle negative invoice id', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await getInvoiceById.execute(-1);

      expect(result).toBeNull();
    });

    it('should handle very large invoice id', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await getInvoiceById.execute(999999999);

      expect(result).toBeNull();
    });
  });

  describe('Relaciones', () => {
    it('should load order relationship', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await getInvoiceById.execute(1);

      expect(Invoice.findByPk).toHaveBeenCalledWith(
        1,
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
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await getInvoiceById.execute(1);

      expect(Invoice.findByPk).toHaveBeenCalledWith(
        1,
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
