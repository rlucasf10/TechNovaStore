import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import { v4 as uuidv4 } from 'uuid';

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded';

export interface Address {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface OrderAttributes {
  id: number;
  user_id: number;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  shipping_address: Address;
  billing_address: Address;
  payment_method: string;
  payment_status: PaymentStatus;
  provider_order_id?: string;
  provider_name?: string;
  tracking_number?: string;
  estimated_delivery?: Date;
  actual_cost?: number;
  auto_purchase_enabled?: boolean;
  auto_purchase_attempts?: number;
  auto_purchase_last_error?: string;
  auto_purchase_provider_attempts?: string[];
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'order_number' | 'created_at' | 'updated_at'> {}

export class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: number;
  public user_id!: number;
  public order_number!: string;
  public status!: OrderStatus;
  public subtotal!: number;
  public shipping_cost!: number;
  public tax_amount!: number;
  public discount_amount!: number;
  public total_amount!: number;
  public shipping_address!: Address;
  public billing_address!: Address;
  public payment_method!: string;
  public payment_status!: PaymentStatus;
  public provider_order_id?: string;
  public provider_name?: string;
  public tracking_number?: string;
  public estimated_delivery?: Date;
  public actual_cost?: number;
  public auto_purchase_enabled?: boolean;
  public auto_purchase_attempts?: number;
  public auto_purchase_last_error?: string;
  public auto_purchase_provider_attempts?: string[];
  public notes?: string;
  public created_at!: Date;
  public updated_at!: Date;

  // Instance methods
  public canTransitionTo(newStatus: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: ['refunded'],
      cancelled: [],
      refunded: [],
    };

    return validTransitions[this.status].includes(newStatus);
  }

  public async updateStatus(newStatus: OrderStatus): Promise<void> {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
    }

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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    order_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      defaultValue: () => `ORD-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'),
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
      comment: 'Suma de productos sin IVA ni envío',
    },
    shipping_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
      comment: 'Costo de envío',
    },
    tax_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
      comment: 'IVA calculado',
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
      comment: 'Descuentos aplicados',
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
      comment: 'Total final (subtotal + envío + IVA - descuentos)',
    },
    shipping_address: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidAddress(value: Address) {
          if (!value.street || !value.city || !value.postal_code || !value.country) {
            throw new Error('Shipping address must include street, city, postal code, and country');
          }
        },
      },
    },
    billing_address: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidAddress(value: Address) {
          if (!value.street || !value.city || !value.postal_code || !value.country) {
            throw new Error('Billing address must include street, city, postal code, and country');
          }
        },
      },
    },
    payment_method: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'refunded'),
      allowNull: false,
    },
    provider_order_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    provider_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    tracking_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    estimated_delivery: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    actual_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    auto_purchase_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    auto_purchase_attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    auto_purchase_last_error: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    auto_purchase_provider_attempts: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    notes: {
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
  },
  {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['order_number'],
        unique: true,
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
    ],
  }
);