import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface OrderAttributes {
  id: number;
  orderNumber: string;
  userId: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  totalAmount: number;
  shippingAddress: Record<string, any>;
  billingAddress: Record<string, any>;
  paymentMethod: string;
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  providerOrderId?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  notes?: string;
  providerName?: string;
  actualCost?: number;
  autoPurchaseEnabled: boolean;
  autoPurchaseAttempts: number;
  autoPurchaseLastError?: string;
  autoPurchaseProviderAttempts?: Record<string, any>[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: number;
  public orderNumber!: string;
  public userId!: number;
  public status!: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  public totalAmount!: number;
  public shippingAddress!: Record<string, any>;
  public billingAddress!: Record<string, any>;
  public paymentMethod!: string;
  public paymentStatus!: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  public providerOrderId?: string;
  public trackingNumber?: string;
  public estimatedDelivery?: Date;
  public notes?: string;
  public providerName?: string;
  public actualCost?: number;
  public autoPurchaseEnabled!: boolean;
  public autoPurchaseAttempts!: number;
  public autoPurchaseLastError?: string;
  public autoPurchaseProviderAttempts?: Record<string, any>[];

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
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    orderNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'),
      allowNull: false,
      defaultValue: 'pending',
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    shippingAddress: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    billingAddress: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'refunded'),
      allowNull: false,
      defaultValue: 'pending',
    },
    providerOrderId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    trackingNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    estimatedDelivery: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    providerName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    actualCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    autoPurchaseEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    autoPurchaseAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    autoPurchaseLastError: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    autoPurchaseProviderAttempts: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
  },
  {
    sequelize,
    tableName: 'orders',
    timestamps: true,
    underscored: true,
  }
);
