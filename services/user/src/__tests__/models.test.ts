// Test models setup
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.test';

// Re-define models for testing with test database
export const User = sequelize.define('User', {
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
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  address: {
    type: DataTypes.JSON, // SQLite uses JSON instead of JSONB
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
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export const UserConsent = sequelize.define('UserConsent', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  consent_data: {
    type: DataTypes.JSON, // SQLite uses JSON instead of JSONB
    allowNull: false,
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'user_consents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export const AccountDeletionRequest = sequelize.define('AccountDeletionRequest', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'processed', 'cancelled', 'failed'),
    allowNull: false,
    defaultValue: 'pending',
  },
  scheduled_deletion_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  processed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'account_deletion_requests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Define associations
UserConsent.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(UserConsent, { foreignKey: 'user_id', as: 'consents' });

AccountDeletionRequest.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(AccountDeletionRequest, { foreignKey: 'user_id', as: 'deletion_requests' });