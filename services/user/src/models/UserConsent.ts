import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

export interface ConsentData {
  necessary_cookies: boolean;
  analytics_cookies: boolean;
  marketing_cookies: boolean;
  data_processing: boolean;
  email_marketing: boolean;
  third_party_sharing: boolean;
}

export interface UserConsentAttributes {
  id: number;
  user_id: number;
  consent_data: ConsentData;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserConsentCreationAttributes extends Optional<UserConsentAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class UserConsent extends Model<UserConsentAttributes, UserConsentCreationAttributes> implements UserConsentAttributes {
  public id!: number;
  public user_id!: number;
  public consent_data!: ConsentData;
  public ip_address?: string;
  public user_agent?: string;
  public created_at!: Date;
  public updated_at!: Date;
}

UserConsent.init(
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
    consent_data: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidConsent(value: ConsentData) {
          const requiredFields = [
            'necessary_cookies',
            'analytics_cookies', 
            'marketing_cookies',
            'data_processing',
            'email_marketing',
            'third_party_sharing'
          ];
          
          for (const field of requiredFields) {
            if (typeof value[field as keyof ConsentData] !== 'boolean') {
              throw new Error(`${field} must be a boolean value`);
            }
          }
        },
      },
    },
    ip_address: {
      type: DataTypes.INET,
      allowNull: true,
    },
    user_agent: {
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
    modelName: 'UserConsent',
    tableName: 'user_consents',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
);

// Define associations
UserConsent.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(UserConsent, { foreignKey: 'user_id', as: 'consents' });