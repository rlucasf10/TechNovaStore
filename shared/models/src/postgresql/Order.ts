import { DataTypes, Model, Optional } from 'sequelize';
import { postgresConnection } from '@technovastore/config';

// Order status enum
export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

// Payment status enum
export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'cancelled';

// Order attributes interface
export interface OrderAttributes {
  id: number;
  userId: number;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  subtotalAmount: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  currency: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  billingAddress: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  paymentMethod: string;
  paymentDetails?: {
    transactionId?: string;
    paymentGateway?: string;
    cardLast4?: string;
    cardBrand?: string;
  };
  providerOrderIds?: {
    [providerName: string]: string;
  };
  trackingNumbers?: {
    [providerName: string]: string;
  };
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  notes?: string;
  customerNotes?: string;
  internalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Optional attributes for creation
export interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Order model class
export class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: number;
  public userId!: number;
  public orderNumber!: string;
  public status!: OrderStatus;
  public paymentStatus!: PaymentStatus;
  public totalAmount!: number;
  public subtotalAmount!: number;
  public taxAmount!: number;
  public shippingAmount!: number;
  public discountAmount!: number;
  public currency!: string;
  public shippingAddress!: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  public billingAddress!: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  public paymentMethod!: string;
  public paymentDetails?: {
    transactionId?: string;
    paymentGateway?: string;
    cardLast4?: string;
    cardBrand?: string;
  };
  public providerOrderIds?: {
    [providerName: string]: string;
  };
  public trackingNumbers?: {
    [providerName: string]: string;
  };
  public estimatedDeliveryDate?: Date;
  public actualDeliveryDate?: Date;
  public notes?: string;
  public customerNotes?: string;
  public internalNotes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public async updateStatus(newStatus: OrderStatus): Promise<void> {
    this.status = newStatus;
    await this.save();
  }

  public async updatePaymentStatus(newStatus: PaymentStatus): Promise<void> {
    this.paymentStatus = newStatus;
    await this.save();
  }

  public async addProviderOrderId(providerName: string, orderId: string): Promise<void> {
    if (!this.providerOrderIds) {
      this.providerOrderIds = {};
    }
    this.providerOrderIds[providerName] = orderId;
    this.changed('providerOrderIds', true);
    await this.save();
  }

  public async addTrackingNumber(providerName: string, trackingNumber: string): Promise<void> {
    if (!this.trackingNumbers) {
      this.trackingNumbers = {};
    }
    this.trackingNumbers[providerName] = trackingNumber;
    this.changed('trackingNumbers', true);
    await this.save();
  }

  public isCompleted(): boolean {
    return this.status === 'delivered';
  }

  public isCancellable(): boolean {
    return ['pending', 'confirmed'].includes(this.status);
  }

  public isRefundable(): boolean {
    return ['delivered', 'cancelled'].includes(this.status) && this.paymentStatus === 'completed';
  }

  public getFullShippingAddress(): string {
    const addr = this.shippingAddress;
    return `${addr.firstName} ${addr.lastName}, ${addr.street}, ${addr.city}, ${addr.state} ${addr.postalCode}, ${addr.country}`;
  }

  public calculateTotalWithoutTax(): number {
    return this.subtotalAmount + this.shippingAmount - this.discountAmount;
  }
}

// Initialize the model
export const initOrderModel = () => {
  const sequelize = postgresConnection.getConnection();
  if (!sequelize) {
    throw new Error('PostgreSQL connection not established');
  }

  Order.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    orderNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'),
      allowNull: false,
      defaultValue: 'pending',
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    subtotalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    shippingAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'EUR',
      validate: {
        len: [3, 3],
        isUppercase: true,
      },
    },
    shippingAddress: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidAddress(value: any) {
          const required = ['firstName', 'lastName', 'street', 'city', 'state', 'postalCode', 'country'];
          for (const field of required) {
            if (!value[field]) {
              throw new Error(`Shipping address must include ${field}`);
            }
          }
        },
      },
    },
    billingAddress: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidAddress(value: any) {
          const required = ['firstName', 'lastName', 'street', 'city', 'state', 'postalCode', 'country'];
          for (const field of required) {
            if (!value[field]) {
              throw new Error(`Billing address must include ${field}`);
            }
          }
        },
      },
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    paymentDetails: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    providerOrderIds: {
      type: DataTypes.JSONB,
      allowNull: true,
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
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    customerNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    internalNotes: {
      type: DataTypes.TEXT,
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
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['order_number'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['payment_status'],
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['user_id', 'status'],
      },
      {
        fields: ['status', 'created_at'],
      },
    ],
  });

  return Order;
};