/**
 * Tests MUY COMPLETOS para el caso de uso: Obtener Pedidos para Compra Automática
 */

import { GetOrdersForAutoPurchase } from './GetOrdersForAutoPurchase';
import { Order } from '../shared/models/Order';
import { OrderItem } from '../shared/models/OrderItem';

jest.mock('../shared/models/Order');
jest.mock('../shared/models/OrderItem');

describe('GetOrdersForAutoPurchase', () => {
  let getOrdersForAutoPurchase: GetOrdersForAutoPurchase;
  let mockOrders: any[];

  beforeEach(() => {
    jest.clearAllMocks();
    getOrdersForAutoPurchase = new GetOrdersForAutoPurchase();

    mockOrders = [
      {
        id: 1,
        order_number: 'ORD-001',
        status: 'confirmed',
        payment_status: 'completed',
        provider_order_id: null,
        auto_purchase_enabled: true,
        items: [],
      },
      {
        id: 2,
        order_number: 'ORD-002',
        status: 'confirmed',
        payment_status: 'completed',
        provider_order_id: null,
        auto_purchase_enabled: true,
        items: [],
      },
    ];
  });

  describe('Casos exitosos', () => {
    it('should return orders ready for auto-purchase', async () => {
      (Order.findAll as jest.Mock).mockResolvedValue(mockOrders);

      const result = await getOrdersForAutoPurchase.execute();

      expect(Order.findAll).toHaveBeenCalledWith({
        where: {
          status: 'confirmed',
          payment_status: 'completed',
          provider_order_id: null,
          auto_purchase_enabled: true,
        },
        include: [
          {
            model: OrderItem,
            as: 'items',
          },
        ],
        order: [['created_at', 'ASC']],
        limit: 50,
      });
      expect(result).toEqual(mockOrders);
    });

    it('should include order items', async () => {
      (Order.findAll as jest.Mock).mockResolvedValue(mockOrders);

      await getOrdersForAutoPurchase.execute();

      expect(Order.findAll).toHaveBeenCalledWith(
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

    it('should order by created_at ASC (oldest first)', async () => {
      (Order.findAll as jest.Mock).mockResolvedValue(mockOrders);

      await getOrdersForAutoPurchase.execute();

      expect(Order.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['created_at', 'ASC']],
        })
      );
    });

    it('should limit results to 50 orders', async () => {
      (Order.findAll as jest.Mock).mockResolvedValue(mockOrders);

      await getOrdersForAutoPurchase.execute();

      expect(Order.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
        })
      );
    });

    it('should filter by confirmed status', async () => {
      (Order.findAll as jest.Mock).mockResolvedValue(mockOrders);

      await getOrdersForAutoPurchase.execute();

      expect(Order.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'confirmed',
          }),
        })
      );
    });

    it('should filter by completed payment status', async () => {
      (Order.findAll as jest.Mock).mockResolvedValue(mockOrders);

      await getOrdersForAutoPurchase.execute();

      expect(Order.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            payment_status: 'completed',
          }),
        })
      );
    });

    it('should filter by null provider_order_id', async () => {
      (Order.findAll as jest.Mock).mockResolvedValue(mockOrders);

      await getOrdersForAutoPurchase.execute();

      expect(Order.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            provider_order_id: null,
          }),
        })
      );
    });

    it('should filter by auto_purchase_enabled true', async () => {
      (Order.findAll as jest.Mock).mockResolvedValue(mockOrders);

      await getOrdersForAutoPurchase.execute();

      expect(Order.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            auto_purchase_enabled: true,
          }),
        })
      );
    });

    it('should return empty array when no orders found', async () => {
      (Order.findAll as jest.Mock).mockResolvedValue([]);

      const result = await getOrdersForAutoPurchase.execute();

      expect(result).toEqual([]);
    });

    it('should return orders with items', async () => {
      const ordersWithItems = [
        {
          ...mockOrders[0],
          items: [
            { id: 1, product_sku: 'SKU-001', quantity: 2 },
          ],
        },
      ];

      (Order.findAll as jest.Mock).mockResolvedValue(ordersWithItems);

      const result = await getOrdersForAutoPurchase.execute();

      expect((result[0] as any).items).toBeDefined();
      expect((result[0] as any).items).toHaveLength(1);
    });
  });

  describe('Manejo de errores', () => {
    it('should handle database errors', async () => {
      (Order.findAll as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(getOrdersForAutoPurchase.execute()).rejects.toThrow('Database error');
    });

    it('should handle connection timeout', async () => {
      (Order.findAll as jest.Mock).mockRejectedValue(new Error('Connection timeout'));

      await expect(getOrdersForAutoPurchase.execute()).rejects.toThrow('Connection timeout');
    });
  });

  describe('Filtrado de pedidos', () => {
    it('should not return orders with pending status', async () => {
      (Order.findAll as jest.Mock).mockResolvedValue([]);

      await getOrdersForAutoPurchase.execute();

      expect(Order.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            status: 'pending',
          }),
        })
      );
    });

    it('should not return orders with pending payment', async () => {
      (Order.findAll as jest.Mock).mockResolvedValue([]);

      await getOrdersForAutoPurchase.execute();

      expect(Order.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            payment_status: 'pending',
          }),
        })
      );
    });

    it('should not return orders with existing provider_order_id', async () => {
      (Order.findAll as jest.Mock).mockResolvedValue([]);

      await getOrdersForAutoPurchase.execute();

      expect(Order.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            provider_order_id: null,
          }),
        })
      );
    });

    it('should not return orders with auto_purchase disabled', async () => {
      (Order.findAll as jest.Mock).mockResolvedValue([]);

      await getOrdersForAutoPurchase.execute();

      expect(Order.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            auto_purchase_enabled: true,
          }),
        })
      );
    });
  });
});
