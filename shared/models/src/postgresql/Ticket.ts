import { DataTypes, Model, Optional } from 'sequelize';
import { postgresConnection } from '@technovastore/config';

// Ticket priority enum
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

// Ticket status enum
export type TicketStatus = 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';

// Ticket category enum
export type TicketCategory = 
  | 'order_issue'
  | 'payment_issue'
  | 'shipping_issue'
  | 'product_question'
  | 'technical_support'
  | 'refund_request'
  | 'complaint'
  | 'suggestion'
  | 'other';

// Ticket attributes interface
export interface TicketAttributes {
  id: number;
  ticketNumber: string;
  userId?: number;
  customerEmail: string;
  customerName: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: number;
  orderId?: number;
  tags?: string[];
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
    source?: string;
  };
  firstResponseAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  satisfactionRating?: number;
  satisfactionComment?: string;
  internalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Optional attributes for creation
export interface TicketCreationAttributes extends Optional<TicketAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Ticket model class
export class Ticket extends Model<TicketAttributes, TicketCreationAttributes> implements TicketAttributes {
  public id!: number;
  public ticketNumber!: string;
  public userId?: number;
  public customerEmail!: string;
  public customerName!: string;
  public subject!: string;
  public description!: string;
  public category!: TicketCategory;
  public priority!: TicketPriority;
  public status!: TicketStatus;
  public assignedTo?: number;
  public orderId?: number;
  public tags?: string[];
  public metadata?: {
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
    source?: string;
  };
  public firstResponseAt?: Date;
  public resolvedAt?: Date;
  public closedAt?: Date;
  public satisfactionRating?: number;
  public satisfactionComment?: string;
  public internalNotes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public async updateStatus(newStatus: TicketStatus): Promise<void> {
    const oldStatus = this.status;
    this.status = newStatus;

    // Set timestamps based on status changes
    if (newStatus === 'resolved' && oldStatus !== 'resolved') {
      this.resolvedAt = new Date();
    }
    if (newStatus === 'closed' && oldStatus !== 'closed') {
      this.closedAt = new Date();
    }

    await this.save();
  }

  public async assignTo(userId: number): Promise<void> {
    this.assignedTo = userId;
    if (this.status === 'open') {
      this.status = 'in_progress';
    }
    await this.save();
  }

  public async addFirstResponse(): Promise<void> {
    if (!this.firstResponseAt) {
      this.firstResponseAt = new Date();
      await this.save();
    }
  }

  public async setPriority(priority: TicketPriority): Promise<void> {
    this.priority = priority;
    await this.save();
  }

  public async addTag(tag: string): Promise<void> {
    if (!this.tags) {
      this.tags = [];
    }
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.changed('tags', true);
      await this.save();
    }
  }

  public async removeTag(tag: string): Promise<void> {
    if (this.tags) {
      this.tags = this.tags.filter(t => t !== tag);
      this.changed('tags', true);
      await this.save();
    }
  }

  public async setSatisfactionRating(rating: number, comment?: string): Promise<void> {
    this.satisfactionRating = rating;
    if (comment) {
      this.satisfactionComment = comment;
    }
    await this.save();
  }

  public isOpen(): boolean {
    return ['open', 'in_progress', 'waiting_customer'].includes(this.status);
  }

  public isClosed(): boolean {
    return ['resolved', 'closed'].includes(this.status);
  }

  public getResponseTime(): number | null {
    if (!this.firstResponseAt) return null;
    return this.firstResponseAt.getTime() - this.createdAt.getTime();
  }

  public getResolutionTime(): number | null {
    if (!this.resolvedAt) return null;
    return this.resolvedAt.getTime() - this.createdAt.getTime();
  }

  public getAge(): number {
    return Date.now() - this.createdAt.getTime();
  }

  public generateTicketNumber(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `TKT-${year}${month}-${timestamp}`;
  }
}

// Initialize the model
export const initTicketModel = () => {
  const sequelize = postgresConnection.getConnection();
  if (!sequelize) {
    throw new Error('PostgreSQL connection not established');
  }

  Ticket.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ticketNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    customerEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    customerName: {
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
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'orders',
        key: 'id',
      },
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
    firstResponseAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    closedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    satisfactionRating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5,
      },
    },
    satisfactionComment: {
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
    modelName: 'Ticket',
    tableName: 'tickets',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['ticket_number'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['customer_email'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['priority'],
      },
      {
        fields: ['category'],
      },
      {
        fields: ['assigned_to'],
      },
      {
        fields: ['order_id'],
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['status', 'priority'],
      },
      {
        fields: ['assigned_to', 'status'],
      },
      {
        fields: ['category', 'status'],
      },
      {
        fields: ['tags'],
        using: 'gin',
      },
    ],
  });

  return Ticket;
};