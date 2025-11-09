import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface InvoiceAttributes {
  id: number;
  order_id: number;
  invoice_number: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  tax_rate: number;
  currency: string;
  issued_date: Date;
  due_date: Date;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  pdf_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface InvoiceCreationAttributes extends Optional<InvoiceAttributes, 'id' | 'invoice_number' | 'created_at' | 'updated_at'> {}

export class Invoice extends Model<InvoiceAttributes, InvoiceCreationAttributes> implements InvoiceAttributes {
  public id!: number;
  public order_id!: number;
  public invoice_number!: string;
  public subtotal!: number;
  public tax_amount!: number;
  public total_amount!: number;
  public tax_rate!: number;
  public currency!: string;
  public issued_date!: Date;
  public due_date!: Date;
  public status!: 'draft' | 'issued' | 'paid' | 'cancelled';
  public pdf_url?: string;
  public created_at!: Date;
  public updated_at!: Date;
}

Invoice.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'orders',
        key: 'id',
      },
    },
    invoice_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      defaultValue: () => `INV-${new Date().getFullYear()}-${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    tax_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    tax_rate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 0.21, // 21% IVA for Spain
      validate: {
        min: 0,
        max: 1,
      },
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'EUR',
    },
    issued_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
    status: {
      type: DataTypes.ENUM('draft', 'issued', 'paid', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft',
    },
    pdf_url: {
      type: DataTypes.STRING(500),
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
    modelName: 'Invoice',
    tableName: 'invoices',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['order_id'],
        unique: true,
      },
      {
        fields: ['invoice_number'],
        unique: true,
      },
      {
        fields: ['status'],
      },
      {
        fields: ['issued_date'],
      },
    ],
  }
);

// Define associations
import { Order } from './Order';

Order.hasOne(Invoice, {
  foreignKey: 'order_id',
  as: 'invoice',
});

Invoice.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order',
});