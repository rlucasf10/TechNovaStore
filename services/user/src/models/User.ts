import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import bcrypt from 'bcrypt';

export interface UserAttributes {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  role: 'customer' | 'admin';
  is_active: boolean;
  email_verified: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'created_at' | 'updated_at' | 'last_login'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public password_hash!: string;
  public first_name!: string;
  public last_name!: string;
  public phone?: string;
  public address?: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  public role!: 'customer' | 'admin';
  public is_active!: boolean;
  public email_verified!: boolean;
  public last_login?: Date;
  public created_at!: Date;
  public updated_at!: Date;

  // Instance methods
  public async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password_hash);
  }

  public static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  public override toJSON(): Partial<UserAttributes> {
    const values = { ...this.get() } as any;
    delete values.password_hash;
    return values;
  }
}

User.init(
  {
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
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100],
      },
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100],
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
    },
    role: {
      type: DataTypes.ENUM('customer', 'admin'),
      allowNull: false,
      defaultValue: 'customer',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    last_login: {
      type: DataTypes.DATE,
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
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['email'],
        unique: true,
      },
      {
        fields: ['role'],
      },
      {
        fields: ['is_active'],
      },
    ],
  }
);