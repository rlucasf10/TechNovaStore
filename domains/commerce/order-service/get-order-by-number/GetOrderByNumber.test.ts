/**
 * Tests MUY COMPLETOS para el caso de uso: Obtener Pedido por Número
 */

import { GetOrderByNumber } from './GetOrderByNumber';
import { Order } from '../shared/models/Order';
import { OrderItem } from '../shared/models/OrderItem';
import { Invoice } from '../shared/models/Invoice';

jest.mock('../shared/models/Order');
jest.mock('../shared/models/OrderItem');
jest.mock('../shared/models/Invoice');

describe('GetOrderByNumber', () => {
  let getOrderByNumber: GetOrderByNumber;
  let mockOrder: any;

  beforeEach(() => {
    jest.clearAllMocks();
    getOrderByNumber = new GetOrderByNumber();

    mockOrder = {
      id: 1,
      order_number: 'ORD-123456',
      user_id: 1,
      total_amount: 100.00,
      status: 'pending',
      items: [
        {
          id: 1,
          product_sku: 'SKU-001',
          product_name: 'Product 1',
          quantity: 2,
          unit_price: 50.00,
        },
      ],
      invoice: null,
    };
  });

  describe('Casos exitosos', () => {
    it('should return order by order number', async () => {
      (Order.findOne as jest.Mock).mockResolvedValue(mockOrder);

      const result = await getOrderByNumber.execute('ORD-123456');

      expect(Order.findOne).toHaveBeenCalledWith({
        where: { order_number: 'ORD-123456' },
        include: [
          {
            model: OrderItem,
            as: 'items',
          },
          {
            model: Invoice,
            as: 'invoice',
          },
        ],
      });
      expect(result).toEqual(mockOrder);
    });

    it('should return null if order not found', async () => {
      (Order.findOne as jest.Mock).mockResolvedValue(null);

      const result = await getOrderByNumber.execute('ORD-NOTFOUND');

      expect(result).toBeNull();
    });

    it('should include order items', async () => {
      (Order.findOne as jest.Mock).mockResolvedValue(mockOrder);

      const result = await getOrderByNumber.execute('ORD-123456');

      expect((result as any)?.items).toBeDefined();
      expect((result as any)?.items).toHaveLength(1);
    });

    it('should include invoice if exists', async () => {
      const orderWithInvoice = {
        ...mockOrder,
        invoice: {
          id: 1,
          invoice_number: 'INV-123',
          total_amount: 100.00,
        },
      };

      (Order.findOne as jest.Mock).mockResolvedValue(orderWithInvoice);

      const result = await getOrderByNumber.execute('ORD-123456');

      expect((result as any)?.invoice).toBeDefined();
      expect((result as any)?.invoice.invoice_number).toBe('INV-123');
    });

    it('should handle order without invoice', async () => {
      (Order.findOne as jest.Mock).mockResolvedValue(mockOrder);

      const result = await getOrderByNumber.execute('ORD-123456');

      expect((result as any)?.invoice).toBeNull();
    });

    it('should handle different order number formats', async () => {
      const orderNumbers = [
        'ORD-123456',
        'ORD-2024-001',
        'ORDER-ABC123',
        'ORD-123456-789',
      ];

      for (const orderNumber of orderNumbers) {
        (Order.findOne as jest.Mock).mockResolvedValue({ ...mockOrder, order_number: orderNumber });

        const result = await getOrderByNumber.execute(orderNumber);

        expect(Order.findOne).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { order_number: orderNumber },
          })
        );
        expect(result?.order_number).toBe(orderNumber);
      }
    });

    it('should handle order with multiple items', async () => {
      const orderWithMultipleItems = {
        ...mockOrder,
        items: [
          { id: 1, product_sku: 'SKU-001', product_name: 'Product 1', quantity: 1, unit_price: 10.00 },
          { id: 2, product_sku: 'SKU-002', product_name: 'Product 2', quantity: 2, unit_price: 20.00 },
          { id: 3, product_sku: 'SKU-003', product_name: 'Product 3', quantity: 3, unit_price: 30.00 },
        ],
      };

      (Order.findOne as jest.Mock).mockResolvedValue(orderWithMultipleItems);

      const result = await getOrderByNumber.execute('ORD-123456');

      expect((result as any)?.items).toHaveLength(3);
    });
  });

  describe('Manejo de errores', () => {
    it('should handle database errors', async () => {
      (Order.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(getOrderByNumber.execute('ORD-123456')).rejects.toThrow('Database error');
    });

    it('should handle connection timeout', async () => {
      (Order.findOne as jest.Mock).mockRejectedValue(new Error('Connection timeout'));

      await expect(getOrderByNumber.execute('ORD-123456')).rejects.toThrow('Connection timeout');
    });

    it('should handle malformed order number', async () => {
      (Order.findOne as jest.Mock).mockResolvedValue(null);

      const result = await getOrderByNumber.execute('INVALID');

      expect(result).toBeNull();
    });
  });

  describe('Validación de entrada', () => {
    it('should handle empty order number', async () => {
      (Order.findOne as jest.Mock).mockResolvedValue(null);

      const result = await getOrderByNumber.execute('');

      expect(result).toBeNull();
    });

    it('should handle order number with special characters', async () => {
      (Order.findOne as jest.Mock).mockResolvedValue(mockOrder);

      await getOrderByNumber.execute('ORD-123-ABC!@#');

      expect(Order.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { order_number: 'ORD-123-ABC!@#' },
        })
      );
    });

    it('should handle very long order number', async () => {
      const longOrderNumber = 'ORD-' + 'A'.repeat(100);
      (Order.findOne as jest.Mock).mockResolvedValue(null);

      const result = await getOrderByNumber.execute(longOrderNumber);

      expect(result).toBeNull();
    });

    it('should handle order number with spaces', async () => {
      (Order.findOne as jest.Mock).mockResolvedValue(null);

      await getOrderByNumber.execute('ORD 123 456');

      expect(Order.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { order_number: 'ORD 123 456' },
        })
      );
    });
  });

  describe('Relaciones', () => {
    it('should load items relationship', async () => {
      (Order.findOne as jest.Mock).mockResolvedValue(mockOrder);

      await getOrderByNumber.execute('ORD-123456');

      expect(Order.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({
              model: OrderItem,
              as: 'items',
            }),
          ]),
        })
      );
    });

    it('should load invoice relationship', async () => {
      (Order.findOne as jest.Mock).mockResolvedValue(mockOrder);

      await getOrderByNumber.execute('ORD-123456');

      expect(Order.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({
              model: Invoice,
              as: 'invoice',
            }),
          ]),
        })
      );
    });
  });
});
