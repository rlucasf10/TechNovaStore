/**
 * Tests MUY COMPLETOS para el caso de uso: Obtener Pedido por ID
 */

import { GetOrderById } from './GetOrderById';
import { Order } from '../shared/models/Order';
import { OrderItem } from '../shared/models/OrderItem';
import { Invoice } from '../shared/models/Invoice';

jest.mock('../shared/models/Order');
jest.mock('../shared/models/OrderItem');
jest.mock('../shared/models/Invoice');

describe('GetOrderById', () => {
  let getOrderById: GetOrderById;
  let mockOrder: any;

  beforeEach(() => {
    jest.clearAllMocks();
    getOrderById = new GetOrderById();

    mockOrder = {
      id: 1,
      order_number: 'ORD-123456',
      user_id: 1,
      total_amount: 100.00,
      status: 'pending',
      payment_status: 'pending',
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
    it('should return order with items and invoice', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      const result = await getOrderById.execute(1);

      expect(Order.findByPk).toHaveBeenCalledWith(1, {
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
      (Order.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await getOrderById.execute(999);

      expect(result).toBeNull();
    });

    it('should include order items', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      const result = await getOrderById.execute(1);

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

      (Order.findByPk as jest.Mock).mockResolvedValue(orderWithInvoice);

      const result = await getOrderById.execute(1);

      expect((result as any)?.invoice).toBeDefined();
      expect((result as any)?.invoice.invoice_number).toBe('INV-123');
    });

    it('should handle order without invoice', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      const result = await getOrderById.execute(1);

      expect((result as any)?.invoice).toBeNull();
    });
  });

  describe('Manejo de errores', () => {
    it('should handle database errors', async () => {
      (Order.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(getOrderById.execute(1)).rejects.toThrow('Database error');
    });

    it('should handle invalid order id', async () => {
      (Order.findByPk as 
jest.Mock).mockResolvedValue(null);

      const result = await getOrderById.execute(-1);

      expect(result).toBeNull();
    });

    it('should handle connection timeout', async () => {
      (Order.findByPk as jest.Mock).mockRejectedValue(new Error('Connection timeout'));

      await expect(getOrderById.execute(1)).rejects.toThrow('Connection timeout');
    });
  });

  describe('Validación de entrada', () => {
    it('should handle zero as order id', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await getOrderById.execute(0);

      expect(result).toBeNull();
    });

    it('should handle very large order id', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await getOrderById.execute(999999999);

      expect(result).toBeNull();
    });
  });

  describe('Relaciones', () => {
    it('should load items relationship', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await getOrderById.execute(1);

      expect(Order.findByPk).toHaveBeenCalledWith(
        1,
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
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

      await getOrderById.execute(1);

      expect(Order.findByPk).toHaveBeenCalledWith(
        1,
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

    it('should handle order with multiple items', async () => {
      const orderWithMultipleItems = {
        ...mockOrder,
        items: [
          { id: 1, product_sku: 'SKU-001', product_name: 'Product 1', quantity: 1, unit_price: 10.00 },
          { id: 2, product_sku: 'SKU-002', product_name: 'Product 2', quantity: 2, unit_price: 20.00 },
          { id: 3, product_sku: 'SKU-003', product_name: 'Product 3', quantity: 3, unit_price: 30.00 },
        ],
      };

      (Order.findByPk as jest.Mock).mockResolvedValue(orderWithMultipleItems);

      const result = await getOrderById.execute(1);

      expect((result as any)?.items).toHaveLength(3);
    });
  });
});
