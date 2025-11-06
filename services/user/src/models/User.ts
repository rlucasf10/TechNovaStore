import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import bcrypt from 'bcrypt';

export interface AuthMethod {
  type: 'password' | 'google' | 'github';
  providerId?: string;
  linkedAt: Date;
  lastUsed?: Date;
}

export interface UserAttributes {
  id: number;
  email: string;
  password_hash: string | null; // Nullable para usuarios OAuth sin contraseña
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
  // OAuth fields
  google_id?: string;
  github_id?: string;
  auth_methods: AuthMethod[];
  created_at: Date;
  updated_at: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'created_at' | 'updated_at' | 'last_login'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare email: string;
  declare password_hash: string | null;
  declare first_name: string;
  declare last_name: string;
  declare phone?: string;
  declare address?: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  declare role: 'customer' | 'admin';
  declare is_active: boolean;
  declare email_verified: boolean;
  declare last_login?: Date;
  declare google_id?: string;
  declare github_id?: string;
  declare auth_methods: AuthMethod[];
  declare created_at: Date;
  declare updated_at: Date;

  // Instance methods
  public async validatePassword(password: string): Promise<boolean> {
    if (!this.password_hash) {
      return false; // Usuario OAuth sin contraseña
    }
    return bcrypt.compare(password, this.password_hash);
  }

  public hasAuthMethod(type: 'password' | 'google' | 'github'): boolean {
    return this.auth_methods.some((method) => method.type === type);
  }

  public async addAuthMethod(type: 'password' | 'google' | 'github', providerId?: string): Promise<void> {
    const methods = this.auth_methods || [];
    if (!methods.some((m) => m.type === type)) {
      methods.push({
        type,
        providerId,
        linkedAt: new Date(),
      });
      this.auth_methods = methods;
      await this.save();
    }
  }

  public async removeAuthMethod(type: 'password' | 'google' | 'github'): Promise<void> {
    this.auth_methods = (this.auth_methods || []).filter((m) => m.type !== type);
    await this.save();
  }

  public async updateAuthMethodLastUsed(type: 'password' | 'google' | 'github'): Promise<void> {
    const methods = this.auth_methods || [];
    const method = methods.find((m) => m.type === type);
    if (method) {
      method.lastUsed = new Date();
      this.auth_methods = methods;
      await this.save();
    }
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
      allowNull: true, // Nullable para usuarios OAuth sin contraseña
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
    google_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    github_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    auth_methods: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
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