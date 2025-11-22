/**
 * Asociaciones de Modelos de Sequelize
 * 
 * Define todas las relaciones entre modelos.
 * Este archivo debe importarse después de que todos los modelos estén definidos.
 */

import { Order } from './Order';
import { OrderItem } from './OrderItem';
import { Invoice } from './Invoice';

let associationsInitialized = false;

export function initializeAssociations(): void {
  if (associationsInitialized) {
    return;
  }

  // Asociaciones Order <-> OrderItem
  Order.hasMany(OrderItem, {
    foreignKey: 'order_id',
    as: 'items',
  });

  OrderItem.belongsTo(Order, {
    foreignKey: 'order_id',
    as: 'order',
  });

  // Asociaciones Order <-> Invoice
  Order.hasOne(Invoice, {
    foreignKey: 'order_id',
    as: 'invoice',
  });

  Invoice.belongsTo(Order, {
    foreignKey: 'order_id',
    as: 'order',
  });

  associationsInitialized = true;
}
