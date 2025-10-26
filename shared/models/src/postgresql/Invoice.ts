import { DataTypes, Model, Optional } from 'sequelize';
import { postgresConnection } from '@technovastore/config';

// Invoice attributes interface
export interface InvoiceAttributes {
  id: number;
  orderId: number;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  customerInfo: {
    name: string;
    email: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    taxId?: string;
  };
  companyInfo: {
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    taxId: string;
    email: string;
    phone: string;
    website?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    taxRate: number;
  }>;
  notes?: string;
  terms?: string;
  paymentMethod?: string;
  paidAt?: Date;
  paidAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Optional attributes for creation
export interface InvoiceCreationAttributes extends Optional<InvoiceAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Invoice model class
export class Invoice extends Model<InvoiceAttributes, InvoiceCreationAttributes> implements InvoiceAttributes {
  public id!: number;
  public orderId!: number;
  public invoiceNumber!: string;
  public issueDate!: Date;
  public dueDate!: Date;
  public status!: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  public subtotal!: number;
  public taxRate!: number;
  public taxAmount!: number;
  public totalAmount!: number;
  public currency!: string;
  public customerInfo!: {
    name: string;
    email: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    taxId?: string;
  };
  public companyInfo!: {
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    taxId: string;
    email: string;
    phone: string;
    website?: string;
  };
  public items!: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    taxRate: number;
  }>;
  public notes?: string;
  public terms?: string;
  public paymentMethod?: string;
  public paidAt?: Date;
  public paidAmount?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public async markAsPaid(amount?: number, paymentMethod?: string): Promise<void> {
    this.status = 'paid';
    this.paidAt = new Date();
    this.paidAmount = amount || this.totalAmount;
    if (paymentMethod) {
      this.paymentMethod = paymentMethod;
    }
    await this.save();
  }

  public async markAsOverdue(): Promise<void> {
    if (this.dueDate < new Date() && this.status === 'sent') {
      this.status = 'overdue';
      await this.save();
    }
  }

  public isOverdue(): boolean {
    return this.dueDate < new Date() && this.status !== 'paid' && this.status !== 'cancelled';
  }

  public isPaid(): boolean {
    return this.status === 'paid';
  }

  public getRemainingAmount(): number {
    if (this.paidAmount) {
      return Math.max(0, this.totalAmount - this.paidAmount);
    }
    return this.totalAmount;
  }

  public getDaysOverdue(): number {
    if (!this.isOverdue()) return 0;
    const today = new Date();
    const diffTime = today.getTime() - this.dueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `INV-${year}${month}-${timestamp}`;
  }
}

// Initialize the model
export const initInvoiceModel = () => {
  const sequelize = postgresConnection.getConnection();
  if (!sequelize) {
    throw new Error('PostgreSQL connection not established');
  }

  Invoice.init({
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
    invoiceNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    issueDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    dueDate: {
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
      validate: {
        min: 0,
      },
    },
    taxRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 21.00, // Spanish IVA rate
      validate: {
        min: 0,
        max: 100,
      },
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
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
    customerInfo: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidCustomerInfo(value: any) {
          const required = ['name', 'email', 'address'];
          for (const field of required) {
            if (!value[field]) {
              throw new Error(`Customer info must include ${field}`);
            }
          }
          const addressRequired = ['street', 'city', 'state', 'postalCode', 'country'];
          for (const field of addressRequired) {
            if (!value.address[field]) {
              throw new Error(`Customer address must include ${field}`);
            }
          }
        },
      },
    },
    companyInfo: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidCompanyInfo(value: any) {
          const required = ['name', 'address', 'taxId', 'email', 'phone'];
          for (const field of required) {
            if (!value[field]) {
              throw new Error(`Company info must include ${field}`);
            }
          }
          const addressRequired = ['street', 'city', 'state', 'postalCode', 'country'];
          for (const field of addressRequired) {
            if (!value.address[field]) {
              throw new Error(`Company address must include ${field}`);
            }
          }
        },
      },
    },
    items: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidItems(value: any[]) {
          if (!Array.isArray(value) || value.length === 0) {
            throw new Error('Invoice must have at least one item');
          }
          for (const item of value) {
            const required = ['description', 'quantity', 'unitPrice', 'totalPrice', 'taxRate'];
            for (const field of required) {
              if (item[field] === undefined || item[field] === null) {
                throw new Error(`Invoice item must include ${field}`);
              }
            }
          }
        },
      },
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
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paidAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
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
    modelName: 'Invoice',
    tableName: 'invoices',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['invoice_number'],
      },
      {
        fields: ['order_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['issue_date'],
      },
      {
        fields: ['due_date'],
      },
      {
        fields: ['status', 'due_date'],
      },
    ],
    validate: {
      totalAmountIsCorrect() {
        const expectedTotal = parseFloat(((this as any).subtotal + (this as any).taxAmount).toFixed(2));
        const actualTotal = parseFloat((this as any).totalAmount.toString());
        if (Math.abs(expectedTotal - actualTotal) > 0.01) {
          throw new Error('Total amount must equal subtotal plus tax amount');
        }
      },
      taxAmountIsCorrect() {
        const expectedTax = parseFloat(((this as any).subtotal * ((this as any).taxRate / 100)).toFixed(2));
        const actualTax = parseFloat((this as any).taxAmount.toString());
        if (Math.abs(expectedTax - actualTax) > 0.01) {
          throw new Error('Tax amount must equal subtotal multiplied by tax rate');
        }
      },
    },
  });

  return Invoice;
};