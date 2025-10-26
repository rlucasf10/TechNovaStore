import { DataTypes, Model, Optional } from 'sequelize';
import { postgresConnection } from '@technovastore/config';

// User attributes interface
export interface UserAttributes {
  id: number;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  role: 'customer' | 'admin' | 'support';
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLoginAt?: Date;
  preferences?: {
    language: string;
    currency: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

// Optional attributes for creation
export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// User model class
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public passwordHash!: string;
  public firstName!: string;
  public lastName!: string;
  public phone?: string;
  public address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  public billingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  public role!: 'customer' | 'admin' | 'support';
  public isActive!: boolean;
  public isEmailVerified!: boolean;
  public emailVerificationToken?: string;
  public passwordResetToken?: string;
  public passwordResetExpires?: Date;
  public lastLoginAt?: Date;
  public preferences?: {
    language: string;
    currency: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Virtual attributes
  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Instance methods
  public async updateLastLogin(): Promise<void> {
    this.lastLoginAt = new Date();
    await this.save();
  }

  public hasRole(role: string): boolean {
    return this.role === role;
  }

  public isAdmin(): boolean {
    return this.role === 'admin';
  }

  public isCustomer(): boolean {
    return this.role === 'customer';
  }

  public hasCompleteProfile(): boolean {
    return !!(this.firstName && this.lastName && this.phone && this.address);
  }
}

// Initialize the model
export const initUserModel = () => {
  const sequelize = postgresConnection.getConnection();
  if (!sequelize) {
    throw new Error('PostgreSQL connection not established');
  }

  User.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [1, 100],
      },
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [1, 100],
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: /^[\+]?[1-9][\d]{0,15}$/,
      },
    },
    address: {
      type: DataTypes.JSONB,
      allowNull: true,
      validate: {
        isValidAddress(value: any) {
          if (value && (!value.street || !value.city || !value.state || !value.postalCode || !value.country)) {
            throw new Error('Address must include street, city, state, postalCode, and country');
          }
        },
      },
    },
    billingAddress: {
      type: DataTypes.JSONB,
      allowNull: true,
      validate: {
        isValidAddress(value: any) {
          if (value && (!value.street || !value.city || !value.state || !value.postalCode || !value.country)) {
            throw new Error('Billing address must include street, city, state, postalCode, and country');
          }
        },
      },
    },
    role: {
      type: DataTypes.ENUM('customer', 'admin', 'support'),
      allowNull: false,
      defaultValue: 'customer',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    emailVerificationToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    passwordResetToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    preferences: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        language: 'es',
        currency: 'EUR',
        notifications: {
          email: true,
          sms: false,
          push: true,
        },
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
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
      {
        fields: ['role'],
      },
      {
        fields: ['is_active'],
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['email_verification_token'],
      },
      {
        fields: ['password_reset_token'],
      },
    ],
  });

  return User;
};