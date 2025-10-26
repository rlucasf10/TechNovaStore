import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

export interface AccountDeletionRequestAttributes {
  id: number;
  user_id: number;
  reason?: string;
  status: 'pending' | 'processed' | 'cancelled' | 'failed';
  scheduled_deletion_date: Date;
  processed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AccountDeletionRequestCreationAttributes extends Optional<AccountDeletionRequestAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class AccountDeletionRequest extends Model<AccountDeletionRequestAttributes, AccountDeletionRequestCreationAttributes> implements AccountDeletionRequestAttributes {
  public id!: number;
  public user_id!: number;
  public reason?: string;
  public status!: 'pending' | 'processed' | 'cancelled' | 'failed';
  public scheduled_deletion_date!: Date;
  public processed_at?: Date;
  public created_at!: Date;
  public updated_at!: Date;
}

AccountDeletionRequest.init(
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
        model: User,
        key: 'id',
      },
      onDelete: 'CASCADE',
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
    modelName: 'AccountDeletionRequest',
    tableName: 'account_deletion_requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['scheduled_deletion_date'],
      },
    ],
  }
);

// Define associations
AccountDeletionRequest.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(AccountDeletionRequest, { foreignKey: 'user_id', as: 'deletion_requests' });