import { User, initUserModel } from './User';
import { Order, initOrderModel } from './Order';
import { OrderItem, initOrderItemModel } from './OrderItem';
import { Invoice, initInvoiceModel } from './Invoice';
import { Ticket, initTicketModel } from './Ticket';

// Initialize all models
export const initializePostgreSQLModels = () => {
  // Initialize models
  initUserModel();
  initOrderModel();
  initOrderItemModel();
  initInvoiceModel();
  initTicketModel();

  // Define associations
  setupAssociations();

  return {
    User,
    Order,
    OrderItem,
    Invoice,
    Ticket,
  };
};

// Setup model associations
export const setupAssociations = () => {
  // User associations
  User.hasMany(Order, {
    foreignKey: 'userId',
    as: 'orders',
    onDelete: 'CASCADE',
  });

  User.hasMany(Ticket, {
    foreignKey: 'userId',
    as: 'tickets',
    onDelete: 'SET NULL',
  });

  User.hasMany(Ticket, {
    foreignKey: 'assignedTo',
    as: 'assignedTickets',
    onDelete: 'SET NULL',
  });

  // Order associations
  Order.belongsTo(User, {
    foreignKey: 'userId',
    as: 'customer',
  });

  Order.hasMany(OrderItem, {
    foreignKey: 'orderId',
    as: 'items',
    onDelete: 'CASCADE',
  });

  Order.hasOne(Invoice, {
    foreignKey: 'orderId',
    as: 'invoice',
    onDelete: 'CASCADE',
  });

  Order.hasMany(Ticket, {
    foreignKey: 'orderId',
    as: 'tickets',
    onDelete: 'SET NULL',
  });

  // OrderItem associations
  OrderItem.belongsTo(Order, {
    foreignKey: 'orderId',
    as: 'order',
  });

  // Invoice associations
  Invoice.belongsTo(Order, {
    foreignKey: 'orderId',
    as: 'order',
  });

  // Ticket associations
  Ticket.belongsTo(User, {
    foreignKey: 'userId',
    as: 'customer',
  });

  Ticket.belongsTo(User, {
    foreignKey: 'assignedTo',
    as: 'assignee',
  });

  Ticket.belongsTo(Order, {
    foreignKey: 'orderId',
    as: 'order',
  });
};

// Export models for easy access
export {
  User,
  Order,
  OrderItem,
  Invoice,
  Ticket,
};