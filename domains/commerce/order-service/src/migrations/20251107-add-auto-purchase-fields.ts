import { QueryInterface, DataTypes } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    // Add auto-purchase related fields to orders table
    await queryInterface.addColumn('orders', 'provider_name', {
      type: DataTypes.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn('orders', 'actual_cost', {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    });

    await queryInterface.addColumn('orders', 'auto_purchase_enabled', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn('orders', 'auto_purchase_attempts', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn('orders', 'auto_purchase_last_error', {
      type: DataTypes.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('orders', 'auto_purchase_provider_attempts', {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    });

    // Add index for auto-purchase queries
    await queryInterface.addIndex('orders', ['auto_purchase_enabled', 'status', 'payment_status'], {
      name: 'idx_orders_auto_purchase',
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    // Remove index
    await queryInterface.removeIndex('orders', 'idx_orders_auto_purchase');

    // Remove columns
    await queryInterface.removeColumn('orders', 'auto_purchase_provider_attempts');
    await queryInterface.removeColumn('orders', 'auto_purchase_last_error');
    await queryInterface.removeColumn('orders', 'auto_purchase_attempts');
    await queryInterface.removeColumn('orders', 'auto_purchase_enabled');
    await queryInterface.removeColumn('orders', 'actual_cost');
    await queryInterface.removeColumn('orders', 'provider_name');
  },
};
