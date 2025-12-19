/**
 * Caso de uso: Crear Pedido
 * 
 * Crea un nuevo pedido con sus items, calculando el total
 * y emitiendo eventos correspondientes.
 */

import { Order } from '../shared/models/Order';
import { OrderItem } from '../shared/models/OrderItem';
import { logger } from '../shared/utils/logger';
import { sequelize } from '../config/database';
import { orderEventService } from '../shared/services/eventService';
import { SpanishTaxCalculator } from '../shared/utils/spanishTaxCalculator';

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

export class CreateOrder {
  async execute(orderData: CreateOrderData): Promise<Order> {
    const transaction = await sequelize.transaction();
    
    try {
      // Preparar items para cálculo de impuestos
      const itemsForTax = orderData.items.map(item => ({
        product_name: item.product_name,
        product_sku: item.product_sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity,
      }));

      // Calcular impuestos usando SpanishTaxCalculator
      const taxCalculation = SpanishTaxCalculator.calculateTaxes(itemsForTax, true);

      // Extraer valores calculados
      const subtotal = taxCalculation.subtotal;
      const tax_amount = taxCalculation.totalTax;

      // Calcular envío (gratis por ahora, puede ser dinámico en el futuro)
      const shipping_cost = 0;

      // Calcular descuentos (por ahora 0, se puede agregar lógica de cupones)
      const discount_amount = 0;

      // Calcular total final (subtotal + IVA + envío - descuentos)
      const total_amount = taxCalculation.totalWithTax + shipping_cost - discount_amount;

      // Crear pedido
      const order = await Order.create({
        user_id: orderData.user_id,
        subtotal,
        shipping_cost,
        tax_amount,
        discount_amount,
        total_amount,
        shipping_address: orderData.shipping_address,
        billing_address: orderData.billing_address,
        payment_method: orderData.payment_method,
        notes: orderData.notes,
        status: 'pending',
        payment_status: 'pending',
      }, { transaction });

      // Crear items del pedido
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_sku: item.product_sku,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity,
      }));

      await OrderItem.bulkCreate(orderItems, { transaction });

      await transaction.commit();

      logger.info(`Order created: ${order.order_number}`, {
        orderId: order.id,
        userId: order.user_id,
        totalAmount: order.total_amount,
      });

      // Emitir evento de pedido creado
      orderEventService.emitOrderCreated(order);

      return order;
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to create order:', error);
      throw error;
    }
  }
}
