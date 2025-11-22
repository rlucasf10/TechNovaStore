/**
 * Caso de uso: Obtener Pedidos
 * 
 * Obtiene una lista paginada de pedidos con filtros opcionales.
 */

import { Order, OrderStatus } from '../shared/models/Order';
import { OrderItem } from '../shared/models/OrderItem';
import { Invoice } from '../shared/models/Invoice';

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

export class GetOrders {
  async execute(query: OrderQuery): Promise<OrderResponse> {
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
}
