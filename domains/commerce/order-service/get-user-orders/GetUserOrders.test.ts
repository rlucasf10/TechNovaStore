/**
 * Tests MUY COMPLETOS para el caso de uso: Obtener Pedidos de Usuario
 */

import { GetUserOrders } from './GetUserOrders';
import { GetOrders, OrderQuery } from '../get-orders/GetOrders';

jest.mock('../get-orders/GetOrders');

describe('GetUserOrders', () => {
  let getUserOrders: GetUserOrders;
  let mockGetOrders: jest.Mocked<GetOrders>;

  beforeEach(() => {
    jest.clearAllMocks();
    getUserOrders = new GetUserOrders();
    mockGetOrders = new GetOrders() as jest.Mocked<GetOrders>;
    (getUserOrders as any).getOrders = mockGetOrders;
  });

  describe('Casos exitosos', () => {
    it('should get orders for specific user', async () => {
      const mockResponse = {
        orders: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
      };

      mockGetOrders.execute = jest.fn().mockResolvedValue(mockResponse);

      const result = await getUserOrders.execute(1, {});

      expect(mockGetOrders.execute).toHaveBeenCalledWith({
        user_id: 1,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should pass through pagination parameters', async () => {
      const query: Omit<OrderQuery, 'user_id'> = {
        page: 2,
        limit: 10,
      };

      const mockResponse = {
        orders: [],
        pagination: {
          page: 2,
          limit: 10,
          total: 0,
          pages: 0,
        },
      };

      mockGetOrders.execute = jest.fn().mockResolvedValue(mockResponse);

      await getUserOrders.execute(1, query);

      expect(mockGetOrders.execute).toHaveBeenCalledWith({
        ...query,
        user_id: 1,
      });
    });

    it('should pass through status filter', async () => {
      const query: Omit<OrderQuery, 'user_id'> = {
        status: 'pending',
      };

      const mockResponse = {
        orders: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
      };

      mockGetOrders.execute = jest.fn().mockResolvedValue(mockResponse);

      await getUserOrders.execute(1, query);

      expect(mockGetOrders.execute).toHaveBeenCalledWith({
        ...query,
        user_id: 1,
      });
    });

    it('should pass through sort parameters', async () => {
      const query: Omit<OrderQuery, 'user_id'> = {
        sortBy: 'total_amount',
        sortOrder: 'asc',
      };

      const mockResponse = {
        orders: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
      };

      mockGetOrders.execute = jest.fn().mockResolvedValue(mockResponse);

      await getUserOrders.execute(1, query);

      expect(mockGetOrders.execute).toHaveBeenCalledWith({
        ...query,
        user_id: 1,
      });
    });

    it('should handle multiple query parameters', async () => {
      const query: Omit<OrderQuery, 'user_id'> = {
        page: 3,
        limit: 50,
        status: 'delivered',
        sortBy: 'created_at',
        sortOrder: 'desc',
      };

      const mockResponse = {
        orders: [],
        pagination: {
          page: 3,
          limit: 50,
          total: 0,
          pages: 0,
        },
      };

      mockGetOrders.execute = jest.fn().mockResolvedValue(mockResponse);

      await getUserOrders.execute(1, query);

      expect(mockGetOrders.execute).toHaveBeenCalledWith({
        ...query,
        user_id: 1,
      });
    });

    it('should work with different user ids', async () => {
      const userIds = [1, 2, 100, 999];
      const mockResponse = {
        orders: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
      };

      mockGetOrders.execute = jest.fn().mockResolvedValue(mockResponse);

      for (const userId of userIds) {
        await getUserOrders.execute(userId, {});

        expect(mockGetOrders.execute).toHaveBeenCalledWith({
          user_id: userId,
        });
      }
    });

    it('should return orders from GetOrders', async () => {
      const mockOrders = [
        { id: 1, order_number: 'ORD-001', user_id: 1 },
        { id: 2, order_number: 'ORD-002', user_id: 1 },
      ];

      const mockResponse = {
        orders: mockOrders,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          pages: 1,
        },
      };

      mockGetOrders.execute = jest.fn().mockResolvedValue(mockResponse);

      const result = await getUserOrders.execute(1, {});

      expect(result.orders).toEqual(mockOrders);
      expect(result.pagination.total).toBe(2);
    });

    it('should handle empty results', async () => {
      const mockResponse = {
        orders: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
      };

      mockGetOrders.execute = jest.fn().mockResolvedValue(mockResponse);

      const result = await getUserOrders.execute(999, {});

      expect(result.orders).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('Manejo de errores', () => {
    it('should propagate errors from GetOrders', async () => {
      mockGetOrders.execute = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(getUserOrders.execute(1, {})).rejects.toThrow('Database error');
    });

    it('should handle connection errors', async () => {
      mockGetOrders.execute = jest.fn().mockRejectedValue(new Error('Connection timeout'));

      await expect(getUserOrders.execute(1, {})).rejects.toThrow('Connection timeout');
    });
  });

  describe('Validación de entrada', () => {
    it('should handle user id 0', async () => {
      const mockResponse = {
        orders: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
      };

      mockGetOrders.execute = jest.fn().mockResolvedValue(mockResponse);

      await getUserOrders.execute(0, {});

      expect(mockGetOrders.execute).toHaveBeenCalledWith({
        user_id: 0,
      });
    });

    it('should handle negative user id', async () => {
      const mockResponse = {
        orders: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
      };

      mockGetOrders.execute = jest.fn().mockResolvedValue(mockResponse);

      await getUserOrders.execute(-1, {});

      expect(mockGetOrders.execute).toHaveBeenCalledWith({
        user_id: -1,
      });
    });

    it('should handle very large user id', async () => {
      const mockResponse = {
        orders: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
      };

      mockGetOrders.execute = jest.fn().mockResolvedValue(mockResponse);

      await getUserOrders.execute(999999999, {});

      expect(mockGetOrders.execute).toHaveBeenCalledWith({
        user_id: 999999999,
      });
    });
  });
});
