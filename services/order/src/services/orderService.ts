import { Order, OrderStatus } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { Invoice } from '../models/Invoice';
import { logger } from '../utils/logger';
import { sequelize } from '../config/database';
import { Op } from 'sequelize';
import { orderEventService } from './eventService';
import { InvoiceService } from './invoiceService';

export interface CreateOrderData {
  user_id: number;
  items: Array<{
    product_sku: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
  shipping_address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  billing_address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  payment_method: string;
  notes?: string;
}

export interface OrderQuery {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  user_id?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OrderResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class OrderService {
  static async createOrder(orderData: CreateOrderData): Promise<Order> {
    const transaction = await sequelize.transaction();
    
    try {
      // Calculate total amount
      const total_amount = orderData.items.reduce(
        (sum, item) => sum + (item.unit_price * item.quantity),
        0
      );

      // Create order
      const order = await Order.create({
        user_id: orderData.user_id,
        total_amount,
        shipping_address: orderData.shipping_address,
        billing_address: orderData.billing_address,
        payment_method: orderData.payment_method,
        notes: orderData.notes,
        status: 'pending',
        payment_status: 'pending',
      }, { transaction });

      // Create order items
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_sku: item.product_sku,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity,
      }));

      await OrderItem.bulkCreate(orderItems, { transaction });

      // Note: Invoice will be generated automatically when order is confirmed
      // This is handled by the InvoiceService.generateAutomaticInvoice method

      await transaction.commit();

      logger.info(`Order created: ${order.order_number}`, {
        orderId: order.id,
        userId: order.user_id,
        totalAmount: order.total_amount,
      });

      // Emit order created event
      orderEventService.emitOrderCreated(order);

      return order;
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to create order:', error);
      throw error;
    }
  }

  static async getOrders(query: OrderQuery): Promise<OrderResponse> {
    const {
      page = 1,
      limit = 20,
      status,
      user_id,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = query;

    const where: any = {};
    if (status) where.status = status;
    if (user_id) where.user_id = user_id;

    const order: any = [[sortBy, sortOrder.toUpperCase()]];
    const offset = (page - 1) * limit;

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
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
      order,
      limit,
      offset,
    });

    return {
      orders,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  }

  static async getOrderById(id: number): Promise<Order | null> {
    return Order.findByPk(id, {
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
  }

  static async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    return Order.findOne({
      where: { order_number: orderNumber },
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
  }

  static async updateOrderStatus(id: number, status: OrderStatus): Promise<Order | null> {
    const order = await Order.findByPk(id);
    
    if (!order) {
      return null;
    }

    if (!order.canTransitionTo(status)) {
      throw new Error(`Cannot transition from ${order.status} to ${status}`);
    }

    const previousStatus = order.status;
    await order.updateStatus(status);

    logger.info(`Order status updated: ${order.order_number} -> ${status}`, {
      orderId: order.id,
      previousStatus,
      newStatus: status,
    });

    // Emit order status changed event
    orderEventService.emitOrderStatusChanged(order, previousStatus);

    // Generate automatic invoice when order is confirmed
    if (status === 'confirmed' && previousStatus !== 'confirmed') {
      try {
        await InvoiceService.generateAutomaticInvoice(order.id);
        logger.info(`Automatic invoice generated for confirmed order: ${order.order_number}`, {
          orderId: order.id,
        });
      } catch (error) {
        logger.error(`Failed to generate automatic invoice for order ${order.id}:`, error);
        // Don't fail the order status update if invoice generation fails
      }
    }

    return order;
  }

  static async updateTrackingInfo(
    id: number,
    trackingNumber: string,
    estimatedDelivery?: Date
  ): Promise<Order | null> {
    const order = await Order.findByPk(id);
    
    if (!order) {
      return null;
    }

    order.tracking_number = trackingNumber;
    if (estimatedDelivery) {
      order.estimated_delivery = estimatedDelivery;
    }

    await order.save();

    logger.info(`Tracking info updated: ${order.order_number}`, {
      orderId: order.id,
      trackingNumber,
      estimatedDelivery,
    });

    return order;
  }

  static async updateProviderOrderId(id: number, providerOrderId: string): Promise<Order | null> {
    const order = await Order.findByPk(id);
    
    if (!order) {
      return null;
    }

    order.provider_order_id = providerOrderId;
    await order.save();

    logger.info(`Provider order ID updated: ${order.order_number}`, {
      orderId: order.id,
      providerOrderId,
    });

    return order;
  }

  static async getUserOrders(userId: number, query: Omit<OrderQuery, 'user_id'>): Promise<OrderResponse> {
    return this.getOrders({ ...query, user_id: userId });
  }

  static async getOrderStats(userId?: number): Promise<any> {
    const where: any = {};
    if (userId) where.user_id = userId;

    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
    ] = await Promise.all([
      Order.count({ where }),
      Order.count({ where: { ...where, status: 'pending' } }),
      Order.count({ where: { ...where, status: 'delivered' } }),
      Order.count({ where: { ...where, status: 'cancelled' } }),
      Order.sum('total_amount', { where: { ...where, status: 'delivered' } }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue: totalRevenue || 0,
    };
  }

  static async getOrdersForAutoPurchase(): Promise<Order[]> {
    // Get orders that are confirmed but not yet processed for auto-purchase
    return Order.findAll({
      where: {
        status: 'confirmed',
        payment_status: 'completed',
        provider_order_id: null,
      } as any,
      include: [
        {
          model: OrderItem,
          as: 'items',
        },
      ],
      order: [['created_at', 'ASC']], // Process older orders first
    });
  }

  static async markOrderForProcessing(orderId: number): Promise<Order | null> {
    const order = await Order.findByPk(orderId);
    
    if (!order) {
      return null;
    }

    if (order.canTransitionTo('processing')) {
      await order.updateStatus('processing');
      
      logger.info(`Order marked for processing: ${order.order_number}`, {
        orderId: order.id,
      });
    }

    return order;
  }

  static async updateOrderWithProviderInfo(
    orderId: number,
    providerOrderId: string,
    providerName: string,
    trackingNumber?: string,
    estimatedDelivery?: Date
  ): Promise<Order | null> {
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          as: 'items',
        },
      ],
    });
    
    if (!order) {
      return null;
    }

    // Update order with provider information
    order.provider_order_id = providerOrderId;
    if (trackingNumber) {
      order.tracking_number = trackingNumber;
    }
    if (estimatedDelivery) {
      order.estimated_delivery = estimatedDelivery;
    }

    // Update order items with provider information
    const orderWithItems = order as any;
    if (orderWithItems.items && Array.isArray(orderWithItems.items)) {
      await Promise.all(
        orderWithItems.items.map(async (item: any) => {
          item.provider_name = providerName;
          await item.save();
        })
      );
    }

    // Update order status to shipped if tracking is available
    if (trackingNumber && order.canTransitionTo('shipped')) {
      await order.updateStatus('shipped');
    }

    await order.save();

    logger.info(`Order updated with provider info: ${order.order_number}`, {
      orderId: order.id,
      providerOrderId,
      providerName,
      trackingNumber,
    });

    return order;
  }

  static async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    return Order.findAll({
      where: { status },
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
      order: [['created_at', 'DESC']],
    });
  }

  static async getOrdersRequiringTrackingUpdate(): Promise<Order[]> {
    // Get orders that are shipped but don't have recent tracking updates
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return Order.findAll({
      where: {
        status: 'shipped',
        tracking_number: { [Op.ne]: null },
        updated_at: { [Op.lt]: oneDayAgo },
      } as any,
      include: [
        {
          model: OrderItem,
          as: 'items',
        },
      ],
    });
  }
}