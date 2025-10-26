import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from './index';

export const createOrdersTable: Migration = {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('orders', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      order_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'),
        allowNull: false,
        defaultValue: 'pending',
      },
      payment_status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      subtotal_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      tax_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      shipping_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      discount_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'EUR',
      },
      shipping_address: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      billing_address: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      payment_method: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      payment_details: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      provider_order_ids: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      tracking_numbers: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      estimated_delivery_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      actual_delivery_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      customer_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      internal_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // Create indexes
    await queryInterface.addIndex('orders', ['order_number'], { unique: true });
    await queryInterface.addIndex('orders', ['user_id']);
    await queryInterface.addIndex('orders', ['status']);
    await queryInterface.addIndex('orders', ['payment_status']);
    await queryInterface.addIndex('orders', ['created_at']);
    await queryInterface.addIndex('orders', ['user_id', 'status']);
    await queryInterface.addIndex('orders', ['status', 'created_at']);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('orders');
  },
};