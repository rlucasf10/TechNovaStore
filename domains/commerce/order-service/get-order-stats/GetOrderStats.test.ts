/**
 * Tests MUY COMPLETOS para el caso de uso: Obtener Estadísticas de Pedidos
 */

import { GetOrderStats } from './GetOrderStats';
import { Order } from '../shared/models/Order';

jest.mock('../shared/models/Order');

describe('GetOrderStats', () => {
  let getOrderStats: GetOrderStats;

  beforeEach(() => {
    jest.clearAllMocks();
    getOrderStats = new GetOrderStats();
  });

  describe('Casos exitosos', () => {
    it('should return stats for all orders', async () => {
      (Order.count as jest.Mock)
        .mockResolvedValueOnce(100) // totalOrders
        .mockResolvedValueOnce(20)  // pendingOrders
        .mockResolvedValueOnce(60)  // completedOrders
        .mockResolvedValueOnce(10); // cancelledOrders
      (Order.sum as jest.Mock).mockResolvedValue(15000.00); // totalRevenue

      const result = await getOrderStats.execute();

      expect(result).toEqual({
        totalOrders: 100,
        pendingOrders: 20,
        completedOrders: 60,
        cancelledOrders: 10,
        totalRevenue: 15000.00,
      });
    });

    it('should return stats for specific user', async () => {
      (Order.count as jest.Mock)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(6)
        .mockResolvedValueOnce(1);
      (Order.sum as jest.Mock).mockResolvedValue(1500.00);

      const result = await getOrderStats.execute(1);

      expect(Order.count).toHaveBeenCalledWith({ where: { user_id: 1 } });
      expect(Order.count).toHaveBeenCalledWith({ where: { user_id: 1, status: 'pending' } });
      expect(Order.count).toHaveBeenCalledWith({ where: { user_id: 1, status: 'delivered' } });
      expect(Order.count).toHaveBeenCalledWith({ where: { user_id: 1, status: 'cancelled' } });
      expect(Order.sum).toHaveBeenCalledWith('total_amount', { where: { user_id: 1, status: 'delivered' } });
      expect(result.totalOrders).toBe(10);
      expect(result.totalRevenue).toBe(1500.00);
    });

    it('should handle zero orders', async () => {
      (Order.count as jest.Mock).mockResolvedValue(0);
      (Order.sum as jest.Mock).mockResolvedValue(null);

      const result = await getOrderStats.execute();

      expect(result).toEqual({
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
      });
    });

    it('should handle null revenue (no delivered orders)', async () => {
      (Order.count as jest.Mock)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      (Order.sum as jest.Mock).mockResolvedValue(null);

      const result = await getOrderStats.execute();

      expect(result.totalRevenue).toBe(0);
    });

    it('should calculate stats with only pending orders', async () => {
      (Order.count as jest.Mock)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      (Order.sum as jest.Mock).mockResolvedValue(null);

      const result = await getOrderStats.execute();

      expect(result).toEqual({
        totalOrders: 5,
        pendingOrders: 5,
        completedOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
      });
    });

    it('should calculate stats with only completed orders', async () => {
      (Order.count as jest.Mock)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(0);
      (Order.sum as jest.Mock).mockResolvedValue(5000.00);

      const result = await getOrderStats.execute();

      expect(result).toEqual({
        totalOrders: 10,
        pendingOrders: 0,
        completedOrders: 10,
        cancelledOrders: 0,
        totalRevenue: 5000.00,
      });
    });

    it('should calculate stats with mixed order statuses', async () => {
      (Order.count as jest.Mock)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(15)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(5);
      (Order.sum as jest.Mock).mockResolvedValue(12000.00);

      const result = await getOrderStats.execute();

      expect(result).toEqual({
        totalOrders: 50,
        pendingOrders: 15,
        completedOrders: 30,
        cancelledOrders: 5,
        totalRevenue: 12000.00,
      });
    });

    it('should handle large revenue amounts', async () => {
      (Order.count as jest.Mock)
        .mockResolvedValueOnce(1000)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(800)
        .mockResolvedValueOnce(50);
      (Order.sum as jest.Mock).mockResolvedValue(1000000.00);

      const result = await getOrderStats.execute();

      expect(result.totalRevenue).toBe(1000000.00);
    });

    it('should handle decimal revenue amounts', async () => {
      (Order.count as jest.Mock)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(0);
      (Order.sum as jest.Mock).mockResolvedValue(1234.56);

      const result = await getOrderStats.execute();

      expect(result.totalRevenue).toBe(1234.56);
    });

    it('should execute all queries in parallel', async () => {
      (Order.count as jest.Mock).mockResolvedValue(10);
      (Order.sum as jest.Mock).mockResolvedValue(1000.00);

      await getOrderStats.execute();

      // Verificar que se llamaron todas las funciones
      expect(Order.count).toHaveBeenCalledTimes(4);
      expect(Order.sum).toHaveBeenCalledTimes(1);
    });
  });

  describe('Manejo de errores', () => {
    it('should handle database errors in count', async () => {
      (Order.count as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(getOrderStats.execute()).rejects.toThrow('Database error');
    });

    it('should handle database errors in sum', async () => {
      (Order.count as jest.Mock).mockResolvedValue(10);
      (Order.sum as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(getOrderStats.execute()).rejects.toThrow('Database error');
    });

    it('should handle connection timeout', async () => {
      (Order.count as jest.Mock).mockRejectedValue(new Error('Connection timeout'));

      await expect(getOrderStats.execute()).rejects.toThrow('Connection timeout');
    });
  });

  describe('Validación de entrada', () => {
    it('should handle user id 0', async () => {
      (Order.count as jest.Mock).mockResolvedValue(0);
      (Order.sum as jest.Mock).mockResolvedValue(null);

      await getOrderStats.execute(0);

      expect(Order.count).toHaveBeenCalledWith({ where: { user_id: 0 } });
    });

    it('should handle negative user id', async () => {
      (Order.count as jest.Mock).mockResolvedValue(0);
      (Order.sum as jest.Mock).mockResolvedValue(null);

      await getOrderStats.execute(-1);

      expect(Order.count).toHaveBeenCalledWith({ where: { user_id: -1 } });
    });

    it('should handle very large user id', async () => {
      (Order.count as jest.Mock).mockResolvedValue(0);
      (Order.sum as jest.Mock).mockResolvedValue(null);

      await getOrderStats.execute(999999999);

      expect(Order.count).toHaveBeenCalledWith({ where: { user_id: 999999999 } });
    });
  });
});
