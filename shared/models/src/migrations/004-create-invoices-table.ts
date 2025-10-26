import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from './index';

export const createInvoicesTable: Migration = {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('invoices', {
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
      invoice_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      issue_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      due_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft',
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      tax_rate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 21.00,
      },
      tax_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'EUR',
      },
      customer_info: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      company_info: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      items: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      terms: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: 'Payment due within 30 days of invoice date.',
      },
      payment_method: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      paid_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      paid_amount: {
        type: DataTypes.DECIMAL(10, 2),
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
    await queryInterface.addIndex('invoices', ['invoice_number'], { unique: true });
    await queryInterface.addIndex('invoices', ['order_id']);
    await queryInterface.addIndex('invoices', ['status']);
    await queryInterface.addIndex('invoices', ['issue_date']);
    await queryInterface.addIndex('invoices', ['due_date']);
    await queryInterface.addIndex('invoices', ['status', 'due_date']);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('invoices');
  },
};