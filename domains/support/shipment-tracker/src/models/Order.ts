import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface OrderAttributes {
  id: string;
  orderNumber: string;
  userId: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  trackingNumbers?: Record<string, string>;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: string;
  public orderNumber!: string;
  public userId!: string;
  public status!: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  public trackingNumbers?: Record<string, string>;
  public estimatedDeliveryDate?: Date;
  public actualDeliveryDate?: Date;
  public shippingAddress!: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public async updateStatus(newStatus: OrderAttributes['status']): Promise<void> {
    this.status = newStatus;
    await this.save();
  }
}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'),
      allowNull: false,
      defaultValue: 'pending',
    },
    trackingNumbers: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    estimatedDeliveryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    actualDeliveryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    shippingAddress: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'orders',
    timestamps: true,
    underscored: true,
  }
);
