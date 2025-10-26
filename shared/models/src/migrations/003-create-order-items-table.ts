import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from './index';

export const createOrderItemsTable: Migration = {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('order_items', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      product_sku: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      product_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      product_image: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      unit_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      total_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      provider_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      provider_item_id: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      provider_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      markup: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      specifications: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      tracking_number: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      estimated_delivery: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      actual_delivery: {
        type: DataTypes.DATE,
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
    await queryInterface.addIndex('order_items', ['order_id']);
    await queryInterface.addIndex('order_items', ['product_sku']);
    await queryInterface.addIndex('order_items', ['provider_name']);
    await queryInterface.addIndex('order_items', ['status']);
    await queryInterface.addIndex('order_items', ['tracking_number']);
    await queryInterface.addIndex('order_items', ['order_id', 'status']);
    await queryInterface.addIndex('order_items', ['provider_name', 'status']);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('order_items');
  },
};