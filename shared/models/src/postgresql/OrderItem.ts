import { DataTypes, Model, Optional } from 'sequelize';
import { postgresConnection } from '@technovastore/config';

// Order item attributes interface
export interface OrderItemAttributes {
  id: number;
  orderId: number;
  productSku: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  providerName: string;
  providerItemId: string;
  providerPrice: number;
  markup: number;
  specifications?: {
    [key: string]: string | number | boolean;
  };
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Optional attributes for creation
export interface OrderItemCreationAttributes extends Optional<OrderItemAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Order item model class
export class OrderItem extends Model<OrderItemAttributes, OrderItemCreationAttributes> implements OrderItemAttributes {
  public id!: number;
  public orderId!: number;
  public productSku!: string;
  public productName!: string;
  public productImage?: string;
  public quantity!: number;
  public unitPrice!: number;
  public totalPrice!: number;
  public providerName!: string;
  public providerItemId!: string;
  public providerPrice!: number;
  public markup!: number;
  public specifications?: {
    [key: string]: string | number | boolean;
  };
  public status!: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  public trackingNumber?: string;
  public estimatedDelivery?: Date;
  public actualDelivery?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public async updateStatus(newStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'): Promise<void> {
    this.status = newStatus;
    await this.save();
  }

  public async setTrackingNumber(trackingNumber: string): Promise<void> {
    this.trackingNumber = trackingNumber;
    await this.save();
  }

  public calculateProfit(): number {
    return this.totalPrice - (this.providerPrice * this.quantity);
  }

  public getMarkupPercentage(): number {
    return ((this.unitPrice - this.providerPrice) / this.providerPrice) * 100;
  }

  public isDelivered(): boolean {
    return this.status === 'delivered';
  }

  public isCancellable(): boolean {
    return ['pending', 'confirmed'].includes(this.status);
  }
}

// Initialize the model
export const initOrderItemModel = () => {
  const sequelize = postgresConnection.getConnection();
  if (!sequelize) {
    throw new Error('PostgreSQL connection not established');
  }

  OrderItem.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id',
      },
    },
    productSku: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    productName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    productImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    providerName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    providerItemId: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    providerPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    markup: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
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
    trackingNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    estimatedDelivery: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    actualDelivery: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    sequelize,
    modelName: 'OrderItem',
    tableName: 'order_items',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['order_id'],
      },
      {
        fields: ['product_sku'],
      },
      {
        fields: ['provider_name'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['tracking_number'],
      },
      {
        fields: ['order_id', 'status'],
      },
      {
        fields: ['provider_name', 'status'],
      },
    ],
    validate: {
      totalPriceMatchesQuantity() {
        const expectedTotal = parseFloat(((this as any).unitPrice * (this as any).quantity).toFixed(2));
        const actualTotal = parseFloat((this as any).totalPrice.toString());
        if (Math.abs(expectedTotal - actualTotal) > 0.01) {
          throw new Error('Total price must equal unit price multiplied by quantity');
        }
      },
    },
  });

  return OrderItem;
};