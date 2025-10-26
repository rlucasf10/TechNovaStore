import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from './index';

export const createTicketsTable: Migration = {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('tickets', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      ticket_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      customer_email: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      customer_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      subject: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      category: {
        type: DataTypes.ENUM(
          'order_issue',
          'payment_issue',
          'shipping_issue',
          'product_question',
          'technical_support',
          'refund_request',
          'complaint',
          'suggestion',
          'other'
        ),
        allowNull: false,
        defaultValue: 'other',
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium',
      },
      status: {
        type: DataTypes.ENUM('open', 'in_progress', 'waiting_customer', 'resolved', 'closed'),
        allowNull: false,
        defaultValue: 'open',
      },
      assigned_to: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'orders',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      first_response_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      resolved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      closed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      satisfaction_rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      satisfaction_comment: {
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
    await queryInterface.addIndex('tickets', ['ticket_number'], { unique: true });
    await queryInterface.addIndex('tickets', ['user_id']);
    await queryInterface.addIndex('tickets', ['customer_email']);
    await queryInterface.addIndex('tickets', ['status']);
    await queryInterface.addIndex('tickets', ['priority']);
    await queryInterface.addIndex('tickets', ['category']);
    await queryInterface.addIndex('tickets', ['assigned_to']);
    await queryInterface.addIndex('tickets', ['order_id']);
    await queryInterface.addIndex('tickets', ['created_at']);
    await queryInterface.addIndex('tickets', ['status', 'priority']);
    await queryInterface.addIndex('tickets', ['assigned_to', 'status']);
    await queryInterface.addIndex('tickets', ['category', 'status']);
    
    // GIN index for tags array
    await queryInterface.addIndex('tickets', ['tags'], {
      using: 'gin',
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('tickets');
  },
};