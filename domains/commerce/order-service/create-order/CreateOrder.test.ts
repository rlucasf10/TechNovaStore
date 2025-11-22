/**
 * Tests MUY COMPLETOS para el caso de uso: Crear Pedido
 * Basados en la lógica original de OrderService.createOrder()
 */

// Mock config/database ANTES de que se importe en los modelos
jest.mock('../config/database', () => ({
  sequelize: {
    transaction: jest.fn(),
    define: jest.fn(),
  },
  connectPostgreSQL: jest.fn(),
}));

// Mocks de modelos - ANTES de importar los casos de uso
jest.mock('../shared/models/Order', () => ({
  Order: {
    init: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
  },
}));

jest.mock('../shared/models/OrderItem', () => ({
  OrderItem: {
    init: jest.fn(),
    create: jest.fn(),
    bulkCreate: jest.fn(),
    findAll: jest.fn(),
  },
}));

jest.mock('../shared/utils/logger');
jest.mock('../shared/services/eventService');

// Imports DESPUÉS de los mocks
import { CreateOrder, CreateOrderData } from './CreateOrder';
import { Order } from '../shared/models/Order';
import { OrderItem } from '../shared/models/OrderItem';
import { logger } from '../shared/utils/logger';
import { sequelize } from '../config/database';
import { orderEventService } from '../shared/services/eventService';

describe('CreateOrder', () => {
  let createOrder: CreateOrder;
  let mockTransaction: any;
  let mockOrder: any;

  beforeEach(() => {
    jest.clearAllMocks();
    createOrder = new CreateOrder();

    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    mockOrder = {
      id: 1,
      order_number: 'ORD-123456',
      user_id: 1,
      total_amount: 100.00,
      status: 'pending',
      payment_status: 'pending',
    };

    (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);
  });

  describe('Casos exitosos', () => {
    it('should create order with items successfully', async () => {
      const orderData: CreateOrderData = {
        user_id: 1,
        items: [
          {
            product_sku: 'SKU-001',
            product_name: 'Product 1',
            quantity: 2,
            unit_price: 25.00,
          },
          {
            product_sku: 'SKU-002',
            product_name: 'Product 2',
            quantity: 1,
            unit_price: 50.00,
          },
        ],
        shipping_address: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
        billing_address: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
        payment_method: 'credit_card',
      };

      (Order.create as jest.Mock).mockResolvedValue(mockOrder);
      (OrderItem.bulkCreate as jest.Mock).mockResolvedValue([]);

      const result = await createOrder.execute(orderData);

      expect(sequelize.transaction).toHaveBeenCalled();
      expect(Order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          total_amount: 100.00,
          status: 'pending',
          payment_status: 'pending',
        }),
        { transaction: mockTransaction }
      );
      expect(OrderItem.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            product_sku: 'SKU-001',
            quantity: 2,
            unit_price: 25.00,
            total_price: 50.00,
          }),
          expect.objectContaining({
            product_sku: 'SKU-002',
            quantity: 1,
            unit_price: 50.00,
            total_price: 50.00,
          }),
        ]),
        { transaction: mockTransaction }
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(orderEventService.emitOrderCreated).toHaveBeenCalledWith(mockOrder);
      expect(result).toEqual(mockOrder);
    });

    it('should calculate total amount correctly', async () => {
      const orderData: CreateOrderData = {
        user_id: 1,
        items: [
          { product_sku: 'SKU-001', product_name: 'Product 1', quantity: 3, unit_price: 10.50 },
          { product_sku: 'SKU-002', product_name: 'Product 2', quantity: 2, unit_price: 25.75 },
        ],
        shipping_address: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
        billing_address: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
        payment_method: 'credit_card',
      };

      (Order.create as jest.Mock).mockResolvedValue(mockOrder);
      (OrderItem.bulkCreate as jest.Mock).mockResolvedValue([]);

      await createOrder.execute(orderData);

      expect(Order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          total_amount: 83.00, // (3 * 10.50) + (2 * 25.75) = 31.50 + 51.50 = 83.00
        }),
        { transaction: mockTransaction }
      );
    });

    it('should create order with optional notes', async () => {
      const orderData: CreateOrderData = {
        user_id: 1,
        items: [
          { product_sku: 'SKU-001', product_name: 'Product 1', quantity: 1, unit_price: 50.00 },
        ],
        shipping_address: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
        billing_address: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
        payment_method: 'credit_card',
        notes: 'Please deliver before 5 PM',
      };

      (Order.create as jest.Mock).mockResolvedValue(mockOrder);
      (OrderItem.bulkCreate as jest.Mock).mockResolvedValue([]);

      await createOrder.execute(orderData);

      expect(Order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: 'Please deliver before 5 PM',
        }),
        { transaction: mockTransaction }
      );
    });

    it('should create order with single item', async () => {
      const orderData: CreateOrderData = {
        user_id: 1,
        items: [
          { product_sku: 'SKU-001', product_name: 'Product 1', quantity: 1, unit_price: 100.00 },
        ],
        shipping_address: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
        billing_address: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
        payment_method: 'paypal',
      };

      (Order.create as jest.Mock).mockResolvedValue(mockOrder);
      (OrderItem.bulkCreate as jest.Mock).mockResolvedValue([]);

      await createOrder.execute(orderData);

      expect(OrderItem.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            product_sku: 'SKU-001',
            quantity: 1,
          }),
        ]),
        { transaction: mockTransaction }
      );
    });

    it('should create order with multiple items', async () => {
      const orderData: CreateOrderData = {
        user_id: 1,
        items: [
          { product_sku: 'SKU-001', product_name: 'Product 1', quantity: 1, unit_price: 10.00 },
          { product_sku: 'SKU-002', product_name: 'Product 2', quantity: 2, unit_price: 20.00 },
          { product_sku: 'SKU-003', product_name: 'Product 3', quantity: 3, unit_price: 30.00 },
        ],
        shipping_address: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
        billing_address: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
        payment_method: 'credit_card',
      };

      (Order.create as jest.Mock).mockResolvedValue(mockOrder);
      (OrderItem.bulkCreate as jest.Mock).mockResolvedValue([]);

      await createOrder.execute(orderData);

      expect(OrderItem.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.any(Object),
          expect.any(Object),
          expect.any(Object),
        ]),
        { transaction: mockTransaction }
      );
      expect((OrderItem.bulkCreate as jest.Mock).mock.calls[0][0]).toHaveLength(3);
    });

    it('should set initial status to pending', async () => {
      const orderData: CreateOrderData = {
        user_id: 1,
        items: [
          { product_sku: 'SKU-001', product_name: 'Product 1', quantity: 1, unit_price: 50.00 },
        ],
        shipping_address: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
        billing_address: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
        payment_method: 'credit_card',
      };

      (Order.create as jest.Mock).mockResolvedValue(mockOrder);
      (OrderItem.bulkCreate as jest.Mock).mockResolvedValue([]);

      await createOrder.execute(orderData);

      expect(Order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending',
          payment_status: 'pending',
        }),
        { transaction: mockTransaction }
      );
    });

    it('should log order creation', async () => {
      const orderData: CreateOrderData = {
        user_id: 1,
        items: [
          { product_sku: 'SKU-001', product_name: 'Product 1', quantity: 1, unit_price: 50.00 },
        ],
        shipping_address: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
        billing_address: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
        payment_method: 'credit_card',
      };

      (Order.create as jest.Mock).mockResolvedValue(mockOrder);
      (OrderItem.bulkCreate as jest.Mock).mockResolvedValue([]);

      await createOrder.execute(orderData);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Order created'),
        expect.objectContaining({
          orderId: mockOrder.id,
          userId: mockOrder.user_id,
          totalAmount: mockOrder.total_amount,
        })
      );
    });

    it('should emit order created event', async () => {
      const orderData: CreateOrderData = {
        user_id: 1,
        items: [
          { product_sku: 'SKU-001', product_name: 'Product 1', quantity: 1, unit_price: 50.00 },
        ],
        shipping_address: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
        billing_address: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
        payment_method: 'credit_card',
      };

      (Order.create as jest.Mock).mockResolvedValue(mockOrder);
      (OrderItem.bulkCreate as jest.Mock).mockResolvedValue([]);

      await createOrder.execute(orderData);

      expect(orderEventService.emitOrderCreated).toHaveBeenCalledWith(mockOrder);
    });

    it('should handle different payment methods', async () => {
      const paymentMethods = ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'];

      for (const method of paymentMethods) {
        const orderData: CreateOrderData = {
          user_id: 1,
          items: [
            { product_sku: 'SKU-001', product_name: 'Product 1', quantity: 1, unit_price: 50.00 },
          ],
          shipping_address: {
            street: '123 Main St',
            city: 'Madrid',
            state: 'Madrid',
            postal_code: '28001',
            country: 'España',
          },
          billing_address: {
            street: '123 Main St',
            city: 'Madrid',
            state: 'Madrid',
            postal_code: '28001',
            country: 'España',
          },
          payment_method: method,
        };

        (Order.create as jest.Mock).mockResolvedValue(mockOrder);
        (OrderItem.bulkCreate as jest.Mock).mockResolvedValue([]);

        await createOrder.execute(orderData);

        expect(Order.create).toHaveBeenCalledWith(
          expect.objectContaining({
            payment_method: method,
          }),
          { transaction: mockTransaction }
        );
      }
    });
  });

  describe('Manejo de errores', () => {
    it('should rollback transaction if order creation fails', async () => {
      const orderData: CreateOrderData = {
        user_id: 1,
        items: [
          { product_sku: 'SKU-001', product_name: 'Product 1', quantity: 1, unit_price: 50.00 },
        ],
        shipping_address: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
        billing_address: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
        payment_method: 'credit_card',
      };

      (Order.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(createOrder.execute(orderData)).rejects.toThrow('Database error');

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    });

    it('should rollback transaction if order items creation fails', async () => {
      const orderData: CreateOrderData = {
        user_id: 1,
        items: [
          { product_sku: 'SKU-001', product_name: 'Product 1', quantity: 1, unit_price: 50.00 },
        ],
        shipping_address: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
        billing_address: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
        payment_method: 'credit_card',
      };

      (Order.create as jest.Mock).mockResolvedValue(mockOrder);
      (OrderItem.bulkCreate as jest.Mock).mockRejectedValue(new Error('Items creation failed'));

      await expect(createOrder.execute(orderData)).rejects.toThrow('Items creation failed');

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });

    it('should not emit event if order creation fails', async () => {
      const orderData: CreateOrderData = {
        user_id: 1,
        items: [
          { product_sku: 'SKU-001', product_name: 'Product 1', quantity: 1, unit_price: 50.00 },
        ],
        shipping_address: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
        billing_address: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
        payment_method: 'credit_card',
      };

      (Order.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(createOrder.execute(orderData)).rejects.toThrow();

      expect(orderEventService.emitOrderCreated).not.toHaveBeenCalled();
    });

    it('should handle transaction creation failure', async () => {
      const orderData: CreateOrderData = {
        user_id: 1,
        items: [
          { product_sku: 'SKU-001', product_name: 'Product 1', quantity: 1, unit_price: 50.00 },
        ],
        shipping_address: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
        billing_address: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
        payment_method: 'credit_card',
      };

      (sequelize.transaction as jest.Mock).mockRejectedValue(new Error('Transaction failed'));

      await expect(createOrder.execute(orderData)).rejects.toThrow('Transaction failed');
    });
  });

  describe('Validación de datos', () => {
    it('should handle empty items array', async () => {
      const orderData: CreateOrderData = {
        user_id: 1,
        items: [],
        shipping_address: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
        billing_address: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
        payment_method: 'credit_card',
      };

      (Order.create as jest.Mock).mockResolvedValue(mockOrder);
      (OrderItem.bulkCreate as jest.Mock).mockResolvedValue([]);

      await createOrder.execute(orderData);

      expect(Order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          total_amount: 0,
        }),
        { transaction: mockTransaction }
      );
    });

    it('should calculate total with decimal precision', async () => {
      const orderData: CreateOrderData = {
        user_id: 1,
        items: [
          { product_sku: 'SKU-001', product_name: 'Product 1', quantity: 3, unit_price: 10.99 },
          { product_sku: 'SKU-002', product_name: 'Product 2', quantity: 2, unit_price: 15.49 },
        ],
        shipping_address: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
        billing_address: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
        payment_method: 'credit_card',
      };

      (Order.create as jest.Mock).mockResolvedValue(mockOrder);
      (OrderItem.bulkCreate as jest.Mock).mockResolvedValue([]);

      await createOrder.execute(orderData);

      expect(Order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          total_amount: 63.95, // (3 * 10.99) + (2 * 15.49) = 32.97 + 30.98 = 63.95
        }),
        { transaction: mockTransaction }
      );
    });
  });
});
