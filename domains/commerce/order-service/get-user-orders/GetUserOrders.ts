/**
 * Caso de uso: Obtener Pedidos de Usuario
 * 
 * Obtiene todos los pedidos de un usuario específico con paginación.
 */

import { GetOrders, OrderQuery, OrderResponse } from '../get-orders/GetOrders';

export class GetUserOrders {
  private getOrders: GetOrders;

  constructor() {
    this.getOrders = new GetOrders();
  }

  async execute(userId: number, query: Omit<OrderQuery, 'user_id'>): Promise<OrderResponse> {
    return this.getOrders.execute({ ...query, user_id: userId });
  }
}
