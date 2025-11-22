/**
 * Caso de uso: Obtener Estadísticas de Pedidos
 * 
 * Calcula estadísticas agregadas de pedidos (totales, pendientes, completados, etc.).
 */

import { Order } from '../shared/models/Order';

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}

export class GetOrderStats {
  async execute(userId?: number): Promise<OrderStats> {
    const where: any = {};
    if (userId !== undefined && userId !== null) where.user_id = userId;

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
}
