import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface OrderItemAttributes {
  id: number;
  order_id: number;
  product_sku: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  provider_name?: string;
  provider_item_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItemCreationAttributes extends Optional<OrderItemAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class OrderItem extends Model<OrderItemAttributes, OrderItemCreationAttributes> implements OrderItemAttributes {
  public id!: number;
  public order_id!: number;
  public product_sku!: string;
  public product_name!: string;
  public quantity!: number;
  public unit_price!: number;
  public total_price!: number;
  public provider_name?: string;
  public provider_item_id?: string;
  public created_at!: Date;
  public updated_at!: Date;
}

OrderItem.init(
  {
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
    },
    product_sku: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    product_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    total_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    provider_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    provider_item_id: {
      type: DataTypes.STRING(100),
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
  },
  {
    sequelize,
    modelName: 'OrderItem',
    tableName: 'order_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['order_id'],
      },
      {
        fields: ['product_sku'],
      },
    ],
  }
);

// Define associations
import { Order } from './Order';

Order.hasMany(OrderItem, {
  foreignKey: 'order_id',
  as: 'items',
});

OrderItem.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order',
});