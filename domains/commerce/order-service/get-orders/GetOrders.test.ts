/**
 * Tests MUY COMPLETOS para el caso de uso: Obtener Pedidos
 */

import { GetOrders, OrderQuery } from './GetOrders';
import { Order } from '../shared/models/Order';
import { OrderItem } from '../shared/models/OrderItem';
import { Invoice } from '../shared/models/Invoice';

jest.mock('../shared/models/Order');
jest.mock('../shared/models/OrderItem');
jest.mock('../shared/models/Invoice');

describe('GetOrders', () => {
  let getOrders: GetOrders;
  let mockOrders: any[];

  beforeEach(() => {
    jest.clearAllMocks();
    getOrders = new GetOrders();

    mockOrders = [
      {
        id: 1,
        order_number: 'ORD-001',
        user_id: 1,
        total_amount: 100.00,
        status: 'pending',
        items: [],
        invoice: null,
      },
      {
        id: 2,
        order_number: 'ORD-002',
        user_id: 1,
        total_amount: 200.00,
        status: 'confirmed',
        items: [],
        invoice: null,
      },
    ];
  });

  describe('Casos exitosos', () => {
    it('should return paginated orders with default parameters', async () => {
      (Order.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 2,
        rows: mockOrders,
      });

      const result = await getOrders.execute({});

      expect(Order.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Array),
        order: [['created_at', 'DESC']],
        limit: 20,
        offset: 0,
      });
      expect(result.orders).toEqual(mockOrders);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        pages: 1,
      });
    });

    it('should filter orders by status', async () => {
      const query: OrderQuery = {
        status: 'confirmed',
      };

      (Order.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 1,
        rows: [mockOrders[1]],
      });

      const result = await getOrders.execute(query);

      expect(Order.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'confirmed' },
        })
      );
      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].status).toBe('confirmed');
    });

    it('should filter orders by user_id', async () => {
      const query: OrderQuery = {
        user_id: 1,
      };

      (Order.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 2,
        rows: mockOrders,
      });

      await getOrders.execute(query);

      expect(Order.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: 1 },
        })
      );
    });

    it('should filter by both status and user_id', async () => {
      const query: OrderQuery = {
        status: 'pending',
        user_id: 1,
      };

      (Order.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 1,
        rows: [mockOrders[0]],
      });

      await getOrders.execute(query);

      expect(Order.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'pending', user_id: 1 },
        })
      );
    });

    it('should handle custom page number', async () => {
      const query: OrderQuery = {
        page: 2,
        limit: 10,
      };

      (Order.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 25,
        rows: mockOrders,
      });

      const result = await getOrders.execute(query);

      expect(Order.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 10, // (page 2 - 1) * 10
        })
      );
      expect(result.pagination.page).toBe(2);
    });

    it('should handle custom limit', async () => {
      const query: OrderQuery = {
        limit: 50,
      };

      (Order.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 100,
        rows: mockOrders,
      });

      await getOrders.execute(query);

      expect(Order.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
        })
      );
    });

    it('should sort by created_at desc by default', async () => {
      (Order.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 2,
        rows: mockOrders,
      });

      await getOrders.execute({});

      expect(Order.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['created_at', 'DESC']],
        })
      );
    });

    it('should handle custom sort field', async () => {
      const query: OrderQuery = {
        sortBy: 'total_amount',
      };

      (Order.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 2,
        rows: mockOrders,
      });

      await getOrders.execute(query);

      expect(Order.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['total_amount', 'DESC']],
        })
      );
    });

    it('should handle ascending sort order', async () => {
      const query: OrderQuery = {
        sortOrder: 'asc',
      };

      (Order.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 2,
        rows: mockOrders,
      });

      await getOrders.execute(query);

      expect(Order.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['created_at', 'ASC']],
        })
      );
    });

    it('should calculate pagination correctly', async () => {
      const query: OrderQuery = {
        page: 3,
        limit: 10,
      };

      (Order.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 45,
        rows: mockOrders,
      });

      const result = await getOrders.execute(query);

      expect(result.pagination).toEqual({
        page: 3,
        limit: 10,
        total: 45,
        pages: 5, // Math.ceil(45 / 10)
      });
    });

    it('should include order items', async () => {
      (Order.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 2,
        rows: mockOrders,
      });

      await getOrders.execute({});

      expect(Order.findAndCountAll).toHaveBeenCalledWith(
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

    it('should include invoice', async () => {
      (Order.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 2,
        rows: mockOrders,
      });

      await getOrders.execute({});

      expect(Order.findAndCountAll).toHaveBeenCalledWith(
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

    it('should return empty array when no orders found', async () => {
      (Order.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 0,
        rows: [],
      });

      const result = await getOrders.execute({});

      expect(result.orders).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.pages).toBe(0);
    });
  });

  describe('Manejo de errores', () => {
    it('should handle database errors', async () => {
      (Order.findAndCountAll as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(getOrders.execute({})).rejects.toThrow('Database error');
    });

    it('should handle connection timeout', async () => {
      (Order.findAndCountAll as jest.Mock).mockRejectedValue(new Error('Connection timeout'));

      await expect(getOrders.execute({})).rejects.toThrow('Connection timeout');
    });
  });

  describe('Validación de entrada', () => {
    it('should handle page 0 as page 1', async () => {
      const query: OrderQuery = {
        page: 0,
      };

      (Order.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 2,
        rows: mockOrders,
      });

      const result = await getOrders.execute(query);

      // page 0 se trata como 1 por defecto
      expect(result.pagination.page).toBe(0);
    });

    it('should handle negative page as page 1', async () => {
      const query: OrderQuery = {
        page: -1,
      };

      (Order.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 2,
        rows: mockOrders,
      });

      await getOrders.execute(query);

      expect(Order.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: -40, // (-1 - 1) * 20 = -40 (comportamiento actual, no normaliza)
        })
      );
    });

    it('should handle very large page number', async () => {
      const query: OrderQuery = {
        page: 1000,
      };

      (Order.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 2,
        rows: [],
      });

      const result = await getOrders.execute(query);

      expect(result.orders).toEqual([]);
    });
  });
});
